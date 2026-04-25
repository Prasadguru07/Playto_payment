import random
from datetime import timedelta
from uuid import UUID

from django.db import transaction
from django.utils.timezone import now

from celeryconfig import app

from payouts.models import PayoutRequest
from payouts.state_machine import InvalidStateTransition, transition_payout


@app.task(bind=True, max_retries=3)
def process_payout(self, payout_id):
    if isinstance(payout_id, str):
        payout_id = UUID(payout_id)
    try:
        transition_payout(payout_id, "processing")
    except InvalidStateTransition:
        return

    outcome = random.choices(
        ["success", "fail", "hang"],
        weights=[70, 20, 10],
    )[0]

    if outcome == "success":
        try:
            transition_payout(payout_id, "completed")
        except InvalidStateTransition:
            return
    elif outcome == "fail":
        try:
            transition_payout(payout_id, "failed", release_funds=True)
        except InvalidStateTransition:
            return
    elif outcome == "hang":
        pass


@app.task
def retry_stuck_payouts():
    threshold = now() - timedelta(seconds=30)
    stuck = PayoutRequest.objects.filter(
        status=PayoutRequest.Status.PROCESSING,
        processing_started_at__lt=threshold,
        attempt_count__lt=3,
    )
    for payout in stuck:
        with transaction.atomic():
            p = PayoutRequest.objects.select_for_update().get(id=payout.id)
            if p.status != PayoutRequest.Status.PROCESSING:
                continue
            p.attempt_count += 1
            backoff = (2**p.attempt_count) * 5
            p.save()
            process_payout.apply_async(args=[str(p.id)], countdown=backoff)

    exhausted = PayoutRequest.objects.filter(
        status=PayoutRequest.Status.PROCESSING,
        processing_started_at__lt=threshold,
        attempt_count__gte=3,
    )
    for payout in exhausted:
        try:
            transition_payout(payout.id, "failed", release_funds=True)
        except InvalidStateTransition:
            pass
