"""
Agronomy & Veterinary Monitoring Domain Views & Controllers.
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from common.permissions import IsVeterinarianOrExtensionOfficer, scoped_queryset
from .models import AnomalyReport
from .serializers import AnomalyReportSerializer


class AnomalyReportViewSet(viewsets.ModelViewSet):
    """
    CRUD controller for Agronomic & Veterinary Anomaly Reports (`/api/v1/anomalies/`).
    Implements FR 7.1 (Anomaly Flagging Input) and FR 7.2 (GIS Heatmap dataset).
    """
    serializer_class = AnomalyReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Regulators and Veterinarians have global visibility across cooperatives
        if user.is_superuser or getattr(user, "role", "") in ("SUPER_ADMIN", "VETERINARIAN", "ADMIN"):
            return AnomalyReport.objects.all().order_by("-created_at")
        return scoped_queryset(self.request, AnomalyReport).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsVeterinarianOrExtensionOfficer])
    def resolve(self, request, pk=None):
        """Allows extension officers/veterinarians to mark an anomaly as resolved."""
        report = self.get_object()
        report.resolved = True
        report.save(update_fields=["resolved", "updated_at"])
        return Response(AnomalyReportSerializer(report).data)
