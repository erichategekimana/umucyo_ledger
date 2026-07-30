"""
Accounts Domain URL Router.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, RegisterViewSet, UserViewSet, VeterinarianApplicationViewSet

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"veterinarian-applications", VeterinarianApplicationViewSet, basename="veterinarian-application")

urlpatterns = [
    path("auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register/", RegisterViewSet.as_view({"post": "create"}), name="register"),
    path("", include(router.urls)),
]
