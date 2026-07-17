"""
Sales & Revenue Distribution Domain Models.

Implements FR 5.0 (Bulk Market Sale Logging), FR 6.1 (Algorithmic Revenue Allocation),
and NFR 7 (Atomic Database Commit Rules).
"""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils import timezone
from common.models import TimeStampedUUIDModel
from apps.harvest_ledger.models import BatchTotal
from apps.cooperatives.models import Farmer


class BulkSale(TimeStampedUUIDModel):
    """
    Implements FR 5.0 / FR 5.1 (Bulk Market Sale Logging & Wholesaler Contract Entry):
    Records a high-volume merchant transaction against a locked harvest batch.
    """

    batch = models.OneToOneField(
        BatchTotal,
        on_delete=models.PROTECT,
        related_name="sale",
        help_text="The locked seasonal batch being sold in bulk."
    )
    buyer_name = models.CharField(
        max_length=255,
        help_text="Name of the purchasing merchant or wholesaler."
    )
    sale_price_rwf = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        help_text="Total wholesale deal contract value in Rwandan Francs (RWF)."
    )
    bank_transfer_ref = models.CharField(
        max_length=120,
        blank=True,
        help_text="Bank transaction reference code confirming payment deposit."
    )
    verified = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether the bank transfer has been verified (FR 5.2)."
    )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="recorded_sales",
        help_text="Cooperative Manager or Accountant who logged the sale."
    )

    class Meta:
        verbose_name = "Bulk Sale Contract"
        verbose_name_plural = "Bulk Sale Contracts"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Sale of {self.batch} to {self.buyer_name} ({self.sale_price_rwf} RWF)"

    def clean(self):
        if self.batch and self.batch.status == BatchTotal.Status.OPEN:
            raise ValidationError("Cannot record a bulk sale for an OPEN batch. Lock the batch first (FR 4.0).")

    @transaction.atomic
    def calculate_revenue_split(self):
        """
        Implements FR 6.1 (Percentage Split Calculation) & NFR 7 (Atomic Commit Rules):
        Automatically computes individual farmer shares by dividing their documented contribution weight
        by the total batch weight multiplied by the net payout revenue:
            payout = (farmer_kg / batch_kg) * sale_price_rwf

        If any error occurs during calculation or creation of payout records, the entire operation
        rolls back atomically (`transaction.atomic`).
        """
        if not self.verified:
            raise ValidationError("Sale must be verified (bank transfer confirmed) before running revenue split (FR 5.2).")
        if self.batch.status not in (BatchTotal.Status.LOCKED, BatchTotal.Status.SOLD):
            raise ValidationError("Batch must be locked before its sale revenue can be allocated.")

        total_kg = float(self.batch.total_weight_kg or 0)
        if total_kg <= 0:
            return []

        # Aggregate contributions per farmer across all deliveries attached to this batch, respecting adjustments
        deliveries_by_farmer = {}
        for d in self.batch.deliveries.prefetch_related("adjustments"):
            deliveries_by_farmer.setdefault(d.farmer_id, {"farmer": d.farmer, "kg": 0.0})
            deliveries_by_farmer[d.farmer_id]["kg"] += float(d.effective_weight_kg)

        splits = []
        for farmer_id, data in deliveries_by_farmer.items():
            share_pct = data["kg"] / total_kg
            payout = round(share_pct * float(self.sale_price_rwf), 2)
            record, _ = RevenueDistribution.objects.update_or_create(
                sale=self,
                farmer=data["farmer"],
                defaults={
                    "contribution_kg": data["kg"],
                    "share_percentage": round(share_pct * 100, 4),
                    "payout_rwf": payout,
                },
            )
            splits.append(record)

        # Mark batch as SOLD post allocation
        self.batch.status = BatchTotal.Status.SOLD
        self.batch.save(update_fields=["status", "updated_at"])
        return splits


class RevenueDistribution(TimeStampedUUIDModel):
    """
    Implements FR 6.1 Output:
    Represents an immutable, auditable payout allocation record for an individual farmer.
    Now includes disbursement tracking across Mobile Money / Bank channels.
    """

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Disbursement"
        PAID = "PAID", "Disbursed via MoMo/Bank"
        FAILED = "FAILED", "Payment Failed"

    sale = models.ForeignKey(
        BulkSale,
        on_delete=models.CASCADE,
        related_name="distributions",
        help_text="The bulk sale producing this payout."
    )
    farmer = models.ForeignKey(
        Farmer,
        on_delete=models.PROTECT,
        related_name="payouts",
        db_index=True,
        help_text="The farmer receiving the payout share."
    )
    contribution_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Total weight in kg contributed by this farmer to the sold batch."
    )
    share_percentage = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        help_text="Proportional contribution percentage (0.0000 - 100.0000%)."
    )
    payout_rwf = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        help_text="Allocated payout amount in Rwandan Francs (RWF)."
    )
    payment_status = models.CharField(
        max_length=16,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True,
        help_text="Current disbursement status."
    )
    disbursement_ref = models.CharField(
        max_length=120,
        blank=True,
        help_text="Mobile Money or Bank transaction reference confirmation."
    )
    disbursed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the payout was successfully disbursed."
    )

    class Meta:
        verbose_name = "Revenue Distribution Line"
        verbose_name_plural = "Revenue Distribution Lines"
        ordering = ["-payout_rwf"]
        unique_together = ("sale", "farmer")

    def __str__(self):
        return f"{self.farmer.full_name} -> {self.payout_rwf} RWF ({self.payment_status})"
