from django.core.management.base import BaseCommand
from django.db import transaction

from ledger.models import Cooperative, CooperativeStaff, CropDelivery, Farmer, Role, User

PASSWORD = "Umucyo@2026"


class Command(BaseCommand):
    help = "Seed demo cooperative, staff, farmers, and a few crop deliveries."

    @transaction.atomic
    def handle(self, *args, **options):
        coop, _ = Cooperative.objects.get_or_create(
            rca_registration_no="RCA-KGL-0042",
            defaults={"name": "Umucyo Cooperative", "sector": "Nyarugenge", "district": "Kigali"},
        )

        def make_user(username, role, phone):
            user, created = User.objects.get_or_create(
                username=username, defaults={"role": role, "phone_number": phone, "email": f"{username}@umucyo.rw"}
            )
            if created:
                user.set_password(PASSWORD)
                user.save()
            return user

        admin_user = make_user("admin1", Role.ADMIN, "0788000010")
        manager_user = make_user("manager1", Role.MANAGER, "0788000011")
        officer_user = make_user("officer1", Role.COLLECTION_OFFICER, "0788000012")
        vet_user = make_user("vet1", Role.VETERINARIAN, "0788000013")
        rca_user = make_user("rca1", Role.SUPER_ADMIN, "0788000014")
        rca_user.is_superuser = True
        rca_user.is_staff = True
        rca_user.save()

        for user in (admin_user, manager_user, officer_user, vet_user):
            CooperativeStaff.objects.get_or_create(user=user, cooperative=coop, defaults={"is_active": True})

        farmers_data = [
            ("1198000000000001", "Jean Bosco Habimana", "0788000001", "Nyarugenge"),
            ("1198000000000002", "Alice Uwimana", "0788000002", "Nyarugenge"),
            ("1198000000000003", "Eric Nshimiyimana", "0788000003", "Kicukiro"),
        ]
        farmers = []
        for national_id, name, phone, district in farmers_data:
            f, _ = Farmer.objects.get_or_create(
                national_id=national_id,
                defaults={"cooperative": coop, "full_name": name, "phone_number": phone, "district": district},
            )
            farmers.append(f)

        sample_weights = [120, 95, 60]
        for farmer, weight in zip(farmers, sample_weights):
            if not CropDelivery.objects.filter(farmer=farmer).exists():
                CropDelivery.log_delivery(farmer=farmer, cooperative=coop, officer=officer_user, crop_type="soya", weight_kg=weight)

        self.stdout.write(self.style.SUCCESS(
            "Seed complete. Demo logins (password 'Umucyo@2026'): admin1, manager1, officer1, vet1, rca1.\n"
            "Demo farmer USSD phone numbers: 0788000001, 0788000002, 0788000003."
        ))
