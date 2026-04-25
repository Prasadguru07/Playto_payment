# Playto Payout Engine — EXPLAINER

## 1. The Ledger

### `get_available_balance` (actual code)

The implementation in `ledger/utils.py` uses a **single** `aggregate` over all `LedgerEntry` rows: credits add `amount_paise`, debits subtract it. We use `F("amount_paise")` (not a string) so the database always interprets the column, not a literal.

```python
def get_available_balance(merchant_id):
    """Single-aggregate ledger net in paise: credits minus debits (all ledger rows)."""
    result = LedgerEntry.objects.filter(merchant_id=merchant_id).aggregate(
        balance=Coalesce(
            Sum(
                Case(
                    When(entry_type="credit", then=F("amount_paise")),
                    When(entry_type="debit", then=-1 * F("amount_paise")),
                    output_field=BigIntegerField(),
                )
            ),
            Value(0),
            output_field=BigIntegerField(),
        )
    )
    return result["balance"]
```

**Why rows, not “balance as a column”?** Appending an immutable `LedgerEntry` for each business event gives you a time-ordered audit trail. You can also prove “what the balance was at time T” from history. A single `SUM` over typed rows reuses the same index-friendly aggregate plan PostgreSQL is good at, without pulling rows into Python.

### `get_held_balance`

Money reserved for in-flight payouts (pending or processing) is a separate aggregate on `PayoutRequest`, not guessed from the ledger alone:

```python
def get_held_balance(merchant_id):
    result = PayoutRequest.objects.filter(
        merchant_id=merchant_id,
        status__in=(PayoutRequest.Status.PENDING, PayoutRequest.Status.PROCESSING),
    ).aggregate(
        held=Coalesce(
            Sum("amount_paise"),
            Value(0),
            output_field=BigIntegerField(),
        )
    )
    return result["held"]
```

**Spendable** balance for a new payout: `get_available_balance(merchant_id) - get_held_balance(merchant_id)` (the net ledger already includes the hold debit; subtracting in-flight payout totals yields what can still be requested without double spending).

---

## 2. The Lock

### `select_for_update` (actual code)

```python
with transaction.atomic():
    Merchant.objects.select_for_update().get(id=merchant.id)
    available = get_available_balance(merchant.id)
    held = get_held_balance(merchant.id)
    spendable = available - held
    ...
```

**PostgreSQL advisory lock vs row lock**  
- **Advisory lock**: application-defined integer keys, not tied to a row. You can forget to release, and two code paths that should coordinate might pick different lock IDs by mistake.  
- **`SELECT … FOR UPDATE` on a row**: the lock is tied to a real `Merchant` row, released when the transaction ends. It serializes *all* payout paths that start by locking the same merchant, which is exactly the invariant we need.

**Why lock `Merchant`, not `LedgerEntry`?** The dangerous race is “two requests both think the spendable amount is the same and both pass the check.” There is one natural per-merchant row (`Merchant`); we lock that row so the balance check, payout insert, hold debit, and idempotency record for that request happen as one critical section.

**What happens to a second request while the first holds the lock?** The second `SELECT FOR UPDATE` **blocks** until the first transaction commits or rolls back. It then sees the updated ledger and in-flight holds and either succeeds with enough headroom or gets `400 Insufficient balance`.

---

## 3. Idempotency

### Order: lookup *before* lock (actual code)

```python
def _replay_idempotency(merchant, key):
    try:
        existing = IdempotencyKey.objects.get(merchant=merchant, key=key)
    except IdempotencyKey.DoesNotExist:
        return None
    if existing.expires_at <= now():
        return None
    return Response(existing.response_body, status=existing.response_status)

# in post()
replay = _replay_idempotency(merchant, idempotency_key)
if replay is not None:
    return replay

with transaction.atomic():
    Merchant.objects.select_for_update().get(id=merchant.id)
    # ... create Payout, debit, IdempotencyKey ...
```

**Why this order?** A replay should be a cheap read and must **not** take the merchant lock or mutate state. The lock is for writers who are creating a *new* idempotent response.

**Two concurrent requests with the same key** (both miss the pre-lock cache): one wins `IdempotencyKey(merchant, key)` first; the other hits `UNIQUE(merchant, key)` and gets `IntegrityError` after the transaction rolls back. The loser then re-reads the stored row and returns the same `response_body` / `response_status` as the winner. That is implemented with:

```python
except IntegrityError:
    existing = IdempotencyKey.objects.filter(merchant=merchant, key=idempotency_key).first()
    if existing is not None and existing.expires_at > now():
        return Response(existing.response_body, status=existing.response_status)
    raise
```

**Note:** Payout, debit, and `IdempotencyKey` are created in the **same** `transaction.atomic()` block; Celery is scheduled with `transaction.on_commit` so a worker never runs before the row is visible.

---

## 4. The State Machine

### `VALID_TRANSITIONS` and guard (actual code)

```python
VALID_TRANSITIONS = {
    "pending": ("processing",),
    "processing": ("completed", "failed"),
}

def transition_payout(payout_id, new_status, release_funds=False):
    with transaction.atomic():
        payout = PayoutRequest.objects.select_for_update().get(id=payout_id)
        allowed = list(VALID_TRANSITIONS.get(payout.status, ()))
        if new_status not in allowed:
            raise InvalidStateTransition(
                f"Cannot transition {payout.status} → {new_status}"
            )
        ...
```

`completed` and `failed` are **terminal** (no keys in the dict, so the default is `()`).

**Why `select_for_update` inside `transition_payout`?** Two workers could otherwise both read the same `processing` state and “finish” the payout, or one could complete while another refunds. The row lock enforces a single decision per payout in the database, inside one transaction, together with a refund `LedgerEntry` when `release_funds` is set on failure.

### Failed payout refund in the *same* transaction

```python
        if release_funds and new_status == "failed":
            LedgerEntry.objects.create(
                merchant_id=payout.merchant_id,
                entry_type=LedgerEntry.EntryType.CREDIT,
                amount_paise=payout.amount_paise,
                reference_id=payout.id,
                description=f"Payout failed refund: {payout.id}",
            )
```

---

## 5. The “AI audit” (honest)

A naive, tempting mistake is: `entries = LedgerEntry.objects.filter(merchant=…); balance = sum(… in Python)`.

**Why that is a TOCTOU bug**  
Thread A fetches and sums; **before** A writes, thread B can insert a debit. A still thinks the old sum is valid and approves a second payout. That is **time-of-check / time-of-use** inconsistency.  

**Why the aggregate is right**  
`get_available_balance` runs in the same database transaction **after** `SELECT FOR UPDATE` on the `Merchant` row, so other writers for that merchant are blocked until this transaction finishes. The sum is computed from committed rows the database sees *now*, as one query plan—no interleaved Python read/compute/write gap for that merchant’s critical section.

---

## Celery: async work and beat

- `process_payout` uses real Celery: `process_payout.apply_async(..., countdown=…)`; no `time.sleep` in the view to fake asynchrony.  
- `retry_stuck_payouts` is registered in `CELERY_BEAT_SCHEDULE` to run every 30 seconds (see `config/settings.py`).

When `CELERY_TASK_ALWAYS_EAGER=1` (tests only), tasks run in-process, but the application code path is still the Celery task entrypoint, not a synchronous `sleep` in the HTTP request.

---

## Test hooks

Concurrency and idempotency tests mock `payouts.views.process_payout.apply_async` (see `tests/`) so the HTTP test does not depend on a broker, while the production path still enqueues work after commit.
