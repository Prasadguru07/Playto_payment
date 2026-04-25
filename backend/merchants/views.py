from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from ledger.models import LedgerEntry
from ledger.utils import get_available_balance, get_held_balance

from .serializers import BalanceSerializer, LedgerEntrySerializer


class MerchantBalanceView(APIView):
    def get(self, request):
        merchant = request.user.merchant
        net_paise = get_available_balance(merchant.id)
        held_paise = get_held_balance(merchant.id)
        available_paise = net_paise - held_paise
        data = {
            "available_paise": available_paise,
            "held_paise": held_paise,
            "net_paise": net_paise,
        }
        return Response(BalanceSerializer(instance=data).data)


class MerchantTransactionsView(ListAPIView):
    serializer_class = LedgerEntrySerializer

    def get_queryset(self):
        return LedgerEntry.objects.filter(merchant=self.request.user.merchant).order_by(
            "-created_at"
        )
