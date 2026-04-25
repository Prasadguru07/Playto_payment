from rest_framework import serializers

from ledger.models import LedgerEntry


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = (
            "id",
            "entry_type",
            "amount_paise",
            "reference_id",
            "description",
            "created_at",
        )


class BalanceSerializer(serializers.Serializer):
    available_paise = serializers.IntegerField(read_only=True)
    held_paise = serializers.IntegerField(read_only=True)
    net_paise = serializers.IntegerField(read_only=True)
