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
from .models import BatchTotal, CropDelivery, AdjustmentLog, DiscrepancyFlag, CropPrice
from .serializers import BatchTotalSerializer, CropDeliverySerializer, AdjustmentLogSerializer, DiscrepancyFlagSerializer, CropPriceSerializer


class CropPriceViewSet(viewsets.ModelViewSet):
    """
    Manages national standard crop prices per 1kg.
    Read access is available to all authenticated users.
    Create/Update/Delete operations are restricted exclusively to Super Admin (RCA).
    """
    queryset = CropPrice.objects.all().order_by("name")
    serializer_class = CropPriceSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        return [IsSuperAdminOrRCA()]

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=["post"], permission_classes=[IsSuperAdminOrRCA])
    def bulk_update(self, request):
        """
        Allows Super Admin to bulk update multiple crop prices per 1kg.
        Payload: {"prices": [{"id": "...", "price_per_kg": 650.0}, ...]}
        """
        prices = request.data.get("prices", [])
        if not isinstance(prices, list):
            return Response({"detail": "Expected 'prices' array in payload."}, status=status.HTTP_400_BAD_REQUEST)

        updated_items = []
        for item in prices:
            crop_id = item.get("id")
            crop_name = item.get("name")
            new_price = item.get("price_per_kg")

            if new_price is None:
                continue

            crop = None
            if crop_id:
                crop = CropPrice.objects.filter(id=crop_id).first()
            elif crop_name:
                crop = CropPrice.objects.filter(name__iexact=crop_name).first()

            if crop:
                crop.price_per_kg = new_price
                crop.updated_by = request.user
                crop.save()
                updated_items.append(crop)

        return Response(CropPriceSerializer(updated_items, many=True).data)


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
            return [IsAuthenticated()]  # Custom logic in perform_create limits to Farmer/Officer
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
        """Logs delivery. FARMER = PENDING. COLLECTION_OFFICER = APPROVED."""
        user = self.request.user
        farmer = serializer.validated_data["farmer"]
        
        if user.role == "FARMER":
            if farmer.user != user:
                raise DRFValidationError("Farmers can only log deliveries for themselves.")
            delivery = CropDelivery.objects.create(
                farmer=farmer,
                cooperative=farmer.cooperative,
                crop_type=serializer.validated_data["crop_type"],
                weight_kg=serializer.validated_data["weight_kg"],
                status=CropDelivery.Status.PENDING
            )
            serializer.instance = delivery
            
        elif user.role == "COLLECTION_OFFICER":
            delivery = CropDelivery.log_delivery(
                farmer=farmer,
                cooperative=farmer.cooperative,
                officer=user,
                crop_type=serializer.validated_data["crop_type"],
                weight_kg=serializer.validated_data["weight_kg"],
            )
            serializer.instance = delivery
        else:
            raise DRFValidationError("Only Farmers and Collection Officers can log deliveries.")

    @action(detail=True, methods=["post"], permission_classes=[IsCollectionOfficer])
    def approve(self, request, pk=None):
        delivery = self.get_object()
        if delivery.status != CropDelivery.Status.PENDING:
            raise DRFValidationError("Only PENDING deliveries can be approved.")
            
        from django.utils import timezone
        season_label = timezone.now().strftime("%Y-A")
        batch, _ = BatchTotal.objects.get_or_create(
            cooperative=delivery.cooperative,
            crop_type=delivery.crop_type,
            season_label=season_label,
            status=BatchTotal.Status.OPEN,
            defaults={"total_weight_kg": 0},
        )
        
        delivery.status = CropDelivery.Status.APPROVED
        delivery.officer = request.user
        delivery.batch = batch
        delivery.save()
        
        # Dispatch instant notification to farmer
        from apps.notifications.services import NotificationService
        NotificationService.dispatch_receipt(delivery)
        
        return Response(CropDeliverySerializer(delivery).data)

    @action(detail=True, methods=["post"], permission_classes=[IsCollectionOfficer])
    def decline(self, request, pk=None):
        delivery = self.get_object()
        if delivery.status != CropDelivery.Status.PENDING:
            raise DRFValidationError("Only PENDING deliveries can be declined.")
            
        delivery.status = CropDelivery.Status.DECLINED
        delivery.officer = request.user
        delivery.save()
        
        return Response(CropDeliverySerializer(delivery).data)


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
