from rest_framework import serializers

from .models import (
    AdjustmentLog, AnomalyReport, BatchTotal, BulkSale, Cooperative,
    CooperativeStaff, CropDelivery, DiscrepancyFlag, Farmer, Notification,
    RevenueDistribution, User,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "phone_number", "role", "preferred_language", "created_at"]
        read_only_fields = ["id", "created_at"]


class CooperativeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cooperative
        fields = ["id", "name", "rca_registration_no", "sector", "district", "created_at"]
        read_only_fields = ["id", "created_at"]


class CooperativeStaffSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CooperativeStaff
        fields = ["id", "user", "cooperative", "is_active"]
        read_only_fields = ["id"]


class FarmerSerializer(serializers.ModelSerializer):
    total_season_kg = serializers.ReadOnlyField()

    class Meta:
        model = Farmer
        fields = [
            "id", "cooperative", "national_id", "full_name", "phone_number",
            "district", "total_season_kg",
        ]
        read_only_fields = ["id"]


class BatchTotalSerializer(serializers.ModelSerializer):
    class Meta:
        model = BatchTotal
        fields = [
            "id", "cooperative", "crop_type", "season_label",
            "total_weight_kg", "status", "created_at", "locked_at",
        ]
        read_only_fields = ["id", "total_weight_kg", "status", "created_at", "locked_at"]


class CropDeliverySerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source="farmer.full_name", read_only=True)

    class Meta:
        model = CropDelivery
        fields = [
            "id", "cooperative", "farmer", "farmer_name", "officer", "batch",
            "crop_type", "weight_kg", "dropoff_time", "locked",
        ]
        read_only_fields = ["id", "officer", "batch", "dropoff_time", "locked"]

    def validate_weight_kg(self, value):
        if value < 0.1 or value > 1500:
            raise serializers.ValidationError("weight_kg must be between 0.1 and 1500 kg (FR 2.2).")
        return value


class AdjustmentLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdjustmentLog
        fields = ["id", "original_delivery", "corrected_weight_kg", "reason", "approved_by", "created_at"]
        read_only_fields = ["id", "approved_by", "created_at"]


class BulkSaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkSale
        fields = [
            "id", "batch", "buyer_name", "sale_price_rwf", "bank_transfer_ref",
            "verified", "recorded_by", "created_at",
        ]
        read_only_fields = ["id", "recorded_by", "created_at"]


class RevenueDistributionSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source="farmer.full_name", read_only=True)

    class Meta:
        model = RevenueDistribution
        fields = [
            "id", "sale", "farmer", "farmer_name", "contribution_kg",
            "share_percentage", "payout_rwf", "created_at",
        ]
        read_only_fields = fields


class DiscrepancyFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscrepancyFlag
        fields = ["id", "batch", "invoice_weight_kg", "ledger_weight_kg", "drift_kg", "resolved", "created_at"]
        read_only_fields = ["id", "ledger_weight_kg", "drift_kg", "created_at"]


class AnomalyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnomalyReport
        fields = [
            "id", "cooperative", "reported_by", "sector", "latitude", "longitude",
            "category", "description", "severity", "reported_at", "resolved",
        ]
        read_only_fields = ["id", "reported_by", "reported_at"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "farmer", "delivery", "message", "sent_at"]
        read_only_fields = fields
