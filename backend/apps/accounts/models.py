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
