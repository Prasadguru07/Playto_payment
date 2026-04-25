import threading
import uuid
from unittest.mock import patch

import requests
from django.contrib.auth.models import User
from django.test import LiveServerTestCase, override_settings
from rest_framework.authtoken.models import Token

from ledger.models import LedgerEntry
from ledger.utils import get_available_balance
from merchants.models import Merchant
from payouts.models import PayoutRequest


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
    ALLOWED_HOSTS=["*"],
)
class PayoutConcurrencyTests(LiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        cls._payout_apply_patch = patch(
            "payouts.views.process_payout.apply_async", return_value=None
        )
        cls._payout_apply_patch.start()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        cls._payout_apply_patch.stop()

    def setUp(self):
        user = User.objects.create_user(username="conc@t.com", password="x")
        self.merchant = Merchant.objects.create(
            user=user, name="Conc", email="conc@t.com"
        )
        self.token = Token.objects.create(user=user)
        LedgerEntry.objects.create(
            merchant=self.merchant,
            entry_type=LedgerEntry.EntryType.CREDIT,
            amount_paise=10_000,
            description="100 INR test",
        )
        self.url = f"{self.live_server_url}/api/v1/payouts/"
        self.headers = {
            "Authorization": f"Token {self.token.key}",
            "Content-Type": "application/json",
        }

    def test_two_simultaneous_payouts_one_succeeds_and_ledger_holds(self):
        # 100 INR available; two concurrent 60 INR payouts
        body = {"amount_paise": 6_000, "bank_account_id": "HDFC_001"}
        codes: list[int] = []
        lock = threading.Lock()

        def post_once():
            h = {
                **self.headers,
                "Idempotency-Key": str(uuid.uuid4()),
            }
            r = requests.post(
                self.url, json=body, headers=h, timeout=30
            )
            with lock:
                codes.append(r.status_code)

        t1 = threading.Thread(target=post_once)
        t2 = threading.Thread(target=post_once)
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        self.assertEqual(sorted(codes), [201, 400])
        self.assertEqual(PayoutRequest.objects.filter(merchant=self.merchant).count(), 1)

        m_id = self.merchant.id
        self.assertEqual(get_available_balance(m_id), 4_000)

        credits = sum(
            e.amount_paise
            for e in LedgerEntry.objects.filter(
                merchant_id=m_id, entry_type=LedgerEntry.EntryType.CREDIT
            )
        )
        debits = sum(
            e.amount_paise
            for e in LedgerEntry.objects.filter(
                merchant_id=m_id, entry_type=LedgerEntry.EntryType.DEBIT
            )
        )
        self.assertEqual(credits - debits, get_available_balance(m_id))
