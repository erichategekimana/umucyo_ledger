"""
Notifications Domain Serializers.
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializes instant SMS delivery receipts."""

    farmer_name = serializers.CharField(source="farmer.full_name", read_only=True)
    farmer_phone = serializers.CharField(source="farmer.phone_number", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "farmer", "farmer_name", "farmer_phone", "delivery_id_str", "message", "sent_at"]
        read_only_fields = ["id", "sent_at"]
