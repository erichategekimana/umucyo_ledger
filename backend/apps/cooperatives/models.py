"""
Cooperatives Domain Models.

Defines `Cooperative`, `CooperativeStaff`, and `Farmer` profiles linking personnel
and members to physical collection infrastructure.
"""
from django.conf import settings
from django.db import models
from django.db.models import Sum
from common.models import TimeStampedUUIDModel
from apps.accounts.models import ApplicationStatus


class Cooperative(TimeStampedUUIDModel):
    """
    Primary organization entity representing an agricultural cooperative registered
    with the Rwanda Cooperative Agency (RCA).
    """

    name = models.CharField(
        max_length=255,
        help_text="Official registered legal name of the cooperative."
    )
    rca_registration_no = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text="Unique regulatory registration code issued by the RCA (SRS Section 1.4 & Appendix A)."
    )
    sector = models.CharField(
        max_length=120,
        db_index=True,
        help_text="Geographic sector where the cooperative is headquartered."
    )
    district = models.CharField(
        max_length=120,
        db_index=True,
        help_text="District where the cooperative operates."
    )
    
    # Registration specific fields
    preferred_name = models.CharField(
        max_length=120,
        blank=True,
        null=True,
        help_text="Optional short form or preferred name."
    )
    crop = models.CharField(
        max_length=120,
        default="Coffee",
        help_text="Primary crop grown by the cooperative."
    )
    certificate = models.FileField(
        upload_to="cooperative_certificates/",
        null=True,
        blank=True,
        help_text="Certificate of Association issued by the RCA (PDF)."
    )
    tin_certificate = models.FileField(
        upload_to="cooperative_tins/",
        null=True,
        blank=True,
        help_text="Taxpayer Identification Number (TIN) certificate (PDF/PNG)."
    )
    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.PENDING,
        help_text="Approval status by Super Admin."
    )
    
    # Applicant admin details
    admin_first_name = models.CharField(max_length=100, blank=True)
    admin_last_name = models.CharField(max_length=100, blank=True)
    admin_phone = models.CharField(max_length=20, blank=True)

    class Meta:
        verbose_name = "Cooperative"
        verbose_name_plural = "Cooperatives"
        ordering = ["name"]

    def __str__(self):
        return self.name


class CooperativeStaff(TimeStampedUUIDModel):
    """
    Employs relationship linking a User (Manager, Officer, Admin, Vet) to a specific Cooperative.
    Enforces data scoping across administrative dashboard views.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="staff_profile",
        help_text="User profile assigned to this cooperative."
    )
    cooperative = models.ForeignKey(
        Cooperative,
        on_delete=models.CASCADE,
        related_name="staff",
        help_text="The cooperative employing this staff member."
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the staff member is currently active."
    )

    class Meta:
        verbose_name = "Cooperative Staff Profile"
        verbose_name_plural = "Cooperative Staff Profiles"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} @ {self.cooperative}"


class Farmer(TimeStampedUUIDModel):
    """
    Registers relationship: links a smallholder member to their Cooperative and (optional) User account.
    Serves as the target anchor for all harvest delivery entries and USSD balance lookups.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="farmer_profile",
        null=True,
        blank=True,
        help_text="Optional link to a User account for advanced farmers."
    )
    cooperative = models.ForeignKey(
        Cooperative,
        on_delete=models.CASCADE,
        related_name="farmers",
        help_text="The cooperative where this farmer drops off yields."
    )
    national_id = models.CharField(
        max_length=32,
        unique=True,
        db_index=True,
        help_text="National identification card number (unique identifier)."
    )
    full_name = models.CharField(
        max_length=255,
        help_text="Full legal name of the farmer."
    )
    phone_number = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Primary cell phone number used for offline USSD queries (*789#) and instant SMS receipts."
    )
    district = models.CharField(
        max_length=120,
        help_text="District where the farmer's agricultural plots are located."
    )
    
    # Approval fields
    approved = models.BooleanField(
        default=False,
        help_text="Whether the farmer is approved by the cooperative admin."
    )
    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.PENDING,
        help_text="Current approval status."
    )

    class Meta:
        verbose_name = "Farmer Profile"
        verbose_name_plural = "Farmer Profiles"
        ordering = ["full_name"]

    def __str__(self):
        return f"{self.full_name} ({self.national_id})"

    @property
    def total_season_kg(self):
        """
        Dynamically computes the total running weight in kilograms contributed by this farmer
        across all logged deliveries during the active season, respecting any scale adjustments.
        """
        return sum(d.effective_weight_kg for d in self.deliveries.prefetch_related("adjustments"))

    def query_balance(self):
        """
        Implements FR 1.2 (Historical Delivery Query):
        Returns the last 3 crop delivery weights recorded under the farmer's ID alongside
        their running total season balance and estimated earnings in RWF.
        """
        from apps.harvest_ledger.models import CropPrice
        price_map = {cp.name.lower(): float(cp.price_per_kg) for cp in CropPrice.objects.all()}

        approved_deliveries = self.deliveries.filter(status="APPROVED")
        total_kg = sum(float(d.effective_weight_kg) for d in approved_deliveries)
        total_earnings = sum(
            float(d.effective_weight_kg) * price_map.get(d.crop_type.lower(), 0.0)
            for d in approved_deliveries
        )

        last_three = approved_deliveries.order_by("-dropoff_time")[:3]
        return {
            "farmer": self.full_name,
            "national_id": self.national_id,
            "cooperative": self.cooperative.name,
            "total_season_kg": round(total_kg, 2),
            "total_earnings_rwf": round(total_earnings, 2),
            "last_deliveries": [
                {
                    "crop_type": d.crop_type,
                    "weight_kg": float(d.weight_kg),
                    "price_per_kg": price_map.get(d.crop_type.lower(), 0.0),
                    "estimated_payout_rwf": round(float(d.effective_weight_kg) * price_map.get(d.crop_type.lower(), 0.0), 2),
                    "dropoff_time": d.dropoff_time.isoformat(),
                }
                for d in last_three
            ],
        }
