"""
Harvest Ledger Domain URL Router.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BatchTotalViewSet, CropDeliveryViewSet, AdjustmentLogViewSet, DiscrepancyFlagViewSet

router = DefaultRouter()
router.register(r"batches", BatchTotalViewSet, basename="batch")
router.register(r"deliveries", CropDeliveryViewSet, basename="delivery")
router.register(r"adjustments", AdjustmentLogViewSet, basename="adjustment")
router.register(r"discrepancies", DiscrepancyFlagViewSet, basename="discrepancy")

urlpatterns = [
    path("", include(router.urls)),
]
