"""
Cooperatives Domain URL Router.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CooperativeViewSet, CooperativeStaffViewSet, FarmerViewSet

router = DefaultRouter()
router.register(r"cooperatives", CooperativeViewSet, basename="cooperative")
router.register(r"staff", CooperativeStaffViewSet, basename="cooperative-staff")
router.register(r"farmers", FarmerViewSet, basename="farmer")

urlpatterns = [
    path("", include(router.urls)),
]
