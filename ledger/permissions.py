"""
NFR 1 - Role-Based Access Separation.
A Collection Officer can never view financial profit boards; a Cooperative
Manager cannot alter raw crop drop-off inputs (deliveries are append-only
anyway, but write access is further restricted by role here).
"""
from rest_framework.permissions import BasePermission

from .models import Role


class IsRole(BasePermission):
    allowed_roles = ()

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role in self.allowed_roles or request.user.is_superuser)
        )


def role_permission(*roles):
    return type("RolePermission", (IsRole,), {"allowed_roles": roles})


CanLogDeliveries = role_permission(Role.COLLECTION_OFFICER, Role.ADMIN, Role.SUPER_ADMIN)
CanViewFinancials = role_permission(Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
CanRecordSales = role_permission(Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
CanManageStaff = role_permission(Role.ADMIN, Role.SUPER_ADMIN)
CanViewHealthData = role_permission(Role.VETERINARIAN, Role.ADMIN, Role.SUPER_ADMIN)
CanAudit = role_permission(Role.SUPER_ADMIN)
