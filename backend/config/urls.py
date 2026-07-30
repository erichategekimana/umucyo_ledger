"""
Umucyo Ledger - Central URL Configuration.

Aggregates all REST API v1 endpoints (`/api/v1/...`) and offline USSD Gateway (`/ussd/callback/`).
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.cooperatives.urls")),
    path("api/v1/", include("apps.harvest_ledger.urls")),
    path("api/v1/", include("apps.sales_distribution.urls")),
    path("api/v1/", include("apps.agronomy_monitoring.urls")),
    path("api/v1/", include("apps.notifications.urls")),
    path("api/v1/ussd/", include("apps.ussd_gateway.urls")),
    path("ussd/", include("apps.ussd_gateway.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
