"""
Tests for Bulk Sales, Algorithmic Revenue Split, and Atomic Commit rules.
"""
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.cooperatives.models import Cooperative, Farmer
from apps.harvest_ledger.models import BatchTotal, CropDelivery
from apps.sales_distribution.models import BulkSale, RevenueDistribution

User = get_user_model()


class SalesAndSplitTests(TestCase):
    """Verifies FR 5.x and FR 6.x revenue distribution logic."""

    def setUp(self):
        self.coop = Cooperative.objects.create(
            name="Coop Sales",
            rca_registration_no="RCA/TEST/003",
            sector="Gisozi",
            district="Gasabo"
        )
        self.officer = User.objects.create_user(username="officer_s", password="pass", role="COLLECTION_OFFICER", phone_number="0788999020")
        self.manager = User.objects.create_user(username="manager_s", password="pass", role="MANAGER", phone_number="0788999021")
        self.f1 = Farmer.objects.create(cooperative=self.coop, national_id="201", full_name="Farmer A", phone_number="0788999022")
        self.f2 = Farmer.objects.create(cooperative=self.coop, national_id="202", full_name="Farmer B", phone_number="0788999023")

    def test_algorithmic_revenue_split(self):
        """
        Verifies FR 6.1:
        Farmer A contributes 100 kg (25%), Farmer B contributes 300 kg (75%). Total = 400 kg.
        Sale price = 1,000,000 RWF.
        Expected payout: Farmer A gets 250,000 RWF, Farmer B gets 750,000 RWF.
        """
        CropDelivery.log_delivery(self.f1, self.coop, self.officer, "soya", Decimal("100.00"))
        CropDelivery.log_delivery(self.f2, self.coop, self.officer, "soya", Decimal("300.00"))

        batch = BatchTotal.objects.get(cooperative=self.coop, crop_type="soya")
        batch.lock_batch()

        sale = BulkSale.objects.create(
            batch=batch,
            buyer_name="AgriWholesale Rwanda",
            sale_price_rwf=Decimal("1000000.00"),
            bank_transfer_ref="BK_TX_9988",
            verified=True,
            recorded_by=self.manager
        )

        splits = sale.calculate_revenue_split()
        self.assertEqual(len(splits), 2)

        payout_map = {s.farmer_id: s.payout_rwf for s in splits}
        self.assertEqual(payout_map[self.f1.id], Decimal("250000.00"))
        self.assertEqual(payout_map[self.f2.id], Decimal("750000.00"))

        batch.refresh_from_db()
        self.assertEqual(batch.status, BatchTotal.Status.SOLD)

    def test_unverified_sale_rejects_split(self):
        """Verifies FR 5.2: cannot run revenue allocation if bank transfer is not verified."""
        CropDelivery.log_delivery(self.f1, self.coop, self.officer, "soya", Decimal("100.00"))
        batch = BatchTotal.objects.get(cooperative=self.coop, crop_type="soya")
        batch.lock_batch()

        sale = BulkSale.objects.create(
            batch=batch,
            buyer_name="Unverified Buyer",
            sale_price_rwf=Decimal("500000.00"),
            verified=False,
            recorded_by=self.manager
        )
        with self.assertRaises(ValidationError):
            sale.calculate_revenue_split()

    def test_revenue_distribution_disbursement(self):
        """Verifies marking a revenue distribution line as disbursed (`PaymentStatus.PAID`)."""
        CropDelivery.log_delivery(self.f1, self.coop, self.officer, "soya", Decimal("100.00"))
        batch = BatchTotal.objects.get(cooperative=self.coop, crop_type="soya")
        batch.lock_batch()
        sale = BulkSale.objects.create(
            batch=batch,
            buyer_name="Verified Buyer",
            sale_price_rwf=Decimal("500000.00"),
            verified=True,
            recorded_by=self.manager
        )
        splits = sale.calculate_revenue_split()
        payout = splits[0]
        self.assertEqual(payout.payment_status, RevenueDistribution.PaymentStatus.PENDING)

        payout.payment_status = RevenueDistribution.PaymentStatus.PAID
        payout.disbursement_ref = "MOMO_TX_881122"
        payout.save()
        payout.refresh_from_db()
        self.assertEqual(payout.payment_status, RevenueDistribution.PaymentStatus.PAID)
        self.assertEqual(payout.disbursement_ref, "MOMO_TX_881122")
