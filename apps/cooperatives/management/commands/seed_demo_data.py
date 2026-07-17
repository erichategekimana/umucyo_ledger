"""
Umucyo Ledger - Management Command: `seed_demo_data`

Populates the PostgreSQL 16 database with realistic agricultural cooperative accounts,
registered farmers, append-only crop deliveries, locked batches, bulk sales, and
veterinary anomalies for testing and demonstration.
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from apps.accounts.models import Role
from apps.cooperatives.models import Cooperative, CooperativeStaff, Farmer
from apps.harvest_ledger.models import BatchTotal, CropDelivery, AdjustmentLog
from apps.sales_distribution.models import BulkSale
from apps.agronomy_monitoring.models import AnomalyReport

User = get_user_model()


class Command(BaseCommand):
    help = "Seeds PostgreSQL database with Umucyo Cooperative demo data (farmers, staff, deliveries, anomalies)."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Seeding Umucyo Ledger multi-app database...")

        # 1. Create Cooperative
        coop, _ = Cooperative.objects.get_or_create(
            rca_registration_no="RCA/2026/UMUCYO/001",
            defaults={
                "name": "Koperative Umucyo w'Abahinzi (Kigali Sector)",
                "sector": "Gisozi",
                "district": "Gasabo",
            },
        )
        self.stdout.write(f"  [+] Cooperative: {coop.name}")

        # 2. Create Staff Users
        staff_data = [
            ("rca1", "SUPER_ADMIN", "0788100001", "RCA Regulator"),
            ("admin1", "ADMIN", "0788100002", "Cooperative Admin"),
            ("manager1", "MANAGER", "0788100003", "Cooperative Manager"),
            ("officer1", "COLLECTION_OFFICER", "0788100004", "Field Officer"),
            ("vet1", "VETERINARIAN", "0788100005", "Veterinary Extension Officer"),
        ]
        users = {}
        for username, role, phone, full_name in staff_data:
            u, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@umucyo.rw",
                    "role": role,
                    "phone_number": phone,
                    "preferred_language": "rw" if role != "SUPER_ADMIN" else "en",
                },
            )
            if created:
                u.set_password("Umucyo@2026")
                u.save()
            users[username] = u
            if role != "SUPER_ADMIN":
                CooperativeStaff.objects.get_or_create(user=u, cooperative=coop)

        self.stdout.write("  [+] Staff & RCA profiles created (password: Umucyo@2026)")

        # 3. Create Farmers
        farmer_data = [
            ("1198580000101011", "Mugabo Jean de Dieu", "0788000001", "Gasabo"),
            ("1199070000202022", "Mukamana Chantal", "0788000002", "Gasabo"),
            ("1197880000303033", "Nshimiyimana Emmanuel", "0788000003", "Gasabo"),
        ]
        farmers = []
        for nat_id, name, phone, district in farmer_data:
            f_user, u_created = User.objects.get_or_create(
                username=f"farmer_{phone}",
                defaults={
                    "email": f"farmer_{phone}@umucyo.rw",
                    "role": Role.FARMER,
                    "phone_number": phone,
                    "preferred_language": "rw",
                },
            )
            if u_created:
                f_user.set_password("Umucyo@2026")
                f_user.save()

            farmer, _ = Farmer.objects.get_or_create(
                national_id=nat_id,
                defaults={
                    "user": f_user,
                    "cooperative": coop,
                    "full_name": name,
                    "phone_number": phone,
                    "district": district,
                },
            )
            farmers.append(farmer)

        self.stdout.write("  [+] Registered 3 demo farmers for USSD testing (*789#)")

        # 4. Create Crop Deliveries (using classmethod to auto-aggregate and trigger receipts)
        if not CropDelivery.objects.filter(cooperative=coop).exists():
            d1 = CropDelivery.log_delivery(farmers[0], coop, users["officer1"], "soya", Decimal("125.50"))
            d2 = CropDelivery.log_delivery(farmers[1], coop, users["officer1"], "soya", Decimal("340.00"))
            d3 = CropDelivery.log_delivery(farmers[2], coop, users["officer1"], "soya", Decimal("89.25"))
            self.stdout.write(f"  [+] Logged 3 initial crop deliveries into OPEN soya batch ({d1.weight_kg + d2.weight_kg + d3.weight_kg} kg total)")

        # 5. Create Sample Agronomic Anomaly
        AnomalyReport.objects.get_or_create(
            cooperative=coop,
            sector="Gisozi",
            category="Soya Rust Outbreak",
            defaults={
                "reported_by": users["vet1"],
                "latitude": Decimal("-1.935111"),
                "longitude": Decimal("30.082111"),
                "description": "Early signs of fungal rust observed on leaves across northern plots.",
                "severity": AnomalyReport.Severity.HIGH,
            },
        )
        self.stdout.write("  [+] Logged veterinary GIS anomaly report")

        self.stdout.write(self.style.SUCCESS("Successfully seeded Umucyo Ledger database!"))
