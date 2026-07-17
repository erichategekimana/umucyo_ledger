"""
Tests for Role-Based Access Control and Cooperative Isolation (NFR 1).
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from apps.cooperatives.models import Cooperative, CooperativeStaff

User = get_user_model()


class PermissionAndScopingTests(TestCase):
    """Verifies strict access control across API routes."""

    def setUp(self):
        self.client = Client()
        self.coop1 = Cooperative.objects.create(name="Coop Alpha", rca_registration_no="RCA/001", sector="S1", district="D1")
        self.coop2 = Cooperative.objects.create(name="Coop Beta", rca_registration_no="RCA/002", sector="S2", district="D2")

        self.officer1 = User.objects.create_user(username="off1", password="password", role="COLLECTION_OFFICER", phone_number="0788001001")
        CooperativeStaff.objects.create(user=self.officer1, cooperative=self.coop1)

        self.manager1 = User.objects.create_user(username="man1", password="password", role="MANAGER", phone_number="0788001002")
        CooperativeStaff.objects.create(user=self.manager1, cooperative=self.coop1)

        self.super_admin = User.objects.create_superuser(username="rca_admin", password="password", role="SUPER_ADMIN", phone_number="0788001003")

    def test_collection_officer_cannot_access_sales_endpoint(self):
        """Verifies Collection Officer gets 403 Forbidden when trying to access financial endpoints."""
        self.client.force_login(self.officer1)
        response = self.client.get("/api/v1/sales/")
        self.assertEqual(response.status_code, 403)

    def test_manager_can_access_sales_endpoint(self):
        """Verifies Manager can access financial sales endpoints."""
        self.client.force_login(self.manager1)
        response = self.client.get("/api/v1/sales/")
        self.assertEqual(response.status_code, 200)

    def test_cooperative_scoping_isolation(self):
        """Verifies CooperativeStaff only see data belonging to their assigned cooperative."""
        self.client.force_login(self.manager1)
        response = self.client.get("/api/v1/cooperatives/")
        data = response.json()
        if isinstance(data, dict) and "results" in data:
            results = data["results"]
        else:
            results = data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Coop Alpha")

    def test_super_admin_sees_all_cooperatives(self):
        """Verifies Super Admin sees across all cooperatives."""
        self.client.force_login(self.super_admin)
        response = self.client.get("/api/v1/cooperatives/")
        data = response.json()
        if isinstance(data, dict) and "results" in data:
            results = data["results"]
        else:
            results = data
        self.assertEqual(len(results), 2)
