import json
from datetime import timedelta

from django.db import IntegrityError, transaction
from django.utils.timezone import now
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from idempotency.models import IdempotencyKey
from ledger.models import LedgerEntry
from ledger.utils import get_available_balance, get_held_balance
from merchants.models import Merchant
from payouts.models import PayoutRequest
from payouts.serializers import PayoutCreateSerializer, PayoutSerializer
from payouts.tasks import process_payout


def _replay_idempotency(merchant, key):
    try:
        existing = IdempotencyKey.objects.get(merchant=merchant, key=key)
    except IdempotencyKey.DoesNotExist:
        return None
    if existing.expires_at <= now():
        return None
    return Response(existing.response_body, status=existing.response_status)


class PayoutListCreateView(APIView):
    def get(self, request):
        qs = PayoutRequest.objects.filter(merchant=request.user.merchant).order_by(
            "-created_at"
        )
        return Response(PayoutSerializer(qs, many=True).data)

    def post(self, request):
        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            return Response(
                {"error": "Idempotency-Key header is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        merchant = request.user.merchant

        replay = _replay_idempotency(merchant, idempotency_key)
        if replay is not None:
            return replay

        ser = PayoutCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        amount_paise = ser.validated_data["amount_paise"]
        bank_account_id = ser.validated_data["bank_account_id"]

        payout = None
        response_data = None

        try:
            with transaction.atomic():
                Merchant.objects.select_for_update().get(id=merchant.id)

                available = get_available_balance(merchant.id)
                held = get_held_balance(merchant.id)
                spendable = available - held

                if amount_paise > spendable:
                    return Response(
                        {"error": "Insufficient balance"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                payout = PayoutRequest.objects.create(
                    merchant=merchant,
                    amount_paise=amount_paise,
                    bank_account_id=bank_account_id,
                    status=PayoutRequest.Status.PENDING,
                    idempotency_key=idempotency_key,
                )

                LedgerEntry.objects.create(
                    merchant=merchant,
                    entry_type=LedgerEntry.EntryType.DEBIT,
                    amount_paise=amount_paise,
                    reference_id=payout.id,
                    description=f"Payout hold: {payout.id}",
                )

                raw = PayoutSerializer(payout).data
                response_data = json.loads(json.dumps(raw, default=str))
                IdempotencyKey.objects.create(
                    merchant=merchant,
                    key=idempotency_key,
                    response_body=response_data,
                    response_status=201,
                    expires_at=now() + timedelta(hours=24),
                )
        except IntegrityError:
            existing = IdempotencyKey.objects.filter(
                merchant=merchant, key=idempotency_key
            ).first()
            if existing is not None and existing.expires_at > now():
                return Response(existing.response_body, status=existing.response_status)
            raise

        transaction.on_commit(
            lambda: process_payout.apply_async(args=[str(payout.id)], countdown=2)
        )

        return Response(response_data, status=status.HTTP_201_CREATED)


class PayoutDetailView(APIView):
    def get(self, request, id):
        try:
            p = PayoutRequest.objects.get(
                id=id, merchant=request.user.merchant
            )
        except PayoutRequest.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(PayoutSerializer(p).data)
