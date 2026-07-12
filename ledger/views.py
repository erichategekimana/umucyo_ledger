from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import permissions as perms
from .models import (
    AnomalyReport, BatchTotal, BulkSale, Cooperative, CooperativeStaff,
    CropDelivery, DiscrepancyFlag, Farmer, Notification, Role,
)
from .serializers import (
    AnomalyReportSerializer, BatchTotalSerializer, BulkSaleSerializer,
    CooperativeSerializer, CooperativeStaffSerializer, CropDeliverySerializer,
    DiscrepancyFlagSerializer, FarmerSerializer, NotificationSerializer,
    RevenueDistributionSerializer,
)


def _scoped_qs(request, model, coop_field="cooperative"):
    """Every non-super-admin only ever sees their own cooperative's data."""
    qs = model.objects.all()
    user = request.user
    if user.is_superuser or user.role == Role.SUPER_ADMIN:
        return qs
    coop_id = getattr(getattr(user, "staff_profile", None), "cooperative_id", None)
    if coop_id is None:
        return qs.none()
    return qs.filter(**{coop_field: coop_id})


class CooperativeViewSet(viewsets.ModelViewSet):
    serializer_class = CooperativeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Cooperative.objects.all().order_by("name")

    @action(detail=True, methods=["get"], permission_classes=[perms.CanAudit])
    def audit_report(self, request, pk=None):
        coop = self.get_object()
        return Response(coop.generate_audit_report())


class CooperativeStaffViewSet(viewsets.ModelViewSet):
    serializer_class = CooperativeStaffSerializer
    permission_classes = [perms.CanManageStaff]

    def get_queryset(self):
        return _scoped_qs(self.request, CooperativeStaff)


class FarmerViewSet(viewsets.ModelViewSet):
    serializer_class = FarmerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _scoped_qs(self.request, Farmer).order_by("full_name")

    @action(detail=True, methods=["get"])
    def balance(self, request, pk=None):
        """FR 1.2 - Historical Delivery Query."""
        farmer = self.get_object()
        return Response(farmer.query_balance())


class BatchTotalViewSet(viewsets.ModelViewSet):
    serializer_class = BatchTotalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _scoped_qs(self.request, BatchTotal).order_by("-created_at")

    @action(detail=True, methods=["post"], permission_classes=[perms.CanRecordSales])
    def lock(self, request, pk=None):
        """FR 4.1 - lock batch, freezing the SUM before a sale is recorded."""
        batch = self.get_object()
        try:
            batch.lock_batch()
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message)
        return Response(BatchTotalSerializer(batch).data)

    @action(detail=True, methods=["post"], permission_classes=[perms.CanRecordSales])
    def flag_discrepancy(self, request, pk=None):
        """FR 4.2 - cross-check against an external buyer invoice weight."""
        batch = self.get_object()
        invoice_weight = request.data.get("invoice_weight_kg")
        if invoice_weight is None:
            raise DRFValidationError("invoice_weight_kg is required.")
        flagged = batch.flag_discrepancy(invoice_weight)
        return Response({"flagged": flagged})


class CropDeliveryViewSet(viewsets.ModelViewSet):
    """
    FR 2.0/2.1/2.2 - Field Weight Capture & Validation.
    Deliveries are append-only: update/destroy are disabled at the model
    layer, and this viewset only exposes create/list/retrieve.
    """

    serializer_class = CropDeliverySerializer
    permission_classes = [perms.CanLogDeliveries]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return _scoped_qs(self.request, CropDelivery).order_by("-dropoff_time")

    def perform_create(self, serializer):
        # Uses the model classmethod so batch aggregation + SMS receipt fire (FR 3.1/4.1).
        farmer = serializer.validated_data["farmer"]
        delivery = CropDelivery.log_delivery(
            farmer=farmer,
            cooperative=farmer.cooperative,
            officer=self.request.user,
            crop_type=serializer.validated_data["crop_type"],
            weight_kg=serializer.validated_data["weight_kg"],
        )
        serializer.instance = delivery


class BulkSaleViewSet(viewsets.ModelViewSet):
    serializer_class = BulkSaleSerializer
    permission_classes = [perms.CanRecordSales]

    def get_queryset(self):
        return _scoped_qs(self.request, BulkSale, coop_field="batch__cooperative").order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        """FR 5.2 - Inventory Deduction Mapping, on confirmation of bank transfer."""
        sale = self.get_object()
        sale.verified = True
        sale.bank_transfer_ref = request.data.get("bank_transfer_ref", sale.bank_transfer_ref)
        sale.save(update_fields=["verified", "bank_transfer_ref"])
        return Response(BulkSaleSerializer(sale).data)

    @action(detail=True, methods=["post"])
    def calculate_split(self, request, pk=None):
        """FR 6.1/6.2 - Algorithmic Revenue Distribution."""
        sale = self.get_object()
        try:
            splits = sale.calculate_revenue_split()
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message)
        return Response(RevenueDistributionSerializer(splits, many=True).data)


class DiscrepancyFlagViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DiscrepancyFlagSerializer
    permission_classes = [perms.CanAudit]
    queryset = DiscrepancyFlag.objects.all().order_by("-created_at")


class AnomalyReportViewSet(viewsets.ModelViewSet):
    """FR 7.0/7.1/7.2 - Agronomic & Veterinary Mapping."""

    serializer_class = AnomalyReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in (Role.SUPER_ADMIN, Role.VETERINARIAN, Role.ADMIN):
            return AnomalyReport.objects.all().order_by("-reported_at")
        return _scoped_qs(self.request, AnomalyReport).order_by("-reported_at")

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Notification.objects.all().order_by("-sent_at")


class DashboardSummaryView(APIView):
    """Rollup numbers for the React manager dashboard (NFR 2 - fast summary load)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs_batches = _scoped_qs(request, BatchTotal)
        qs_deliveries = _scoped_qs(request, CropDelivery)
        qs_farmers = _scoped_qs(request, Farmer)
        qs_anomalies = AnomalyReport.objects.all() if (request.user.is_superuser or request.user.role in (Role.SUPER_ADMIN, Role.VETERINARIAN)) else _scoped_qs(request, AnomalyReport)

        return Response({
            "total_farmers": qs_farmers.count(),
            "total_deliveries": qs_deliveries.count(),
            "total_weight_kg": float(qs_deliveries.aggregate(t=Sum("weight_kg"))["t"] or 0),
            "open_batches": qs_batches.filter(status=BatchTotal.Status.OPEN).count(),
            "locked_batches": qs_batches.filter(status=BatchTotal.Status.LOCKED).count(),
            "sold_batches": qs_batches.filter(status=BatchTotal.Status.SOLD).count(),
            "unresolved_anomalies": qs_anomalies.filter(resolved=False).count(),
        })
