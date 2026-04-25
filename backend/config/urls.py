from django.contrib import admin
from django.urls import path

from merchants.views import MerchantBalanceView, MerchantTransactionsView
from payouts.views import PayoutDetailView, PayoutListCreateView

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "api/v1/merchants/me/balance/",
        MerchantBalanceView.as_view(),
        name="merchant-balance",
    ),
    path(
        "api/v1/merchants/me/transactions/",
        MerchantTransactionsView.as_view(),
        name="merchant-transactions",
    ),
    path(
        "api/v1/payouts/",
        PayoutListCreateView.as_view(),
        name="payout-list-create",
    ),
    path(
        "api/v1/payouts/<uuid:id>/",
        PayoutDetailView.as_view(),
        name="payout-detail",
    ),
]
