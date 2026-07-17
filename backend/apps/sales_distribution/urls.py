"""
Sales & Revenue Distribution Domain URL Router.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BulkSaleViewSet, RevenueDistributionViewSet, AuditReportView

router = DefaultRouter()
router.register(r"sales", BulkSaleViewSet, basename="sale")
router.register(r"payouts", RevenueDistributionViewSet, basename="payout")

urlpatterns = [
    path("cooperatives/<uuid:coop_id>/audit_report/", AuditReportView.as_view(), name="rca_audit_report"),
    path("", include(router.urls)),
]
