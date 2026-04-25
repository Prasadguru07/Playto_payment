import uuid

from django.test import TestCase

from ledger.models import LedgerEntry
from merchants.models import Merchant
from payouts.models import PayoutRequest
from payouts.state_machine import InvalidStateTransition, transition_payout, VALID_TRANSITIONS


class StateMachineGuardsTest(TestCase):
    def setUp(self):
        from django.contrib.auth.models import User

        u = User.objects.create_user(username="sm@t.com", password="x")
        self.merchant = Merchant.objects.create(
            user=u, name="SM", email="sm@t.com"
        )

    def test_valid_transitions_dict_is_terminal_for_completed(self):
        self.assertEqual(VALID_TRANSITIONS.get("completed", ()), ())

    def test_cannot_transition_backwards_from_completed(self):
        p = PayoutRequest.objects.create(
            merchant=self.merchant,
            amount_paise=100,
            bank_account_id="X",
            status=PayoutRequest.Status.COMPLETED,
            idempotency_key=str(uuid.uuid4()),
        )
        with self.assertRaises(InvalidStateTransition):
            transition_payout(p.id, "failed", release_funds=True)

    def test_failed_release_creates_refund_ledger_in_same_tx(self):
        p = PayoutRequest.objects.create(
            merchant=self.merchant,
            amount_paise=500,
            bank_account_id="X",
            status=PayoutRequest.Status.PROCESSING,
            idempotency_key=str(uuid.uuid4()),
        )
        transition_payout(p.id, "failed", release_funds=True)
        p.refresh_from_db()
        self.assertEqual(p.status, PayoutRequest.Status.FAILED)
        self.assertTrue(
            LedgerEntry.objects.filter(
                merchant=self.merchant,
                entry_type=LedgerEntry.EntryType.CREDIT,
                reference_id=p.id,
            ).exists()
        )
