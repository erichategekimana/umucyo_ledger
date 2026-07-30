"""
Database Test Data Seeding Script for Umucyo Ledger.
"""
import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.base")
django.setup()

from apps.accounts.models import User, Role
from apps.cooperatives.models import Cooperative, CooperativeStaff, Farmer
from apps.harvest_ledger.models import BatchTotal, CropDelivery
from apps.notifications.models import Notification
from apps.sales_distribution.models import BulkSale, RevenueDistribution
from apps.agronomy_monitoring.models import AnomalyReport
from apps.ussd_gateway.models import USSDLog


def seed_data():
    print("Clearing old seed data...")
    Notification.objects.all().delete()
    RevenueDistribution.objects.all().delete()
    BulkSale.objects.all().delete()
    CropDelivery.objects.all().delete()
    BatchTotal.objects.all().delete()
    AnomalyReport.objects.all().delete()
    USSDLog.objects.all().delete()
    Farmer.objects.all().delete()
    CooperativeStaff.objects.all().delete()
    Cooperative.objects.all().delete()
    User.objects.filter(is_superuser=False).delete()

    print("Creating Cooperative...")
    coop = Cooperative.objects.create(
        name="Tuzamurane Agriculture Cooperative",
        rca_registration_no="RCA-2024-001",
        sector="Kimironko",
        district="Gasabo"
    )

    print("Creating Users & Profiles across all 6 Roles...")
    # 1. Super Admin
    super_admin, created = User.objects.get_or_create(
        username="superadmin",
        defaults={
            "email": "superadmin@umucyo.rw",
            "phone_number": "+250780000000",
            "role": Role.SUPER_ADMIN,
            "is_staff": True,
            "is_superuser": True
        }
    )
    if created or not super_admin.check_password("password123"):
        super_admin.set_password("password123")
        super_admin.save()

    # 2. Cooperative Admin
    admin_user = User.objects.create_user(
        username="admin_coop",
        email="admin@tuzamurane.rw",
        phone_number="+250780000001",
        role=Role.ADMIN,
        password="password123"
    )
    CooperativeStaff.objects.create(user=admin_user, cooperative=coop)

    # 3. Cooperative Manager
    manager_user = User.objects.create_user(
        username="manager_coop",
        email="manager@tuzamurane.rw",
        phone_number="+250780000002",
        role=Role.MANAGER,
        password="password123"
    )
    CooperativeStaff.objects.create(user=manager_user, cooperative=coop)

    # 4. Collection Officer
    officer_user = User.objects.create_user(
        username="officer_coop",
        email="officer@tuzamurane.rw",
        phone_number="+250780000003",
        role=Role.COLLECTION_OFFICER,
        password="password123"
    )
    CooperativeStaff.objects.create(user=officer_user, cooperative=coop)

    # 5. Veterinarian
    vet_user = User.objects.create_user(
        username="vet_coop",
        email="vet@tuzamurane.rw",
        phone_number="+250780000004",
        role=Role.VETERINARIAN,
        password="password123"
    )
    CooperativeStaff.objects.create(user=vet_user, cooperative=coop)

    # 6. Farmers
    farmer_user1 = User.objects.create_user(
        username="farmer_jean",
        email="jean@gmail.com",
        phone_number="+250780000005",
        role=Role.FARMER,
        password="password123"
    )
    farmer1 = Farmer.objects.create(
        user=farmer_user1,
        cooperative=coop,
        national_id="1199080012345678",
        full_name="Jean Hakizimana",
        phone_number="+250780000005",
        district="Gasabo"
    )

    farmer_user2 = User.objects.create_user(
        username="farmer_marie",
        email="marie@gmail.com",
        phone_number="+250780000006",
        role=Role.FARMER,
        password="password123"
    )
    farmer2 = Farmer.objects.create(
        user=farmer_user2,
        cooperative=coop,
        national_id="1199580087654321",
        full_name="Marie Claire Uwamahoro",
        phone_number="+250780000006",
        district="Gasabo"
    )

    print("Logging Crop Deliveries...")
    delivery1 = CropDelivery.log_delivery(
        farmer=farmer1,
        cooperative=coop,
        officer=officer_user,
        crop_type="Coffee",
        weight_kg=250.0
    )

    delivery2 = CropDelivery.log_delivery(
        farmer=farmer2,
        cooperative=coop,
        officer=officer_user,
        crop_type="Coffee",
        weight_kg=350.0
    )

    delivery3 = CropDelivery.log_delivery(
        farmer=farmer1,
        cooperative=coop,
        officer=officer_user,
        crop_type="Coffee",
        weight_kg=150.0
    )

    print("Verifying Notifications...")
    # Add unread flag check
    notif1 = Notification.objects.filter(farmer=farmer1).first()
    if notif1:
        notif1.is_read = False
        notif1.save()

    print("Logging Anomaly Report...")
    AnomalyReport.objects.create(
        reported_by=vet_user,
        cooperative=coop,
        sector="Kimironko",
        category="Pest Outbreak",
        description="Slight coffee berry borer outbreak detected in Kimironko sector plots.",
        severity="MEDIUM",
        latitude=-1.944100,
        longitude=30.061900,
        resolved=False
    )

    print("Logging USSD Session...")
    USSDLog.objects.create(
        session_id="ATQid_12345",
        phone_number="+250780000005",
        text="1",
        response="END Your recent deliveries:\n- 400.00 kg Coffee",
        menu_level=1,
        is_final=True
    )

    print("Database seeding completed successfully!")
    print("\n--- Test Credentials ---")
    print("SuperAdmin: superadmin / password123")
    print("Coop Admin: admin_coop / password123")
    print("Manager: manager_coop / password123")
    print("Collection Officer: officer_coop / password123")
    print("Veterinarian: vet_coop / password123")
    print("Farmer 1: farmer_jean / password123")
    print("Farmer 2: farmer_marie / password123")


if __name__ == "__main__":
    seed_data()
