"""
Umucyo Ledger - Role-Based Access Control (RBAC) Permissions & Scope Filters.

Enforces NFR 1 (Role-Based Access Separation):
'The application shall strictly restrict route entry based on permissions. A Collection Officer
can never view financial profit boards, and a Cooperative Manager cannot alter raw crop drop-off inputs.'
"""
from rest_framework.permissions import BasePermission


def get_user_role(user):
    """Safely retrieves the string role representation of an authenticated user."""
    if not user or not user.is_authenticated:
        return None
    return getattr(user, "role", None)


def scoped_queryset(request, model, coop_field="cooperative"):
    """
    Multi-tenant cooperative scope filter.
    Enforces data isolation across cooperatives:
    - Super-Admins (RCA regulators) and Django superusers see across all cooperatives.
    - Cooperative Staff (Admins, Managers, Officers, Vets) only ever query/modify data
      strictly belonging to their assigned `CooperativeStaff.cooperative`.
    """
    qs = model.objects.all()
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return qs.none()

    if user.is_superuser or get_user_role(user) == "SUPER_ADMIN":
        return qs

    # Retrieve the staff profile's cooperative_id safely
    staff_profile = getattr(user, "staff_profile", None)
    if not staff_profile or not getattr(staff_profile, "cooperative_id", None):
        # Check if the user is linked via a farmer profile
        farmer_profile = getattr(user, "farmer_profile", None)
        if farmer_profile and getattr(farmer_profile, "cooperative_id", None):
            return qs.filter(**{coop_field: farmer_profile.cooperative_id})
        return qs.none()

    return qs.filter(**{coop_field: staff_profile.cooperative_id})


class IsSuperAdminOrRCA(BasePermission):
    """
    Grants access exclusively to Super-Admins (RCA Regulators) and Django superusers.
    Used for national oversight, external invoice discrepancy resolution, and cross-cooperative audits.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (
                user.is_superuser or get_user_role(user) == "SUPER_ADMIN"
            )
        )


class IsCooperativeAdmin(BasePermission):
    """
    Grants access to Cooperative Admins (and Super-Admins).
    Permitted to manage cooperative staff onboarding, assign roles, and configure cooperative health metrics.
    """

    def has_permission(self, request, view):
        user = request.user
        role = get_user_role(user)
        return bool(
            user and user.is_authenticated and (
                user.is_superuser or role in ("SUPER_ADMIN", "ADMIN")
            )
        )


class IsCooperativeManager(BasePermission):
    """
    Grants access to Cooperative Managers / Accountants (and Super-Admins).
    Permitted to lock harvest batches, log bulk market sales, verify bank transfers,
    and trigger algorithmic revenue split calculations (FR 5.x, FR 6.x).
    """

    def has_permission(self, request, view):
        user = request.user
        role = get_user_role(user)
        return bool(
            user and user.is_authenticated and (
                user.is_superuser or role in ("SUPER_ADMIN", "MANAGER")
            )
        )


class IsCollectionOfficer(BasePermission):
    """
    Grants access to Cooperative Collection Officers operating in the field.
    Permitted strictly to ingest incoming farmer crop delivery weights (FR 2.1).
    Restricted from accessing financial summaries or administrative settings (NFR 1).
    """

    def has_permission(self, request, view):
        user = request.user
        role = get_user_role(user)
        return bool(
            user and user.is_authenticated and (
                user.is_superuser or role == "COLLECTION_OFFICER"
            )
        )


class IsVeterinarianOrExtensionOfficer(BasePermission):
    """
    Grants access to regional Veterinarians / Agronomic Extension Officers (and Admins/Super-Admins).
    Permitted to query and report localized agronomic/livestock health anomalies and GIS heatmaps (FR 7.x).
    """

    def has_permission(self, request, view):
        user = request.user
        role = get_user_role(user)
        return bool(
            user and user.is_authenticated and (
                user.is_superuser or role in ("SUPER_ADMIN", "VETERINARIAN", "ADMIN")
            )
        )


class CanAuditOrRead(BasePermission):
    """
    Read-only permission for RCA Regulators, Admins, and Managers auditing cooperative records.
    """

    def has_permission(self, request, view):
        user = request.user
        role = get_user_role(user)
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return bool(
                user and user.is_authenticated and (
                    user.is_superuser or role in ("SUPER_ADMIN", "ADMIN", "MANAGER", "VETERINARIAN")
                )
            )
        return bool(user and user.is_authenticated and (user.is_superuser or role == "SUPER_ADMIN"))
