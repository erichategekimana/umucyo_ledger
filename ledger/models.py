"""
Umucyo Ledger core models.

Implements the class diagram and "Core Structural Integrity Rules" from the
SRS Appendix B:
  - The Fraud Block: CropDelivery is append-only. No UPDATE/DELETE once written.
  - The Bottom-Up Link: BatchTotal.total_weight_kg is always derived as a
    PostgreSQL SUM() over its CropDelivery rows, never hand-entered.
"""
import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Sum
from django.utils import timezone


class Role(models.TextChoices):
    FARMER = "FARMER", "Farmer"
    COLLECTION_OFFICER = "COLLECTION_OFFICER", "Cooperative Collection Officer"
    MANAGER = "MANAGER", "Cooperative Manager / Accountant"
    ADMIN = "ADMIN", "Cooperative Admin"
    VETERINARIAN = "VETERINARIAN", "Veterinarian / Extension Officer"
    SUPER_ADMIN = "SUPER_ADMIN", "Super-Admin (RCA)"


class User(AbstractUser):
    """FR: six-tier role separation (NFR 1 - Role-Based Access Separation)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=32, choices=Role.choices)
    preferred_language = models.CharField(
        max_length=8, choices=[("rw", "Kinyarwanda"), ("en", "English")], default="rw"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    REQUIRED_FIELDS = ["email", "role"]

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Cooperative(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    rca_registration_no = models.CharField(max_length=64, unique=True)
    sector = models.CharField(max_length=120)
    district = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    def generate_audit_report(self):
        """FR 6.2 - Ledger Audit Trail Export (summary aggregate)."""
        deliveries = CropDelivery.objects.filter(cooperative=self)
        return {
            "cooperative": self.name,
            "rca_registration_no": self.rca_registration_no,
            "total_deliveries": deliveries.count(),
            "total_weight_kg": deliveries.aggregate(t=Sum("weight_kg"))["t"] or 0,
            "generated_at": timezone.now().isoformat(),
        }


class CooperativeStaff(models.Model):
    """Employs relationship: staff of a given cooperative (officer/manager/admin/vet)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="staff_profile")
    cooperative = models.ForeignKey(Cooperative, on_delete=models.CASCADE, related_name="staff")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user} @ {self.cooperative}"

    def record_entry(self, farmer, crop_type, weight_kg):
        """FR 2.1 - Crop Weight Ingestion, restricted to Collection Officer role."""
        if self.user.role != Role.COLLECTION_OFFICER:
            raise PermissionError("Only Collection Officers may log deliveries.")
        return CropDelivery.log_delivery(
            farmer=farmer, cooperative=self.cooperative, officer=self.user,
            crop_type=crop_type, weight_kg=weight_kg,
        )


