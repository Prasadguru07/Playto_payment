from django.contrib import admin

from .models import PayoutRequest


@admin.register(PayoutRequest)
class PayoutRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "merchant", "amount_paise", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("id", "idempotency_key", "bank_account_id")
