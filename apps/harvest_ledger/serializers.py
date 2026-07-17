"""
Harvest Ledger Domain Serializers.
"""
from rest_framework import serializers
from .models import BatchTotal, CropDelivery, AdjustmentLog, DiscrepancyFlag


class BatchTotalSerializer(serializers.ModelSerializer):
    """Serializes BatchTotal records with computed bottom-up figures."""

    cooperative_name = serializers.CharField(source="cooperative.name", read_only=True)

    class Meta:
        model = BatchTotal
        fields = [
            "id", "cooperative", "cooperative_name", "crop_type", "season_label",
            "total_weight_kg", "status", "locked_at", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "total_weight_kg", "locked_at", "created_at", "updated_at"]


class CropDeliverySerializer(serializers.ModelSerializer):
    """Serializes CropDelivery append-only records."""

    farmer_name = serializers.CharField(source="farmer.full_name", read_only=True)
    officer_username = serializers.CharField(source="officer.username", read_only=True)
    cooperative_name = serializers.CharField(source="cooperative.name", read_only=True)

    class Meta:
        model = CropDelivery
        fields = [
            "id", "cooperative", "cooperative_name", "farmer", "farmer_name",
            "officer", "officer_username", "batch", "crop_type", "weight_kg",
            "dropoff_time", "created_at"
        ]
        read_only_fields = ["id", "dropoff_time", "created_at"]


class AdjustmentLogSerializer(serializers.ModelSerializer):
    """Serializes administrative adjustment records."""

    approved_by_username = serializers.CharField(source="approved_by.username", read_only=True)

    class Meta:
        model = AdjustmentLog
        fields = [
            "id", "original_delivery", "corrected_weight_kg", "reason",
            "approved_by", "approved_by_username", "created_at"
        ]
        read_only_fields = ["id", "approved_by", "created_at"]


class DiscrepancyFlagSerializer(serializers.ModelSerializer):
    """Serializes DiscrepancyFlag records for Super-Admin review."""

    batch_details = serializers.SerializerMethodField()

    class Meta:
        model = DiscrepancyFlag
        fields = [
            "id", "batch", "batch_details", "invoice_weight_kg", "ledger_weight_kg",
            "drift_kg", "resolved", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "batch_details", "ledger_weight_kg", "drift_kg", "created_at", "updated_at"]

    def get_batch_details(self, obj):
        return {
            "cooperative": obj.batch.cooperative.name,
            "crop_type": obj.batch.crop_type,
            "season_label": obj.batch.season_label,
        }
