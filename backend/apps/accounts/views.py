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
    Cooperative Admins are scoped strictly to users assigned to their cooperative,
    and cannot modify Admin or Super-Admin users.
    """
    serializer_class = UserSerializer
    permission_classes = [IsCooperativeAdmin]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return User.objects.none()

        if user.is_superuser or user.role == "SUPER_ADMIN":
            return User.objects.all().order_by("-created_at")

        if user.role == "ADMIN":
            # Cooperative Admin: scoped strictly to users assigned to their cooperative
            admin_coop_id = None
            if hasattr(user, "staff_profile") and user.staff_profile and user.staff_profile.cooperative_id:
                admin_coop_id = user.staff_profile.cooperative_id
            elif hasattr(user, "farmer_profile") and user.farmer_profile and user.farmer_profile.cooperative_id:
                admin_coop_id = user.farmer_profile.cooperative_id

            if not admin_coop_id:
                return User.objects.none()

            from django.db.models import Q
            return User.objects.filter(
                Q(staff_profile__cooperative_id=admin_coop_id) | Q(farmer_profile__cooperative_id=admin_coop_id)
            ).distinct().order_by("-created_at")

        return User.objects.none()

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Returns the authenticated user's profile and permissions."""
        return Response(UserSerializer(request.user).data)

    def _is_restricted_target(self, target_user):
        """Returns True if target_user is a Super-Admin or Admin user."""
        return bool(
            target_user.is_superuser or target_user.role in ["SUPER_ADMIN", "ADMIN"]
        )

    def update(self, request, *args, **kwargs):
        current_user = request.user
        target_user = self.get_object()
        
        if not current_user.is_superuser and current_user.role != "SUPER_ADMIN":
            if self._is_restricted_target(target_user):
                return Response(
                    {"detail": "Cooperative Admins cannot modify Admin or Super-Admin users."},
                    status=status.HTTP_403_FORBIDDEN
                )
            new_role = request.data.get("role")
            if new_role in ["ADMIN", "SUPER_ADMIN"] or request.data.get("is_superuser"):
                return Response(
                    {"detail": "Only Super-Admins can assign Admin or Super-Admin roles."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        current_user = request.user
        target_user = self.get_object()
        
        if not current_user.is_superuser and current_user.role != "SUPER_ADMIN":
            if self._is_restricted_target(target_user):
                return Response(
                    {"detail": "Cooperative Admins cannot modify Admin or Super-Admin users."},
                    status=status.HTTP_403_FORBIDDEN
                )
            new_role = request.data.get("role")
            if new_role in ["ADMIN", "SUPER_ADMIN"] or request.data.get("is_superuser"):
                return Response(
                    {"detail": "Only Super-Admins can assign Admin or Super-Admin roles."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        current_user = request.user
        target_user = self.get_object()
        
        if not current_user.is_superuser and current_user.role != "SUPER_ADMIN":
            if self._is_restricted_target(target_user):
                return Response(
                    {"detail": "Cooperative Admins cannot modify Admin or Super-Admin users."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post", "patch"])
    def change_status(self, request, pk=None):
        """
        Action to activate/deactivate or approve/decline user status.
        Cooperative Admins can only change status for non-admin/super-admin users in their cooperative.
        """
        target_user = self.get_object()
        current_user = request.user

        if not current_user.is_superuser and current_user.role != "SUPER_ADMIN":
            if self._is_restricted_target(target_user):
                return Response(
                    {"detail": "Cooperative Admins cannot modify Admin or Super-Admin users."},
                    status=status.HTTP_403_FORBIDDEN
                )

        if "is_active" in request.data:
            new_is_active = bool(request.data.get("is_active"))
        elif "status" in request.data:
            st = str(request.data.get("status")).upper()
            new_is_active = st in ["ACTIVE", "APPROVED", "TRUE", "1"]
        else:
            new_is_active = not target_user.is_active

        target_user.is_active = new_is_active
        target_user.save()

        # Synchronize linked profiles
        if hasattr(target_user, "staff_profile") and target_user.staff_profile:
            target_user.staff_profile.is_active = new_is_active
            target_user.staff_profile.save()

        if hasattr(target_user, "farmer_profile") and target_user.farmer_profile:
            target_user.farmer_profile.approved = new_is_active
            target_user.farmer_profile.status = "APPROVED" if new_is_active else "DECLINED"
            target_user.farmer_profile.save()

        return Response({
            "detail": f"User status updated to {'active' if new_is_active else 'inactive'}.",
            "user": UserSerializer(target_user).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post", "patch"])
    def toggle_status(self, request, pk=None):
        """Alias for change_status action."""
        return self.change_status(request, pk)

    @action(detail=True, methods=["post", "patch"])
    def change_role(self, request, pk=None):
        target_user = self.get_object()
        current_user = request.user
        new_role = request.data.get("role")
        
        from .models import Role
        if not new_role or new_role not in dict(Role.choices):
            return Response({"detail": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST)

        if not current_user.is_superuser and current_user.role != "SUPER_ADMIN":
            if self._is_restricted_target(target_user):
                return Response(
                    {"detail": "Cooperative Admins cannot modify Admin or Super-Admin users."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if new_role in ["ADMIN", "SUPER_ADMIN"]:
                return Response(
                    {"detail": "Only Super-Admins can assign Admin or Super-Admin roles."},
                    status=status.HTTP_403_FORBIDDEN
                )

        target_user.role = new_role
        target_user.save()
        return Response({"detail": f"Role updated to {new_role}.", "user": UserSerializer(target_user).data})


class VeterinarianApplicationViewSet(viewsets.ModelViewSet):
    """
    Handles submission and review of Veterinarian applications.
    Submission is public (AllowAny), review is SUPER_ADMIN only.
    """
    queryset = VeterinarianApplication.objects.all().order_by("-created_at")
    serializer_class = VeterinarianApplicationSerializer

    def perform_create(self, serializer):
        application = serializer.save()
        
        # Notify Super Admins
        from apps.notifications.models import Notification
        from apps.accounts.models import User
        super_admins = User.objects.filter(role="SUPER_ADMIN")
        notifications = [
            Notification(user=sa, message=f"New veterinarian application received from {application.first_name} {application.last_name}.")
            for sa in super_admins
        ]
        Notification.objects.bulk_create(notifications)

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
        
        # Activate the associated user account
        if application.user:
            application.user.is_active = True
            application.user.save()
        
        return Response({"detail": "Approved and User activated."})

    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        if request.user.role != "SUPER_ADMIN":
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
            
        application = self.get_object()
        application.status = ApplicationStatus.DECLINED
        application.save()
        
        # Delete the inactive user to free up email/phone
        if application.user and not application.user.is_active:
            application.user.delete()
            
        return Response({"detail": "Declined."})
