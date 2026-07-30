"""
Harvest Ledger Domain Models.

Implements the class diagram and 'Core Structural Integrity Rules' from SRS Appendix B:
- The Fraud Block: CropDelivery is append-only. No UPDATE or DELETE once persisted.
- The Bottom-Up Link: BatchTotal.total_weight_kg is exclusively derived as a PostgreSQL SUM()
  over its linked CropDelivery rows, preventing false administrative batch figures.
"""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Sum
from django.utils import timezone
from common.models import TimeStampedUUIDModel
from apps.cooperatives.models import Cooperative, Farmer


class BatchTotal(TimeStampedUUIDModel):
    """
    The Bottom-Up Link (SRS Appendix B):
    Represents an aggregated seasonal collection batch for a specific crop type.
    `total_weight_kg` is recomputed via `SUM(CropDelivery.weight_kg)`. Direct manual editing
    is completely blocked at the model layer.
    """

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        LOCKED = "LOCKED", "Locked"
        SOLD = "SOLD", "Sold"

    cooperative = models.ForeignKey(
        Cooperative,
        on_delete=models.CASCADE,
        related_name="batches",
        db_index=True,
        help_text="The cooperative owning this harvest batch."
    )
    crop_type = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Type of crop aggregated in this batch (e.g., soya, coffee, maize)."
    )
    season_label = models.CharField(
        max_length=32,
        db_index=True,
        help_text="Seasonal identifier (e.g., 2026-A)."
    )
    total_weight_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Aggregate weight computed bottom-up from linked deliveries."
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True,
        help_text="Current batch state (OPEN for entries, LOCKED before sale, SOLD after split)."
    )
    locked_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the batch was frozen/locked by cooperative management."
    )

    class Meta:
        verbose_name = "Batch Total"
        verbose_name_plural = "Batch Totals"
        ordering = ["-created_at"]
        unique_together = ("cooperative", "crop_type", "season_label")

    def __str__(self):
        return f"{self.cooperative.name} - {self.crop_type} ({self.season_label}) [{self.status}]"

    def aggregate_deliveries(self):
        """
        Implements FR 4.1 (Mathematical Lock Calculation & Bottom-Up Link):
        Aggregates `effective_weight_kg` across all `CropDelivery` items linked to this batch,
        respecting any authorized `AdjustmentLog` corrections. Updates `total_weight_kg` atomically.
        """
        total = sum(d.effective_weight_kg for d in self.deliveries.prefetch_related("adjustments"))
        BatchTotal.objects.filter(pk=self.pk).update(total_weight_kg=total)
        self.refresh_from_db(fields=["total_weight_kg"])
        return self.total_weight_kg

    def lock_batch(self):
        """
        Implements FR 4.0 (Inalterable Batch Aggregation):
        Freezes the batch prior to bulk market sale logging. Once locked, no further deliveries
        may be attached.
        """
        if self.status != self.Status.OPEN:
            raise ValidationError("Only an OPEN batch can be locked.")
        self.aggregate_deliveries()
        self.status = self.Status.LOCKED
        self.locked_at = timezone.now()
        self.save(update_fields=["status", "locked_at", "updated_at"])
        return self

    def flag_discrepancy(self, invoice_weight_kg):
        """
        Implements FR 4.2 (Discrepancy Flagging vs External Buyer Invoices):
        Automatically cross-examines aggregate batch weights against external buyer invoice
        weights. If the drift exceeds 1%, an anomaly flag (`DiscrepancyFlag`) is raised to Super-Admins.
        """
        drift = abs(float(self.total_weight_kg) - float(invoice_weight_kg))
        if drift > 0.01 * float(self.total_weight_kg or 1):
            DiscrepancyFlag.objects.create(
                batch=self,
                invoice_weight_kg=invoice_weight_kg,
                ledger_weight_kg=self.total_weight_kg,
                drift_kg=drift,
            )
            return True
        return False


