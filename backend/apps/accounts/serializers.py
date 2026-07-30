"""
Accounts Domain Serializers & Custom JWT Claims.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Role


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["username", "email", "phone_number", "password", "role", "preferred_language"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_phone_number(self, value):
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        username = validated_data.get("username")
        if username and User.objects.filter(username=username).exists():
            suffix = 2
            candidate = f"{username}-{suffix}"
            while User.objects.filter(username=candidate).exists():
                suffix += 1
                candidate = f"{username}-{suffix}"
            validated_data["username"] = candidate
        user = User.objects.create_user(**validated_data, password=password)
        return user


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

    def _get_user_from_identifier(self, identifier):
        if not identifier:
            return None

        identifier = identifier.strip()
        if "@" in identifier:
            return User.objects.filter(email__iexact=identifier).order_by("-created_at").first()

        if identifier.startswith("+") or identifier.replace("+", "").isdigit():
            return User.objects.filter(phone_number=identifier).order_by("-created_at").first()

        return User.objects.filter(username=identifier).order_by("-created_at").first()

    def validate(self, attrs):
        identifier = attrs.get("username")
        password = attrs.get("password")

        user = self._get_user_from_identifier(identifier)
        if not user or not user.is_active or not user.check_password(password):
            raise serializers.ValidationError({"detail": "No active account found with the given credentials"})

        self.user = user
        data = super().validate({"username": user.username, "password": password})
        data["user"] = UserSerializer(user).data
        return data