class Farmer(models.Model):
    """Registers relationship: a Farmer profile links a person to their User account."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="farmer_profile",
        null=True, blank=True,
    )
    cooperative = models.ForeignKey(Cooperative, on_delete=models.CASCADE, related_name="farmers")
    national_id = models.CharField(max_length=32, unique=True)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, unique=True)
    district = models.CharField(max_length=120)

    def __str__(self):
        return f"{self.full_name} ({self.national_id})"

    @property
    def total_season_kg(self):
        return self.deliveries.aggregate(t=Sum("weight_kg"))["t"] or 0

    def query_balance(self):
        """FR 1.2 - Historical Delivery Query (last 3 deliveries) + running total."""
        last_three = self.deliveries.order_by("-dropoff_time")[:3]
        return {
            "farmer": self.full_name,
            "total_season_kg": self.total_season_kg,
            "last_deliveries": [
                {"crop_type": d.crop_type, "weight_kg": float(d.weight_kg), "dropoff_time": d.dropoff_time.isoformat()}
                for d in last_three
            ],
        }


class BatchTotal(models.Model):
    """
    The Bottom-Up Link: total_weight_kg is a cached, recomputed-only mirror
    of SUM(CropDelivery.weight_kg) for this batch. It is never edited directly.
    """

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        LOCKED = "LOCKED", "Locked"
        SOLD = "SOLD", "Sold"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cooperative = models.ForeignKey(Cooperative, on_delete=models.CASCADE, related_name="batches")
    crop_type = models.CharField(max_length=64)
    season_label = models.CharField(max_length=32, help_text="e.g. 2026-A")
    total_weight_kg = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    locked_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.cooperative} - {self.crop_type} - {self.season_label}"

    def aggregate_deliveries(self):
        """FR 4.1 - Mathematical Lock Calculation: SUM query, direct edits disabled."""
        total = self.deliveries.aggregate(t=Sum("weight_kg"))["t"] or 0
        BatchTotal.objects.filter(pk=self.pk).update(total_weight_kg=total)
        self.refresh_from_db(fields=["total_weight_kg"])
        return self.total_weight_kg

    def lock_batch(self):
        """FR 4.0 - Inalterable Batch Aggregation: freeze the batch before sale."""
        if self.status != self.Status.OPEN:
            raise ValidationError("Only an OPEN batch can be locked.")
        self.aggregate_deliveries()
        self.status = self.Status.LOCKED
        self.locked_at = timezone.now()
        self.save(update_fields=["status", "locked_at"])
        return self

    def flag_discrepancy(self, invoice_weight_kg):
        """FR 4.2 - Discrepancy Flagging vs external buyer invoices."""
        drift = abs(float(self.total_weight_kg) - float(invoice_weight_kg))
        if drift > 0.01 * float(self.total_weight_kg or 1):
            DiscrepancyFlag.objects.create(
                batch=self, invoice_weight_kg=invoice_weight_kg,
                ledger_weight_kg=self.total_weight_kg, drift_kg=drift,
            )
            return True
        return False


class CropDelivery(models.Model):
    """
    The Fraud Block: append-only. save() blocks mutation of an existing row,
    and delete() is disabled entirely, per SRS 2.5 Design Constraints.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cooperative = models.ForeignKey(Cooperative, on_delete=models.CASCADE, related_name="deliveries")
    farmer = models.ForeignKey(Farmer, on_delete=models.PROTECT, related_name="deliveries")
    officer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="logged_deliveries")
    batch = models.ForeignKey(BatchTotal, on_delete=models.PROTECT, related_name="deliveries", null=True, blank=True)
    crop_type = models.CharField(max_length=64)
    weight_kg = models.DecimalField(max_digits=8, decimal_places=2)
    dropoff_time = models.DateTimeField(auto_now_add=True)
    locked = models.BooleanField(default=True)

    class Meta:
        ordering = ["-dropoff_time"]

    def __str__(self):
        return f"{self.farmer} - {self.weight_kg}kg {self.crop_type}"

    def clean(self):
        # FR 2.2 - Input Bounds Validation
        if self.weight_kg is None or self.weight_kg < 0.1 or self.weight_kg > 1500:
            raise ValidationError("weight_kg must be between 0.1 kg and 1,500 kg per delivery.")

    def save(self, *args, **kwargs):
        if self.pk and CropDelivery.objects.filter(pk=self.pk).exists():
            raise ValidationError("CropDelivery records are append-only and cannot be modified once written.")
        self.full_clean()
        super().save(*args, **kwargs)
        if self.batch_id:
            self.batch.aggregate_deliveries()

    def delete(self, *args, **kwargs):
        raise ValidationError("CropDelivery records cannot be deleted. Use an AdjustmentLog instead.")

    def lock_record(self):
        return self

    @classmethod
    def log_delivery(cls, farmer, cooperative, officer, crop_type, weight_kg):
        """FR 2.0/2.1 + auto-attach to (or open) the season's batch, then notify."""
        batch, _ = BatchTotal.objects.get_or_create(
            cooperative=cooperative, crop_type=crop_type,
            season_label=timezone.now().strftime("%Y-A"), status=BatchTotal.Status.OPEN,
            defaults={"total_weight_kg": 0},
        )
        delivery = cls.objects.create(
            cooperative=cooperative, farmer=farmer, officer=officer,
            batch=batch, crop_type=crop_type, weight_kg=weight_kg,
        )
        Notification.dispatch_receipt(delivery)
        return delivery


