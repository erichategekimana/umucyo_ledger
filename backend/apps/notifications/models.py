"""
Notifications Domain Models.

Implements FR 3.0 / FR 3.1 / FR 3.2 (Instant Delivery Receipt Dispatch & Logging).
"""
from django.db import models
from common.models import TimeStampedUUIDModel
from apps.cooperatives.models import Farmer


class Notification(TimeStampedUUIDModel):
    """
    Implements FR 3.1 & FR 3.2:
    Logs an immutable record of an instant SMS delivery receipt dispatched to a farmer's
    mobile phone upon field weight capture.
    """

    farmer = models.ForeignKey(
        Farmer,
        on_delete=models.CASCADE,
        related_name="notifications",
        db_index=True,
        help_text="The farmer receiving the SMS receipt."
    )
    delivery_id_str = models.CharField(
        max_length=64,
        db_index=True,
        help_text="UUID string reference to the CropDelivery that triggered this notification."
    )
    message = models.TextField(
        help_text="Exact text of the SMS receipt sent to the farmer."
    )
    sent_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when the SMS notification was generated and dispatched."
    )
    is_read = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Read status flag for the notification."
    )

    class Meta:
        verbose_name = "SMS Receipt Notification"
        verbose_name_plural = "SMS Receipt Notifications"
        ordering = ["-sent_at"]

    def __str__(self):
        return f"Receipt to {self.farmer.phone_number} at {self.sent_at}"
