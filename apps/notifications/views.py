"""
Notifications Domain Views & Controllers.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from common.permissions import CanAuditOrRead, scoped_queryset
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for auditing dispatched SMS receipts (`/api/v1/notifications/`).
    Scoped by cooperative membership.
    """
    serializer_class = NotificationSerializer
    permission_classes = [CanAuditOrRead]

    def get_queryset(self):
        return scoped_queryset(self.request, Notification, coop_field="farmer__cooperative").order_by("-sent_at")
