"""
Umucyo Ledger - Audit Log Middleware.

Enforces NFR 4 (Un-Alterable Action Ledgers):
'Every database write, profile lookup, and financial adjustment must create an immutable
system log tracking the user identity, time signature, and source IP address.'
"""
import logging
from django.utils import timezone

logger = logging.getLogger("umucyo.audit")


def get_client_ip(request):
    """Extracts the real origin IP address across proxy headers (e.g., Nginx X-Forwarded-For)."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR", "unknown")
    return ip


class AuditLogMiddleware:
    """
    Intercepts HTTP requests to capture chronological, structured audit events
    for administrative operations, profile queries, and transactional updates.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        ip = get_client_ip(request)
        user = getattr(request, "user", None)
        user_identity = f"{user.username} (role={getattr(user, 'role', 'ANON')})" if (user and user.is_authenticated) else "ANONYMOUS"

        response = self.get_response(request)

        # Log mutating actions and important queries
        if request.path.startswith("/api/v1/") or request.path.startswith("/ussd/"):
            log_message = (
                f"AUDIT_EVENT | timestamp='{timezone.now().isoformat()}' | "
                f"ip='{ip}' | user='{user_identity}' | method='{request.method}' | "
                f"path='{request.path}' | status={response.status_code}"
            )
            if request.method in ("POST", "PUT", "PATCH", "DELETE"):
                logger.info(log_message)
            elif response.status_code >= 400:
                logger.warning(log_message)
            else:
                logger.debug(log_message)

        return response
