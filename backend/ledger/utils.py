from django.db.models import BigIntegerField, Case, F, Sum, Value, When
from django.db.models.functions import Coalesce

from ledger.models import LedgerEntry
from payouts.models import PayoutRequest


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
