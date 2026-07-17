"""
Tests for Harvest Ledger domain (The Fraud Block & Bounds Validation).
"""
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.cooperatives.models import Cooperative, Farmer
from apps.harvest_ledger.models import BatchTotal, CropDelivery, AdjustmentLog

User = get_user_model()


class HarvestLedgerFraudBlockTests(TestCase):
    """Verifies append-only integrity and bounds checking."""

    def setUp(self):
        self.coop = Cooperative.objects.create(
            name="Test Coop",
            rca_registration_no="RCA/TEST/001",
            sector="Gisozi",
            district="Gasabo"
        )
        self.officer = User.objects.create_user(
            username="officer_test",
            email="officer@test.rw",
            password="pass",
            role="COLLECTION_OFFICER",
            phone_number="0788999001"
        )
        self.farmer = Farmer.objects.create(
            cooperative=self.coop,
            national_id="119900001",
            full_name="Farmer Test",
            phone_number="0788999002",
            district="Gasabo"
        )

    def test_delivery_bounds_validation(self):
        """Verifies FR 2.2: rejects weight inputs below 0.1 kg or above 1,500 kg."""
        delivery_low = CropDelivery(
            cooperative=self.coop,
            farmer=self.farmer,
            officer=self.officer,
            crop_type="soya",
            weight_kg=Decimal("0.05")
        )
        with self.assertRaises(ValidationError):
            delivery_low.full_clean()

        delivery_high = CropDelivery(
            cooperative=self.coop,
            farmer=self.farmer,
            officer=self.officer,
            crop_type="soya",
            weight_kg=Decimal("2000.00")
        )
        with self.assertRaises(ValidationError):
            delivery_high.full_clean()

    def test_append_only_enforcement(self):
        """Verifies The Fraud Block: modifying a persisted delivery raises ValidationError."""
        delivery = CropDelivery.log_delivery(self.farmer, self.coop, self.officer, "soya", Decimal("100.00"))
        self.assertIsNotNone(delivery.pk)

        # Attempt to modify weight
        delivery.weight_kg = Decimal("150.00")
        with self.assertRaises(ValidationError) as context:
            delivery.save()
        self.assertIn("append-only", str(context.exception))

    def test_deletion_block(self):
        """Verifies The Fraud Block: deleting a delivery raises ValidationError."""
        delivery = CropDelivery.log_delivery(self.farmer, self.coop, self.officer, "soya", Decimal("100.00"))
        with self.assertRaises(ValidationError) as context:
            delivery.delete()
        self.assertIn("cannot be deleted", str(context.exception))

    def test_adjustment_log_creation(self):
        """Verifies operational corrections must be recorded through AdjustmentLog."""
        admin_user = User.objects.create_user(
            username="admin_test",
            email="admin@test.rw",
            password="pass",
            role="ADMIN",
            phone_number="0788999003"
        )
        delivery = CropDelivery.log_delivery(self.farmer, self.coop, self.officer, "soya", Decimal("100.00"))
        adj = AdjustmentLog.objects.create(
            original_delivery=delivery,
            corrected_weight_kg=Decimal("95.00"),
            reason="Scale recalibration correction",
            approved_by=admin_user
        )
        self.assertEqual(adj.original_delivery, delivery)
        self.assertEqual(adj.corrected_weight_kg, Decimal("95.00"))
