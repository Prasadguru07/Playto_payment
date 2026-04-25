def idempotent_view(fn):
    """Idempotency for POST /api/v1/payouts/ is enforced in that view; this is a no-op hook."""
    return fn
