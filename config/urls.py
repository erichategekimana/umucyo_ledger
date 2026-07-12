from pathlib import Path

from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path

BASE_DIR = Path(__file__).resolve().parent.parent


def dashboard_view(request):
    """
    Served as a raw file (not through the Django template engine) because the
    page is a no-build React/JSX app: JSX's double-brace inline styles
    (style={{...}}) collide with Django's {{ }} template variable syntax.
    """
    html_path = BASE_DIR / "templates" / "dashboard" / "index.html"
    return HttpResponse(html_path.read_text(), content_type="text/html")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("ledger.urls")),
    path("ussd/", include("ussd_gateway.urls")),
    path("", dashboard_view, name="dashboard"),
]
