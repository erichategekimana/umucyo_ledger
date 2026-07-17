"""
Cooperatives Domain Serializers.
"""
from rest_framework import serializers
from .models import Cooperative, CooperativeStaff, Farmer


class CooperativeSerializer(serializers.ModelSerializer):
    """Serializes Cooperative details."""

    class Meta:
        model = Cooperative
        fields = ["id", "name", "rca_registration_no", "sector", "district", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class CooperativeStaffSerializer(serializers.ModelSerializer):
    """Serializes staff profile connections."""

    user_details = serializers.SerializerMethodField()
    cooperative_name = serializers.CharField(source="cooperative.name", read_only=True)

    class Meta:
        model = CooperativeStaff
        fields = ["id", "user", "user_details", "cooperative", "cooperative_name", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_user_details(self, obj):
        return {
            "username": obj.user.username,
            "email": obj.user.email,
            "phone_number": obj.user.phone_number,
            "role": obj.user.role,
        }


class FarmerSerializer(serializers.ModelSerializer):
    """Serializes Farmer profile and exposes computed total_season_kg."""

    cooperative_name = serializers.CharField(source="cooperative.name", read_only=True)
    total_season_kg = serializers.DecimalField(source="*total_season_kg", max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Farmer
        fields = [
            "id", "user", "cooperative", "cooperative_name", "national_id",
            "full_name", "phone_number", "district", "total_season_kg",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "total_season_kg", "created_at", "updated_at"]

    def get_total_season_kg(self, obj):
        return obj.total_season_kg
