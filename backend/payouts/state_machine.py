from django.db import transaction
from django.utils.timezone import now

from ledger.models import LedgerEntry
from payouts.models import PayoutRequest

VALID_TRANSITIONS = {
    "pending": ("processing",),
    "processing": ("completed", "failed"),
}


class InvalidStateTransition(Exception):
    pass


def transition_payout(payout_id, new_status, release_funds=False):
    with transaction.atomic():
        payout = PayoutRequest.objects.select_for_update().get(id=payout_id)

        allowed = list(VALID_TRANSITIONS.get(payout.status, ()))
        if new_status not in allowed:
            raise InvalidStateTransition(
                f"Cannot transition {payout.status} → {new_status}"
            )

        payout.status = new_status
        if new_status == "processing" and not payout.processing_started_at:
            payout.processing_started_at = now()
        payout.save()

        if release_funds and new_status == "failed":
            LedgerEntry.objects.create(
                merchant_id=payout.merchant_id,
                entry_type=LedgerEntry.EntryType.CREDIT,
                amount_paise=payout.amount_paise,
                reference_id=payout.id,
                description=f"Payout failed refund: {payout.id}",
            )

        return payout
