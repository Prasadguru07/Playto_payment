from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from rest_framework.authtoken.models import Token

from ledger.models import LedgerEntry
from merchants.models import Merchant


class Command(BaseCommand):
    help = "Seed merchants, ledger credits, and print DRF auth tokens."

    def handle(self, *args, **options):
        demo_password = "demo"

        def ensure_merchant(
            name: str, email: str, credits: list[tuple[str, int]]
        ) -> tuple[Merchant, str]:
            user, _ = User.objects.get_or_create(
                username=email,
                defaults={"email": email},
            )
            user.email = email
            if not user.has_usable_password():
                user.set_password(demo_password)
            user.save()
            m, _ = Merchant.objects.get_or_create(
                user=user, defaults={"name": name, "email": email}
            )
            if m.name != name or m.email != email:
                m.name = name
                m.email = email
                m.save()
            token, _ = Token.objects.get_or_create(user=user)
            # Replace ledger: delete old credits for idempotent re-run
            LedgerEntry.objects.filter(merchant=m).delete()
            for desc, paise in credits:
                LedgerEntry.objects.create(
                    merchant=m,
                    entry_type=LedgerEntry.EntryType.CREDIT,
                    amount_paise=paise,
                    description=desc,
                )
            return m, token.key

        # Merchant A: Priya Sharma — 500000 + 300000 + 200000 = 1_000_000 paise
        m_a, t_a = ensure_merchant(
            "Priya Sharma",
            "priya@example.com",
            [
                ("Seed credit: USD settlement batch 1", 500_000),
                ("Seed credit: USD settlement batch 2", 300_000),
                ("Seed credit: USD settlement batch 3", 200_000),
            ],
        )
        m_b, t_b = ensure_merchant(
            "Rahul Verma",
            "rahul@example.com",
            [
                ("Seed credit: USD settlement batch 1", 1_000_000),
                ("Seed credit: USD settlement batch 2", 500_000),
            ],
        )
        m_c, t_c = ensure_merchant(
            "Ananya Co",
            "ananya@example.com",
            [
                ("Seed credit: initial funding", 750_000),
            ],
        )

        self.stdout.write(self.style.SUCCESS("— Merchants and credits created —\n"))
        for label, m, t in [
            ("Merchant A (Priya Sharma)", m_a, t_a),
            ("Merchant B (Rahul Verma)", m_b, t_b),
            ("Merchant C (Ananya Co)", m_c, t_c),
        ]:
            self.stdout.write(f"{label}  id={m.id}")
            self.stdout.write(f"  Authorization: Token {t}\n")

        self.stdout.write(
            self.style.WARNING("Demo user password (if you use session auth): " + demo_password)
        )
