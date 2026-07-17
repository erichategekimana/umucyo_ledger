"""
Agronomy & Veterinary Monitoring Domain Serializers.
"""
from rest_framework import serializers
from .models import AnomalyReport


class AnomalyReportSerializer(serializers.ModelSerializer):
    """Serializes AnomalyReport details including GIS coordinates."""

    cooperative_name = serializers.CharField(source="cooperative.name", read_only=True)
    reported_by_username = serializers.CharField(source="reported_by.username", read_only=True)

    class Meta:
        model = AnomalyReport
        fields = [
            "id", "cooperative", "cooperative_name", "reported_by", "reported_by_username",
            "sector", "latitude", "longitude", "category", "description", "severity",
            "resolved", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "reported_by", "created_at", "updated_at"]
