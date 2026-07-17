"""
Sales & Revenue Distribution Domain Views & Controllers.
"""
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from common.permissions import IsCooperativeManager, CanAuditOrRead, scoped_queryset
from apps.cooperatives.models import Cooperative
from apps.harvest_ledger.models import CropDelivery
from .models import BulkSale, RevenueDistribution
from .serializers import BulkSaleSerializer, RevenueDistributionSerializer


class BulkSaleViewSet(viewsets.ModelViewSet):
    """
    CRUD management and actions for BulkSales (`/api/v1/sales/`).
    Implements FR 5.2 (`/verify/`) and FR 6.1 (`/calculate_split/`).
    """
    serializer_class = BulkSaleSerializer
    permission_classes = [IsCooperativeManager]

    def get_queryset(self):
        return scoped_queryset(self.request, BulkSale, coop_field="batch__cooperative").order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsCooperativeManager])
    def verify(self, request, pk=None):
        """
        Implements FR 5.2 (Inventory Deduction Mapping):
        Verifies the sale upon confirmation of bank transfer logs (`bank_transfer_ref`).
        """
        sale = self.get_object()
        ref = request.data.get("bank_transfer_ref", sale.bank_transfer_ref)
        if not ref:
            raise DRFValidationError("bank_transfer_ref is required to verify a sale.")
        sale.verified = True
        sale.bank_transfer_ref = ref
        sale.save(update_fields=["verified", "bank_transfer_ref", "updated_at"])
        return Response(BulkSaleSerializer(sale).data)

    @action(detail=True, methods=["post"], permission_classes=[IsCooperativeManager])
    def calculate_split(self, request, pk=None):
        """
        Implements FR 6.1 (Algorithmic Revenue Allocation):
        Computes share percentage and payout in RWF across all contributing farmers.
        Wrapped atomically inside `calculate_revenue_split()`.
        """
        sale = self.get_object()
        try:
            splits = sale.calculate_revenue_split()
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message)
        return Response(RevenueDistributionSerializer(splits, many=True).data)


class RevenueDistributionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for auditing individual payout lines (`/api/v1/payouts/`).
    """
    serializer_class = RevenueDistributionSerializer
    permission_classes = [CanAuditOrRead]

    def get_queryset(self):
        return scoped_queryset(self.request, RevenueDistribution, coop_field="sale__batch__cooperative").order_by("-payout_rwf")


class AuditReportView(APIView):
    """
    Implements FR 6.2 (Ledger Audit Trail Export):
    Generates cryptographic financial distribution files mapping every RWF calculation step
    and aggregate weight figure for regulatory submission to the RCA.
    """
    permission_classes = [CanAuditOrRead]

    def get(self, request, coop_id):
        try:
            coop = Cooperative.objects.get(pk=coop_id)
        except Cooperative.DoesNotExist:
            return Response({"error": "Cooperative not found"}, status=status.HTTP_404_NOT_FOUND)

        deliveries = CropDelivery.objects.filter(cooperative=coop)
        sales = BulkSale.objects.filter(batch__cooperative=coop)
        distributions = RevenueDistribution.objects.filter(sale__batch__cooperative=coop)

        total_weight_kg = float(deliveries.aggregate(t=models.Sum("weight_kg"))["t"] or 0)
        total_sales_rwf = float(sales.aggregate(t=models.Sum("sale_price_rwf"))["t"] or 0)
        total_payout_rwf = float(distributions.aggregate(t=models.Sum("payout_rwf"))["t"] or 0)

        report = {
            "cooperative_name": coop.name,
            "rca_registration_no": coop.rca_registration_no,
            "district": coop.district,
            "sector": coop.sector,
            "audit_generated_at": timezone.now().isoformat(),
            "summary_metrics": {
                "total_deliveries_logged": deliveries.count(),
                "total_weight_kg": total_weight_kg,
                "total_bulk_sales": sales.count(),
                "total_sales_revenue_rwf": total_sales_rwf,
                "total_distributed_payout_rwf": total_payout_rwf,
            },
            "recent_sales_and_splits": [
                {
                    "sale_id": str(s.id),
                    "batch": f"{s.batch.crop_type} ({s.batch.season_label})",
                    "buyer_name": s.buyer_name,
                    "sale_price_rwf": float(s.sale_price_rwf),
                    "verified": s.verified,
                    "bank_transfer_ref": s.bank_transfer_ref,
                    "payouts_count": s.distributions.count(),
                }
                for s in sales.order_by("-created_at")[:10]
            ],
        }
        return Response(report)