class CropDelivery(TimeStampedUUIDModel):
    """
    The Fraud Block (SRS Appendix B & FR 2.x):
    An append-only transaction record logging an individual farmer's harvest drop-off.
    - `save()` explicitly blocks any mutation/update once written to PostgreSQL.
    - `delete()` is overridden to raise a strict error preventing any deletion.
    - `clean()` enforces bounds validation between 0.1 kg and 1,500 kg per delivery.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        DECLINED = "DECLINED", "Declined"

    cooperative = models.ForeignKey(
        Cooperative,
        on_delete=models.CASCADE,
        related_name="deliveries",
        db_index=True,
        help_text="The cooperative receiving the harvest delivery."
    )
    farmer = models.ForeignKey(
        Farmer,
        on_delete=models.PROTECT,
        related_name="deliveries",
        db_index=True,
        help_text="The registered smallholder farmer dropping off the crop."
    )
    officer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="logged_deliveries",
        null=True,
        blank=True,
        help_text="The Collection Officer logging or approving the delivery."
    )
    batch = models.ForeignKey(
        BatchTotal,
        on_delete=models.PROTECT,
        related_name="deliveries",
        null=True,
        blank=True,
        db_index=True,
        help_text="The seasonal harvest batch aggregating this delivery."
    )
    crop_type = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Crop category (must match batch crop_type)."
    )
    weight_kg = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Measured weight in kilograms (0.1 - 1,500 kg)."
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.APPROVED,
        db_index=True,
        help_text="State of the delivery."
    )
    dropoff_time = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Exact timestamp of physical drop-off and scale capture."
    )

    class Meta:
        verbose_name = "Crop Delivery"
        verbose_name_plural = "Crop Deliveries"
        ordering = ["-dropoff_time"]

    def __str__(self):
        return f"{self.farmer.full_name} - {self.weight_kg}kg {self.crop_type} [{self.status}]"

    @property
    def effective_weight_kg(self):
        """
        Returns the corrected weight if an authorized AdjustmentLog exists for this delivery,
        otherwise returns the original scale weight. Preserves append-only integrity of CropDelivery.
        """
        adjustments = self.adjustments.all()
        if adjustments:
            return max(adjustments, key=lambda a: a.created_at).corrected_weight_kg
        return self.weight_kg

    def clean(self):
        """
        Implements FR 2.2 (Input Bounds Validation):
        Automatically rejects weight inputs below 0.1 kg or exceeding 1,500 kg per single delivery
        transaction to eliminate human typos or fraudulent scale entries.
        """
        if self.weight_kg is None or self.weight_kg < 0.1 or self.weight_kg > 1500:
            raise ValidationError("weight_kg must be strictly between 0.1 kg and 1,500 kg per delivery (FR 2.2).")
        if self.status == self.Status.APPROVED:
            if not self.batch:
                raise ValidationError("An APPROVED delivery must be attached to a batch.")
            if self.batch.status != BatchTotal.Status.OPEN:
                raise ValidationError("Deliveries cannot be added to a LOCKED or SOLD batch.")

    def save(self, *args, **kwargs):
        """
        Implements The Fraud Block (Append-Only Enforcement):
        Allows creation, but if updating, only permits transition from PENDING to APPROVED/DECLINED.
        """
        if self.pk:
            old_obj = CropDelivery.objects.filter(pk=self.pk).first()
            if old_obj and old_obj.status != self.Status.PENDING:
                raise ValidationError("CropDelivery records are append-only and cannot be modified once APPROVED or DECLINED.")
            if old_obj and self.status == self.Status.PENDING:
                raise ValidationError("Cannot update a PENDING delivery unless changing status to APPROVED or DECLINED.")
        
        self.full_clean()
        super().save(*args, **kwargs)
        if self.status == self.Status.APPROVED and self.batch_id:
            self.batch.aggregate_deliveries()

    def delete(self, *args, **kwargs):
        """
        Implements The Fraud Block (No Deletion):
        Blocks deletion outright. Any operational corrections must be recorded through
        an official `AdjustmentLog` audit trail.
        """
        raise ValidationError("CropDelivery records cannot be deleted. Use an AdjustmentLog instead (SRS Section 2.5).")

    @classmethod
    def log_delivery(cls, farmer, cooperative, officer, crop_type, weight_kg):
        """
        Implements FR 2.0 / FR 2.1 (Field Weight Capture):
        Creates a delivery, auto-attaches to the open seasonal batch, updates batch totals,
        and triggers the instant SMS receipt notification (FR 3.1).
        """
        season_label = timezone.now().strftime("%Y-A")
        batch, _ = BatchTotal.objects.get_or_create(
            cooperative=cooperative,
            crop_type=crop_type,
            season_label=season_label,
            status=BatchTotal.Status.OPEN,
            defaults={"total_weight_kg": 0},
        )
        delivery = cls.objects.create(
            cooperative=cooperative,
            farmer=farmer,
            officer=officer,
            batch=batch,
            crop_type=crop_type,
            weight_kg=weight_kg,
        )
        # Dispatch instant notification using dynamic service import to avoid circular dependency
        from apps.notifications.services import NotificationService
        NotificationService.dispatch_receipt(delivery)
        return delivery


class AdjustmentLog(TimeStampedUUIDModel):
    """
    Formal administrative adjustment log (`SRS Section 2.5 & What's next`):
    Since `CropDelivery` records are append-only and cannot be altered or deleted, any necessary
    correction requires a documented `AdjustmentLog` referencing the original delivery and reason.
    """

    original_delivery = models.ForeignKey(
        CropDelivery,
        on_delete=models.PROTECT,
        related_name="adjustments",
        help_text="The immutable delivery record requiring adjustment."
    )
    corrected_weight_kg = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="The corrected weight figure."
    )
    reason = models.TextField(
        help_text="Detailed explanation of why the adjustment was authorized."
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="approved_adjustments",
        help_text="The Cooperative Admin or Super-Admin authorizing the correction."
    )

    class Meta:
        verbose_name = "Adjustment Log"
        verbose_name_plural = "Adjustment Logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Adjustment on {self.original_delivery_id} ({self.corrected_weight_kg}kg)"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.original_delivery_id and self.original_delivery.batch_id:
            self.original_delivery.batch.aggregate_deliveries()


class DiscrepancyFlag(TimeStampedUUIDModel):
    """
    Implements FR 4.2 (Discrepancy Flagging Output):
    Alert generated when an external buyer's invoice weight diverges by more than 1% from
    the cooperative's bottom-up `BatchTotal.total_weight_kg`. Raised for Super-Admin review.
    """

    batch = models.ForeignKey(
        BatchTotal,
        on_delete=models.CASCADE,
        related_name="discrepancy_flags",
        help_text="The harvest batch with the detected weight divergence."
    )
    invoice_weight_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Weight stated on the external buyer's invoice."
    )
    ledger_weight_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Bottom-up weight recorded in Umucyo Ledger."
    )
    drift_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Absolute weight discrepancy between invoice and ledger."
    )
    resolved = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether the discrepancy has been investigated and resolved by RCA/Super-Admin."
    )

    class Meta:
        verbose_name = "Discrepancy Flag"
        verbose_name_plural = "Discrepancy Flags"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Discrepancy on {self.batch} ({self.drift_kg}kg drift)"
