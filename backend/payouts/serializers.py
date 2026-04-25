from rest_framework import serializers

from .models import PayoutRequest


class PayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutRequest
        fields = (
            "id",
            "merchant",
            "amount_paise",
            "bank_account_id",
            "status",
            "idempotency_key",
            "attempt_count",
            "processing_started_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "status",
            "idempotency_key",
            "attempt_count",
            "processing_started_at",
            "created_at",
            "updated_at",
        )


class PayoutCreateSerializer(serializers.Serializer):
    amount_paise = serializers.IntegerField(min_value=1)
    bank_account_id = serializers.CharField(max_length=255)
