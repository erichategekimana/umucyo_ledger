"""
Accounts Domain Views and API Controllers.
"""
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from common.permissions import IsCooperativeAdmin
from .models import User
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, RegisterSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """Provides JWT access and refresh tokens with custom user metadata embedded in payload."""
    serializer_class = CustomTokenObtainPairSerializer


class RegisterViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def create(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """
    Allows management of platform users.
    Restricted to Cooperative Admins and Super-Admins (NFR 1).
    """
    serializer_class = UserSerializer
    permission_classes = [IsCooperativeAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == "SUPER_ADMIN":
            return User.objects.all().order_by("-created_at")
        # Cooperative admins only see users linked to their cooperative
        return User.objects.filter(role__in=["COLLECTION_OFFICER", "MANAGER", "VETERINARIAN", "FARMER"]).order_by("-created_at")

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Returns the authenticated user's profile and permissions."""
        return Response(UserSerializer(request.user).data)
