"""
Harvest Ledger Domain Views & Controllers.
"""
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from common.permissions import IsCollectionOfficer, IsCooperativeManager, IsSuperAdminOrRCA, IsCooperativeAdmin, scoped_queryset
from .models import BatchTotal, CropDelivery, AdjustmentLog, DiscrepancyFlag
from .serializers import BatchTotalSerializer, CropDeliverySerializer, AdjustmentLogSerializer, DiscrepancyFlagSerializer


class BatchTotalViewSet(viewsets.ModelViewSet):
    """
    CRUD and actions for BatchTotals (`/api/v1/batches/`).
    Implements FR 4.1 (`/lock/` action) and FR 4.2 (`/flag_discrepancy/` action).
    """
    serializer_class = BatchTotalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return scoped_queryset(self.request, BatchTotal).order_by("-created_at")

    @action(detail=True, methods=["post"], permission_classes=[IsCooperativeManager])
    def lock(self, request, pk=None):
        """
        Implements FR 4.1 (Mathematical Lock Calculation):
        Freezes the batch (`status = LOCKED`), locking its bottom-up weight before a sale.
        """
        batch = self.get_object()
        try:
            batch.lock_batch()
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message)
        return Response(BatchTotalSerializer(batch).data)

    @action(detail=True, methods=["post"], permission_classes=[IsCooperativeManager])
    def flag_discrepancy(self, request, pk=None):
        """
        Implements FR 4.2 (Discrepancy Flagging):
        Cross-checks ledger weight against external buyer invoice (`invoice_weight_kg`).
        """
        batch = self.get_object()
        invoice_weight = request.data.get("invoice_weight_kg")
        if invoice_weight is None:
            raise DRFValidationError("invoice_weight_kg parameter is required.")
        try:
            invoice_weight = float(invoice_weight)
        except ValueError:
            raise DRFValidationError("invoice_weight_kg must be a valid number.")

        flagged = batch.flag_discrepancy(invoice_weight)
        return Response({"flagged": flagged, "ledger_weight_kg": float(batch.total_weight_kg), "invoice_weight_kg": invoice_weight})


class CropDeliveryViewSet(viewsets.ModelViewSet):
    """
    Implements FR 2.0 / FR 2.1 / FR 2.2 (Field Weight Capture & Validation).
    Append-Only controller: restricts HTTP methods strictly to `create`, `list`, and `retrieve`.
    Any attempt to update (`PUT`/`PATCH`) or destroy (`DELETE`) is rejected both at the router
    level and model layer.
    """
    serializer_class = CropDeliverySerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [IsCollectionOfficer()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return CropDelivery.objects.none()

        if getattr(user, "role", "") == "FARMER":
            return CropDelivery.objects.filter(farmer__user=user).order_by("-dropoff_time")

        scoped_qs = scoped_queryset(self.request, CropDelivery).order_by("-dropoff_time")
        farmer_id = self.request.query_params.get("farmer")
        if farmer_id:
            scoped_qs = scoped_qs.filter(farmer_id=farmer_id)
        return scoped_qs

    def perform_create(self, serializer):
        """Logs delivery using model classmethod to trigger bottom-up aggregation and SMS receipt."""
        farmer = serializer.validated_data["farmer"]
        delivery = CropDelivery.log_delivery(
            farmer=farmer,
            cooperative=farmer.cooperative,
            officer=self.request.user,
            crop_type=serializer.validated_data["crop_type"],
            weight_kg=serializer.validated_data["weight_kg"],
        )
        serializer.instance = delivery


class AdjustmentLogViewSet(viewsets.ModelViewSet):
    """
    Allows formal administrative adjustments (`/api/v1/adjustments/`).
    Restricted to Cooperative Admins and Super-Admins.
    """
    serializer_class = AdjustmentLogSerializer
    permission_classes = [IsCooperativeAdmin]

    def get_queryset(self):
        return scoped_queryset(self.request, AdjustmentLog, coop_field="original_delivery__cooperative").order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(approved_by=self.request.user)


class DiscrepancyFlagViewSet(viewsets.ModelViewSet):
    """
    Exposes discrepancy alerts for Super-Admin / RCA investigation (`/api/v1/discrepancies/`).
    """
    serializer_class = DiscrepancyFlagSerializer
    permission_classes = [IsSuperAdminOrRCA]

    def get_queryset(self):
        return DiscrepancyFlag.objects.all().order_by("-created_at")

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        """Marks a discrepancy as resolved after administrative audit."""
        flag = self.get_object()
        flag.resolved = True
        flag.save(update_fields=["resolved", "updated_at"])
        return Response(DiscrepancyFlagSerializer(flag).data)
