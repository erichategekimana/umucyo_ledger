from django.apps import AppConfig
from django.db.models.signals import post_migrate


def seed_default_crop_prices(sender, **kwargs):
    try:
        from .models import CropPrice
        DEFAULT_CROPS = [
            ("Coffee", 600.00),
            ("Tea", 500.00),
            ("Beans", 650.00),
            ("Maize", 450.00),
            ("Sweet Potatoes", 350.00),
            ("Irish Potatoes", 400.00),
            ("Rice", 800.00),
            ("Sorghum", 550.00),
            ("Wheat", 700.00),
            ("Soybeans", 750.00),
        ]
        for crop_name, default_price in DEFAULT_CROPS:
            CropPrice.objects.get_or_create(
                name=crop_name,
                defaults={"price_per_kg": default_price}
            )
    except Exception:
        pass


class HarvestLedgerConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.harvest_ledger"
    verbose_name = "Harvest Ledger & Batch Totals"

    def ready(self):
        post_migrate.connect(seed_default_crop_prices, sender=self)
