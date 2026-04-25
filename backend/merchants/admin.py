from django.contrib import admin

from .models import Merchant


@admin.register(Merchant)
class MerchantAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "id")
    search_fields = ("name", "email")
