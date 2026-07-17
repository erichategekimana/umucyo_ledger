from django.apps import AppConfig


class UssdGatewayConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.ussd_gateway"
    verbose_name = "USSD Gateway (*789#)"
