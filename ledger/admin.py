from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import (
    AdjustmentLog, AnomalyReport, BatchTotal, BulkSale, Cooperative,
    CooperativeStaff, CropDelivery, DiscrepancyFlag, Farmer, Notification,
    RevenueDistribution, User,
)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "phone_number", "role", "is_active")
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Umucyo Ledger", {"fields": ("phone_number", "role", "preferred_language")}),
    )


@admin.register(Cooperative)
class CooperativeAdmin(admin.ModelAdmin):
    list_display = ("name", "rca_registration_no", "sector", "district")
    search_fields = ("name", "rca_registration_no")


@admin.register(CooperativeStaff)
class CooperativeStaffAdmin(admin.ModelAdmin):
    list_display = ("user", "cooperative", "is_active")


@admin.register(Farmer)
class FarmerAdmin(admin.ModelAdmin):
    list_display = ("full_name", "national_id", "cooperative", "phone_number")
    search_fields = ("full_name", "national_id", "phone_number")


@admin.register(BatchTotal)
class BatchTotalAdmin(admin.ModelAdmin):
    list_display = ("cooperative", "crop_type", "season_label", "total_weight_kg", "status")
    list_filter = ("status", "crop_type")


@admin.register(CropDelivery)
class CropDeliveryAdmin(admin.ModelAdmin):
    list_display = ("farmer", "cooperative", "crop_type", "weight_kg", "dropoff_time")
    readonly_fields = [f.name for f in CropDelivery._meta.fields]

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(AdjustmentLog)
class AdjustmentLogAdmin(admin.ModelAdmin):
    list_display = ("original_delivery", "corrected_weight_kg", "approved_by", "created_at")


@admin.register(BulkSale)
class BulkSaleAdmin(admin.ModelAdmin):
    list_display = ("batch", "buyer_name", "sale_price_rwf", "verified")


@admin.register(RevenueDistribution)
class RevenueDistributionAdmin(admin.ModelAdmin):
    list_display = ("sale", "farmer", "contribution_kg", "share_percentage", "payout_rwf")


@admin.register(DiscrepancyFlag)
class DiscrepancyFlagAdmin(admin.ModelAdmin):
    list_display = ("batch", "invoice_weight_kg", "ledger_weight_kg", "drift_kg", "resolved")


@admin.register(AnomalyReport)
class AnomalyReportAdmin(admin.ModelAdmin):
    list_display = ("category", "sector", "severity", "cooperative", "resolved", "reported_at")
    list_filter = ("severity", "resolved")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("farmer", "sent_at")
    readonly_fields = [f.name for f in Notification._meta.fields]
