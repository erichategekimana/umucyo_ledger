"""
Tests for Bottom-Up Aggregation, Batch Locking, and Discrepancy Flagging.
"""
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.cooperatives.models import Cooperative, Farmer
from apps.harvest_ledger.models import BatchTotal, CropDelivery, DiscrepancyFlag

User = get_user_model()


class BatchTotalAggregationTests(TestCase):
    """Verifies Bottom-Up Link and mathematical lock."""

    def setUp(self):
        self.coop = Cooperative.objects.create(
            name="Coop Aggregation",
            rca_registration_no="RCA/TEST/002",
            sector="Gisozi",
            district="Gasabo"
        )
        self.officer = User.objects.create_user(
            username="officer_agg",
            password="pass",
            role="COLLECTION_OFFICER",
            phone_number="0788999010"
        )
        self.f1 = Farmer.objects.create(cooperative=self.coop, national_id="101", full_name="F1", phone_number="0788999011")
        self.f2 = Farmer.objects.create(cooperative=self.coop, national_id="102", full_name="F2", phone_number="0788999012")

    def test_bottom_up_sum_calculation(self):
        """Verifies BatchTotal.total_weight_kg exactly equals SUM(CropDelivery.weight_kg)."""
        d1 = CropDelivery.log_delivery(self.f1, self.coop, self.officer, "soya", Decimal("200.00"))
        d2 = CropDelivery.log_delivery(self.f2, self.coop, self.officer, "soya", Decimal("350.50"))

        batch = d1.batch
        batch.refresh_from_db()
        self.assertEqual(batch.total_weight_kg, Decimal("550.50"))

    def test_batch_locking_prevents_new_deliveries(self):
        """Verifies FR 4.0: locking a batch prevents adding further deliveries to it."""
        CropDelivery.log_delivery(self.f1, self.coop, self.officer, "soya", Decimal("100.00"))
        batch = BatchTotal.objects.get(cooperative=self.coop, crop_type="soya", status=BatchTotal.Status.OPEN)
        batch.lock_batch()
        self.assertEqual(batch.status, BatchTotal.Status.LOCKED)

        # Attempting to attach delivery to locked batch
        delivery = CropDelivery(
            cooperative=self.coop,
            farmer=self.f2,
            officer=self.officer,
            batch=batch,
            crop_type="soya",
            weight_kg=Decimal("50.00")
        )
        with self.assertRaises(ValidationError):
            delivery.clean()

    def test_discrepancy_flagging_over_one_percent(self):
        """Verifies FR 4.2: raises DiscrepancyFlag when buyer invoice diverges > 1%."""
        CropDelivery.log_delivery(self.f1, self.coop, self.officer, "soya", Decimal("1000.00"))
        batch = BatchTotal.objects.get(cooperative=self.coop, crop_type="soya")

        # Invoice weight 1020 kg -> drift is 20 kg (2%), exceeds 1% threshold
        flagged = batch.flag_discrepancy(Decimal("1020.00"))
        self.assertTrue(flagged)
        self.assertTrue(DiscrepancyFlag.objects.filter(batch=batch).exists())

        # Invoice weight 1005 kg -> drift is 5 kg (0.5%), should not flag
        flagged_minor = batch.flag_discrepancy(Decimal("1005.00"))
        self.assertFalse(flagged_minor)
