import json
import uuid
from unittest.mock import patch

from django.contrib.auth.models import User
from django.db.models import Sum
from django.test import TestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from idempotency.models import IdempotencyKey
from ledger.models import LedgerEntry
from ledger.utils import get_available_balance
from merchants.models import Merchant
from payouts.models import PayoutRequest


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
)
@patch("payouts.views.process_payout.apply_async", return_value=None)
class IdempotencyTests(TestCase):
    def setUp(self):
        user = User.objects.create_user(username="idem@t.com", password="x")
        self.merchant = Merchant.objects.create(
            user=user, name="Idem", email="idem@t.com"
        )
        self.token = Token.objects.create(user=user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        LedgerEntry.objects.create(
            merchant=self.merchant,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount_paise=50_000,
            description="test credit",
        )

    def test_duplicate_post_replays_identical_response_and_single_rows(
        self, _mock_apply
    ):
        key = str(uuid.uuid4())
        body = {"amount_paise": 1000, "bank_account_id": "TEST_1"}
        h = {"HTTP_IDEMPOTENCY_KEY": key}

        r1 = self.client.post("/api/v1/payouts/", body, format="json", **h)
        r2 = self.client.post("/api/v1/payouts/", body, format="json", **h)

        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r2.status_code, 201)
        j1 = json.loads(r1.content.decode())
        j2 = json.loads(r2.content.decode())
        self.assertEqual(j1, j2)
        self.assertEqual(j1["id"], j2["id"])
        self.assertEqual(j1["amount_paise"], j2["amount_paise"])
        self.assertEqual(j1["status"], j2["status"])

        self.assertEqual(
            PayoutRequest.objects.filter(merchant=self.merchant).count(),
            1,
        )
        self.assertEqual(
            LedgerEntry.objects.filter(
                merchant=self.merchant, entry_type=LedgerEntry.EntryType.DEBIT
            ).count(),
            1,
        )
        self.assertEqual(
            IdempotencyKey.objects.filter(merchant=self.merchant, key=key).count(),
            1,
        )

        credits = (
            LedgerEntry.objects.filter(
                merchant=self.merchant, entry_type=LedgerEntry.EntryType.CREDIT
            ).aggregate(s=Sum("amount_paise"))["s"]
            or 0
        )
        debits = (
            LedgerEntry.objects.filter(
                merchant=self.merchant, entry_type=LedgerEntry.EntryType.DEBIT
            ).aggregate(s=Sum("amount_paise"))["s"]
            or 0
        )
        self.assertEqual(get_available_balance(self.merchant.id), credits - debits)
