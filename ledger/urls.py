from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register("cooperatives", views.CooperativeViewSet, basename="cooperative")
router.register("staff", views.CooperativeStaffViewSet, basename="staff")
router.register("farmers", views.FarmerViewSet, basename="farmer")
router.register("batches", views.BatchTotalViewSet, basename="batch")
router.register("deliveries", views.CropDeliveryViewSet, basename="delivery")
router.register("sales", views.BulkSaleViewSet, basename="sale")
router.register("discrepancies", views.DiscrepancyFlagViewSet, basename="discrepancy")
router.register("anomalies", views.AnomalyReportViewSet, basename="anomaly")
router.register("notifications", views.NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/summary/", views.DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
