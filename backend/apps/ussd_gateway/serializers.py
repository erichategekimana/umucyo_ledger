from rest_framework import serializers
from .models import USSDLog

class USSDLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = USSDLog
        fields = [
            'id', 'session_id', 'phone_number', 'text', 'response',
            'menu_level', 'is_final', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']