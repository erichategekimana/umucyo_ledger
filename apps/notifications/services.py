"""
Notifications Domain Services.

Implements instant receipt generation and dispatch (FR 3.1 & FR 3.2).
"""
import logging
from .models import Notification

logger = logging.getLogger("umucyo.audit")


class NotificationService:
    """
    Service responsible for constructing bilingual Kinyarwanda/English delivery receipts
    and logging/dispatching them instantly upon field weight capture.
    """

    @classmethod
    def dispatch_receipt(cls, delivery):
        """
        Implements FR 3.1 (Instant Delivery Receipt Dispatch) and FR 3.2 (Receipt Formatting):
        Generates and logs the confirmation receipt containing:
        - Cooperative Name
        - Date and Timestamp
        - Exact Weight in kg
        - Running Seasonal Total (`total_season_kg`)
        """
        farmer = delivery.farmer
        coop_name = delivery.cooperative.name
        total_kg = float(farmer.total_season_kg or 0)
        delivered_kg = float(delivery.weight_kg)
        timestamp_str = delivery.dropoff_time.strftime("%Y-%m-%d %H:%M")

        # Bilingual receipt formatting (NFR 5)
        if getattr(farmer.user, "preferred_language", "rw") == "en":
            message = (
                f"UMUCYO RECEIPT: {coop_name}\n"
                f"Date: {timestamp_str}\n"
                f"Delivered: {delivered_kg} kg ({delivery.crop_type})\n"
                f"Season Total: {total_kg} kg\n"
                f"Ref: {str(delivery.id)[:8]}"
            )
        else:
            message = (
                f"NYEMEZABWISHYU: {coop_name}\n"
                f"Itariki: {timestamp_str}\n"
                f"Wagemuye: {delivered_kg} kg ({delivery.crop_type})\n"
                f"Yose hamwe mu gihembwe: {total_kg} kg\n"
                f"Nomero: {str(delivery.id)[:8]}"
            )

        notification = Notification.objects.create(
            farmer=farmer,
            delivery_id_str=str(delivery.id),
            message=message,
        )
        logger.info(f"SMS_DISPATCH | farmer='{farmer.phone_number}' | msg='{message}'")
        return notification
