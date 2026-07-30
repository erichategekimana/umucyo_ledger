"""
Accounts Domain Models.

Implements NFR 1 (Role-Based Access Separation) and NFR 5 (Bilingual Localization Support).
Defines the six user classes established in SRS Section 2.3.
"""
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from common.models import TimeStampedUUIDModel


class Role(models.TextChoices):
    """
    Enforces the six user classes and characteristics (SRS Section 2.3):
    1. FARMER: Low technical literacy; queries via offline USSD (*789#).
    2. COLLECTION_OFFICER: Field collection staff logging batch arrivals & weights.
    3. MANAGER: Desktop application users tracking sales and revenue splits.
    4. ADMIN: Cooperative administrators managing internal permissions and health data.
    5. VETERINARIAN: Extension officers monitoring regional health indicators & GIS heatmaps.
    6. SUPER_ADMIN: RCA Regulators with complete national visibility and audit capabilities.
    """
    FARMER = "FARMER", "Farmer"
    COLLECTION_OFFICER = "COLLECTION_OFFICER", "Cooperative Collection Officer"
    MANAGER = "MANAGER", "Cooperative Manager / Accountant"
    ADMIN = "ADMIN", "Cooperative Admin"
    VETERINARIAN = "VETERINARIAN", "Veterinarian / Extension Officer"
    SUPER_ADMIN = "SUPER_ADMIN", "Super-Admin (RCA)"


class User(AbstractUser, TimeStampedUUIDModel):
    """
    Core authentication entity combining Django's AbstractUser with Umucyo Ledger's
    TimeStampedUUIDModel and custom role/phone properties.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Primary phone number used for USSD identification and SMS notifications."
    )
    role = models.CharField(
        max_length=32,
        choices=Role.choices,
        db_index=True,
        help_text="Assigned user role governing API and USSD access separation."
    )
    preferred_language = models.CharField(
        max_length=8,
        choices=[("rw", "Kinyarwanda"), ("en", "English")],
        default="rw",
        help_text="Preferred interface language (NFR 5)."
    )

    REQUIRED_FIELDS = ["email", "role", "phone_number"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class ApplicationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    DECLINED = "DECLINED", "Declined"


class VeterinarianApplication(TimeStampedUUIDModel):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="vet_application",
        null=True,
        blank=True,
        help_text="Link to User account once approved."
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    national_id = models.CharField(max_length=32, unique=True, help_text="National ID or Passport number")
    is_rwandan = models.BooleanField(default=True, help_text="Nationality: Rwandan or Foreigner")
    
    # Documents
    national_id_document = models.FileField(upload_to="vet_applications/ids/")
    degree_certificate = models.FileField(upload_to="vet_applications/degrees/")
    transcripts = models.FileField(upload_to="vet_applications/transcripts/")
    proof_of_internship = models.FileField(upload_to="vet_applications/internships/")
    rcvd_certificate = models.FileField(upload_to="vet_applications/rcvd/", help_text="Certificate of Registration (The Roll Certificate) from RCVD")
    annual_practicing_license = models.FileField(upload_to="vet_applications/licenses/")
    
    status = models.CharField(max_length=20, choices=ApplicationStatus.choices, default=ApplicationStatus.PENDING)

    class Meta:
        verbose_name = "Veterinarian Application"
        verbose_name_plural = "Veterinarian Applications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.status})"
