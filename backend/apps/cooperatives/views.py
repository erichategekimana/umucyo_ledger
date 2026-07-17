"""
Cooperatives Domain Views & Controllers.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from common.permissions import IsCooperativeAdmin, scoped_queryset
from .models import Cooperative, CooperativeStaff, Farmer
from .serializers import CooperativeSerializer, CooperativeStaffSerializer, FarmerSerializer


class CooperativeViewSet(viewsets.ModelViewSet):
    """
    CRUD management for Cooperatives.
    Only accessible by authenticated staff/admins.
    """
    serializer_class = CooperativeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return scoped_queryset(self.request, Cooperative, coop_field="id").order_by("name")


class CooperativeStaffViewSet(viewsets.ModelViewSet):
    """
    CRUD management for Cooperative Staff Profiles.
    Restricted to Cooperative Admins and Super-Admins.
    """
    serializer_class = CooperativeStaffSerializer
    permission_classes = [IsCooperativeAdmin]

    def get_queryset(self):
        return scoped_queryset(self.request, CooperativeStaff).order_by("-created_at")


class FarmerViewSet(viewsets.ModelViewSet):
    """
    CRUD management for Farmer profiles and instant balance inquiries.
    Scoped strictly to the user's cooperative (NFR 1).
    """
    serializer_class = FarmerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return scoped_queryset(self.request, Farmer).order_by("full_name")

    @action(detail=True, methods=["get"])
    def balance(self, request, pk=None):
        """
        Implements FR 1.2 (Historical Delivery Query over REST API):
        Returns the farmer's balance summary and last 3 deliveries.
        """
        farmer = self.get_object()
        return Response(farmer.query_balance())
