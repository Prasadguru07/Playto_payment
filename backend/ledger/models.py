import uuid

from django.db import models

from merchants.models import Merchant


class LedgerEntry(models.Model):
    class EntryType(models.TextChoices):
        CREDIT = "credit", "credit"
        DEBIT = "debit", "debit"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(Merchant, on_delete=models.PROTECT, related_name="ledger_entries")
    entry_type = models.CharField(max_length=10, choices=EntryType.choices)
    amount_paise = models.BigIntegerField()
    reference_id = models.UUIDField(null=True, blank=True, db_index=True)
    description = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.entry_type} {self.amount_paise} — {self.merchant_id}"
