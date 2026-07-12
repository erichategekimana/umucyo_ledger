from django.urls import path

from . import views

urlpatterns = [
    path("callback/", views.ussd_callback, name="ussd-callback"),
    path("simulator/", views.ussd_simulator_page, name="ussd-simulator"),
]
