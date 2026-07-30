"""
Cooperatives Domain Views & Controllers.
"""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from common.permissions import IsCooperativeAdmin, scoped_queryset
from apps.accounts.models import ApplicationStatus, User
from .models import Cooperative, CooperativeStaff, Farmer
from .serializers import CooperativeSerializer, CooperativeRegistrationSerializer, CooperativeStaffSerializer, FarmerSerializer


class CooperativeViewSet(viewsets.ModelViewSet):
    """
    CRUD management for Cooperatives.
    Only accessible by authenticated staff/admins.
    """
    def get_serializer_class(self):
        if self.action == "create":
            return CooperativeRegistrationSerializer
        return CooperativeSerializer

    def get_permissions(self):
        if self.action in ["create", "approved_list"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.action == "approved_list":
            return Cooperative.objects.filter(status=ApplicationStatus.APPROVED).order_by("name")
        if not self.request.user.is_authenticated:
            return Cooperative.objects.none()
        
        # Super admin sees all, others see only theirs (handled by scoped_queryset)
        if self.request.user.role == "SUPER_ADMIN":
            return Cooperative.objects.all().order_by("-created_at")
            
        return scoped_queryset(self.request, Cooperative, coop_field="id").order_by("name")

    def perform_create(self, serializer):
        cooperative = serializer.save()
        
        # Notify Super Admins
        from apps.notifications.models import Notification
        from apps.accounts.models import User
        super_admins = User.objects.filter(role="SUPER_ADMIN")
        notifications = [
            Notification(user=sa, message=f"New cooperative application received from {cooperative.name}.")
            for sa in super_admins
        ]
        Notification.objects.bulk_create(notifications)

    @action(detail=False, methods=["get"])
    def approved_list(self, request):
        district = request.query_params.get("district")
        qs = self.get_queryset()
        if district:
            qs = qs.filter(district__iexact=district)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        if request.user.role != "SUPER_ADMIN":
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
            
        cooperative = self.get_object()
        if cooperative.status == ApplicationStatus.APPROVED:
            return Response({"detail": "Already approved."}, status=status.HTTP_400_BAD_REQUEST)
            
        cooperative.status = ApplicationStatus.APPROVED
        cooperative.save()
        
        # Create Cooperative Admin user
        if cooperative.admin_phone:
            username = cooperative.admin_first_name.lower() or f"admin_{cooperative.id.hex[:4]}"
            if User.objects.filter(username=username).exists():
                username = f"{username}-{cooperative.id.hex[:4]}"
                
            user, created = User.objects.get_or_create(
                phone_number=cooperative.admin_phone,
                defaults={
                    "username": username,
                    "first_name": cooperative.admin_first_name,
                    "last_name": cooperative.admin_last_name,
                    "role": "ADMIN",
                    "email": f"{username}@example.com"
                }
            )
            if created:
                user.set_password(f"Temp123!{cooperative.admin_phone}")
                user.save()
                
            CooperativeStaff.objects.get_or_create(
                user=user,
                cooperative=cooperative,
                defaults={"is_active": True}
            )
            
        return Response({"detail": "Approved and Admin created."})

    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        if request.user.role != "SUPER_ADMIN":
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
            
        cooperative = self.get_object()
        cooperative.status = ApplicationStatus.DECLINED
        cooperative.save()
        return Response({"detail": "Declined."})


class CooperativeStaffViewSet(viewsets.ModelViewSet):
    """
    CRUD management for Cooperative Staff Profiles.
    Restricted to Cooperative Admins and Super-Admins.
    """
    serializer_class = CooperativeStaffSerializer
    permission_classes = [IsCooperativeAdmin]

    def get_queryset(self):
        return scoped_queryset(self.request, CooperativeStaff).order_by("-created_at")


class FarmerViewSet(viewsets.ModelViewSet):
    """
    CRUD management for Farmer profiles and instant balance inquiries.
    Scoped strictly to the user's cooperative (NFR 1).
    """
    serializer_class = FarmerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Allow Coop Admin to see pending as well
        return scoped_queryset(self.request, Farmer).order_by("-created_at")

    @action(detail=True, methods=["post"], permission_classes=[IsCooperativeAdmin])
    def approve(self, request, pk=None):
        farmer = self.get_object()
        if farmer.status == ApplicationStatus.APPROVED:
            return Response({"detail": "Already approved."}, status=status.HTTP_400_BAD_REQUEST)
            
        farmer.status = ApplicationStatus.APPROVED
        farmer.approved = True
        farmer.save()
        
        if farmer.user:
            farmer.user.is_active = True
            farmer.user.save()
            
        return Response({"detail": "Farmer approved."})

    @action(detail=True, methods=["post"], permission_classes=[IsCooperativeAdmin])
    def decline(self, request, pk=None):
        farmer = self.get_object()
        farmer.status = ApplicationStatus.DECLINED
        farmer.save()
        
        if farmer.user:
            farmer.user.is_active = False
            farmer.user.save()
            
        return Response({"detail": "Farmer declined."})

    @action(detail=True, methods=["get"])
    def balance(self, request, pk=None):
        """
        Implements FR 1.2 (Historical Delivery Query over REST API):
        Returns the farmer's balance summary and last 3 deliveries.
        """
        farmer = self.get_object()
        return Response(farmer.query_balance())
