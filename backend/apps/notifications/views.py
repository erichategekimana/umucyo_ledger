"""
Notifications Domain Views & Controllers.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from common.permissions import CanAuditOrRead, scoped_queryset
from .models import Notification
from .serializers import NotificationSerializer


from rest_framework.decorators import action
from rest_framework.response import Response

class NotificationViewSet(viewsets.ModelViewSet):
    """
    Viewset for auditing dispatched SMS receipts (`/api/v1/notifications/`).
    Allows users to query notifications and toggle read/unread status.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Notification.objects.none()
            
        from django.db.models import Q
        
        if getattr(user, "role", "") == "FARMER":
            queryset = Notification.objects.filter(Q(farmer__user=user) | Q(user=user))
        elif getattr(user, "role", "") == "SUPER_ADMIN":
            queryset = Notification.objects.filter(user=user)
        else:
            coop_id = None
            if hasattr(user, "staff_profile"):
                coop_id = getattr(user.staff_profile, "cooperative_id", None)
            
            if coop_id:
                queryset = Notification.objects.filter(Q(user=user) | Q(farmer__cooperative_id=coop_id))
            else:
                queryset = Notification.objects.filter(user=user)
            
        is_read = self.request.query_params.get("is_read")
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == "true")
            
        sent_at_gte = self.request.query_params.get("sent_at__gte")
        if sent_at_gte:
            queryset = queryset.filter(sent_at__gte=sent_at_gte)
            
        sent_at_lte = self.request.query_params.get("sent_at__lte")
        if sent_at_lte:
            queryset = queryset.filter(sent_at__lte=sent_at_lte)
            
        farmer = self.request.query_params.get("farmer")
        if farmer:
            queryset = queryset.filter(farmer_id=farmer)
            
        return queryset.order_by("-sent_at")

    @action(detail=True, methods=["patch", "post"])
    def mark_read(self, request, pk=None):
        """Marks a notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read", "updated_at"])
        return Response(NotificationSerializer(notification).data)
