from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ussd_callback, USSDLogViewSet

router = DefaultRouter()
router.register(r'logs', USSDLogViewSet, basename='ussdlog')

urlpatterns = [
    path('callback/', ussd_callback, name='ussd_callback'),
    path('', include(router.urls)),
]