"""
Accounts Domain Serializers & Custom JWT Claims.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Role


class UserSerializer(serializers.ModelSerializer):
    """Serializes user profile details while protecting sensitive authentication fields."""

    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "phone_number", "role", "role_display",
            "preferred_language", "is_active", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Customized JWT Token obtain serializer embeds critical user metadata directly
    inside token claims to eliminate redundant database queries on downstream microservices/consumers.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Embed role and phone inside JWT payload
        token["username"] = user.username
        token["role"] = user.role
        token["phone_number"] = user.phone_number
        token["preferred_language"] = user.preferred_language

        # Safely embed cooperative_id if staff or farmer profile is linked
        coop_id = None
        staff_profile = getattr(user, "staff_profile", None)
        if staff_profile and getattr(staff_profile, "cooperative_id", None):
            coop_id = str(staff_profile.cooperative_id)
        else:
            farmer_profile = getattr(user, "farmer_profile", None)
            if farmer_profile and getattr(farmer_profile, "cooperative_id", None):
                coop_id = str(farmer_profile.cooperative_id)

        token["cooperative_id"] = coop_id
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Include user info alongside access and refresh tokens in API response
        data["user"] = UserSerializer(self.user).data
        return data
