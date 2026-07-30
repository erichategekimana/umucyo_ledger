"""
Accounts Domain Views and API Controllers.
"""
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from common.permissions import IsCooperativeAdmin
from .models import User, VeterinarianApplication, ApplicationStatus
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, RegisterSerializer, VeterinarianApplicationSerializer


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

    @action(detail=True, methods=["post"])
    def change_role(self, request, pk=None):
        target_user = self.get_object()
        new_role = request.data.get("role")
        
        from .models import Role
        if not new_role or new_role not in dict(Role.choices):
            return Response({"detail": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST)
            
        current_user = request.user
        
        if current_user.role == "SUPER_ADMIN":
            target_user.role = new_role
            target_user.save()
            return Response({"detail": f"Role updated to {new_role}."})
            
        if current_user.role == "ADMIN":
            if new_role in ["ADMIN", "SUPER_ADMIN", "VETERINARIAN"]:
                return Response({"detail": "Cannot set to restricted roles."}, status=status.HTTP_403_FORBIDDEN)
            target_user.role = new_role
            target_user.save()
            return Response({"detail": f"Role updated to {new_role}."})
            
        return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)


class VeterinarianApplicationViewSet(viewsets.ModelViewSet):
    """
    Handles submission and review of Veterinarian applications.
    Submission is public (AllowAny), review is SUPER_ADMIN only.
    """
    queryset = VeterinarianApplication.objects.all().order_by("-created_at")
    serializer_class = VeterinarianApplicationSerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        if request.user.role != "SUPER_ADMIN":
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        if request.user.role != "SUPER_ADMIN":
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
            
        application = self.get_object()
        if application.status == ApplicationStatus.APPROVED:
            return Response({"detail": "Already approved."}, status=status.HTTP_400_BAD_REQUEST)
            
        application.status = ApplicationStatus.APPROVED
        application.save()
        
        # Create user with VETERINARIAN role
        username = application.email.split('@')[0]
        if User.objects.filter(username=username).exists():
            username = f"{username}-{application.id.hex[:4]}"
            
        # In a real app, send email to set password. Here we generate a placeholder.
        user = User.objects.create_user(
            username=username,
            email=application.email,
            phone_number=application.phone_number,
            first_name=application.first_name,
            last_name=application.last_name,
            password=f"Temp123!{application.phone_number}",
            role="VETERINARIAN"
        )
        application.user = user
        application.save()
        
        return Response({"detail": "Approved and User created."})

    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        if request.user.role != "SUPER_ADMIN":
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
            
        application = self.get_object()
        application.status = ApplicationStatus.DECLINED
        application.save()
        return Response({"detail": "Declined."})
