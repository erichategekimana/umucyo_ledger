"""
Notifications Domain Serializers.
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializes instant SMS delivery receipts."""

    farmer_name = serializers.SerializerMethodField()
    farmer_phone = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ["id", "farmer", "farmer_name", "farmer_phone", "delivery_id_str", "message", "sent_at", "is_read"]
        read_only_fields = ["id", "sent_at"]

    def get_farmer_name(self, obj):
        if obj.farmer:
            return obj.farmer.full_name
        return "System"

    def get_farmer_phone(self, obj):
        if obj.farmer:
            return obj.farmer.phone_number
        return ""
