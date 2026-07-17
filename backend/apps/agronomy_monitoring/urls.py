"""
Agronomy & Veterinary Monitoring Domain URL Router.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnomalyReportViewSet

router = DefaultRouter()
router.register(r"anomalies", AnomalyReportViewSet, basename="anomaly")

urlpatterns = [
    path("", include(router.urls)),
]