class AdjustmentLog(models.Model):
    """Formal administrative adjustment log - the only sanctioned way to correct a mistake."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_delivery = models.ForeignKey(CropDelivery, on_delete=models.PROTECT, related_name="adjustments")
    corrected_weight_kg = models.DecimalField(max_digits=8, decimal_places=2)
    reason = models.TextField()
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="approved_adjustments")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Adjustment on {self.original_delivery_id}"


class BulkSale(models.Model):
    """FR 5.0 - Bulk Market Sale Logging."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.OneToOneField(BatchTotal, on_delete=models.PROTECT, related_name="sale")
    buyer_name = models.CharField(max_length=255)
    sale_price_rwf = models.DecimalField(max_digits=14, decimal_places=2)
    bank_transfer_ref = models.CharField(max_length=120, blank=True)
    verified = models.BooleanField(default=False)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="recorded_sales")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sale of {self.batch} to {self.buyer_name}"

    def calculate_revenue_split(self):
        """FR 6.1 - Percentage Split Calculation: share = (farmer_kg / batch_kg) * net revenue."""
        if not self.verified:
            raise ValidationError("Sale must be verified (bank transfer confirmed) before revenue split.")
        if self.batch.status != BatchTotal.Status.LOCKED and self.batch.status != BatchTotal.Status.SOLD:
            raise ValidationError("Batch must be locked before its sale can be split.")

        total_kg = float(self.batch.total_weight_kg or 0)
        if total_kg <= 0:
            return []

        splits = []
        deliveries_by_farmer = {}
        for d in self.batch.deliveries.all():
            deliveries_by_farmer.setdefault(d.farmer_id, {"farmer": d.farmer, "kg": 0.0})
            deliveries_by_farmer[d.farmer_id]["kg"] += float(d.weight_kg)

        for farmer_id, data in deliveries_by_farmer.items():
            share_pct = data["kg"] / total_kg
            payout = round(share_pct * float(self.sale_price_rwf), 2)
            record, _ = RevenueDistribution.objects.update_or_create(
                sale=self, farmer=data["farmer"],
                defaults={"contribution_kg": data["kg"], "share_percentage": round(share_pct * 100, 4), "payout_rwf": payout},
            )
            splits.append(record)

        self.batch.status = BatchTotal.Status.SOLD
        self.batch.save(update_fields=["status"])
        return splits


class RevenueDistribution(models.Model):
    """Individual farmer payout line generated by BulkSale.calculate_revenue_split()."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale = models.ForeignKey(BulkSale, on_delete=models.CASCADE, related_name="distributions")
    farmer = models.ForeignKey(Farmer, on_delete=models.PROTECT, related_name="payouts")
    contribution_kg = models.DecimalField(max_digits=12, decimal_places=2)
    share_percentage = models.DecimalField(max_digits=6, decimal_places=4)
    payout_rwf = models.DecimalField(max_digits=14, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("sale", "farmer")

    def __str__(self):
        return f"{self.farmer} -> {self.payout_rwf} RWF"


class DiscrepancyFlag(models.Model):
    """FR 4.2 output - raised to Super-Admins when ledger vs invoice weights diverge."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(BatchTotal, on_delete=models.CASCADE, related_name="discrepancy_flags")
    invoice_weight_kg = models.DecimalField(max_digits=12, decimal_places=2)
    ledger_weight_kg = models.DecimalField(max_digits=12, decimal_places=2)
    drift_kg = models.DecimalField(max_digits=12, decimal_places=2)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Discrepancy on {self.batch} ({self.drift_kg}kg)"


class AnomalyReport(models.Model):
    """FR 7.0 - Agronomic & Veterinary Mapping."""

    class Severity(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cooperative = models.ForeignKey(Cooperative, on_delete=models.CASCADE, related_name="anomaly_reports")
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="anomaly_reports")
    sector = models.CharField(max_length=120)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    category = models.CharField(max_length=64, help_text="e.g. crop disease, livestock disease")
    description = models.TextField()
    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.LOW)
    reported_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.category} @ {self.sector} ({self.severity})"


class Notification(models.Model):
    """FR 3.0 - Automated Receipt Notification (simulated SMS gateway log)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name="notifications")
    delivery = models.ForeignKey(CropDelivery, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SMS to {self.farmer.phone_number} @ {self.sent_at}"

    @classmethod
    def dispatch_receipt(cls, delivery: CropDelivery):
        """FR 3.1/3.2 - build + 'send' the SMS the instant a delivery is submitted."""
        running_total = delivery.farmer.total_season_kg
        message = (
            f"{delivery.cooperative.name}: {delivery.weight_kg}kg of {delivery.crop_type} "
            f"recorded on {delivery.dropoff_time.strftime('%Y-%m-%d %H:%M')}. "
            f"Season total: {running_total}kg."
        )
        return cls.objects.create(farmer=delivery.farmer, delivery=delivery, message=message)
