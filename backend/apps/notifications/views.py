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
        if getattr(user, "role", "") == "FARMER":
            return Notification.objects.filter(farmer__user=user).order_by("-sent_at")
        return scoped_queryset(self.request, Notification, coop_field="farmer__cooperative").order_by("-sent_at")

    @action(detail=True, methods=["patch", "post"])
    def mark_read(self, request, pk=None):
        """Marks a notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read", "updated_at"])
        return Response(NotificationSerializer(notification).data)
