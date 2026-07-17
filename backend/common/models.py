"""
Umucyo Ledger - Common Abstract Base Models.

Provides foundational database attributes for industrial scalability, auditability,
and security across all domain applications.
"""
import uuid
from django.db import models


class TimeStampedUUIDModel(models.Model):
    """
    Abstract base class providing every domain model with:
    1. Cryptographically secure, non-sequential UUID primary keys (`id`), preventing
       ID enumeration attacks and enabling horizontal database scalability across nodes.
    2. Automatic immutable creation timestamps (`created_at`) for chronological auditing.
    3. Automatic modification timestamps (`updated_at`) tracking record mutations.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Cryptographically secure UUID v4 primary key."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when the record was first persisted to PostgreSQL."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the record was last modified."
    )

    class Meta:
        abstract = True
