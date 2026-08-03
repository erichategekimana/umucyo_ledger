from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, Role
from apps.cooperatives.models import Cooperative, CooperativeStaff, Farmer

class UserPermissionsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create Cooperative 1 & Cooperative 2
        self.coop1 = Cooperative.objects.create(name="Coop Alpha", rca_registration_no="RCA-001", sector="Gasabo", district="Kigali")
        self.coop2 = Cooperative.objects.create(name="Coop Beta", rca_registration_no="RCA-002", sector="Huye", district="Southern")

        # Create Coop 1 Admin
        self.admin_coop1 = User.objects.create_user(
            username="admin_alpha",
            email="admin1@coop.rw",
            phone_number="+250788000001",
            role=Role.ADMIN,
            password="Password123!"
        )
        CooperativeStaff.objects.create(user=self.admin_coop1, cooperative=self.coop1, is_active=True)

        # Create Coop 1 Collection Officer
        self.officer_coop1 = User.objects.create_user(
            username="officer_alpha",
            email="officer1@coop.rw",
            phone_number="+250788000002",
            role=Role.COLLECTION_OFFICER,
            password="Password123!"
        )
        CooperativeStaff.objects.create(user=self.officer_coop1, cooperative=self.coop1, is_active=True)

        # Create Coop 2 Collection Officer
        self.officer_coop2 = User.objects.create_user(
            username="officer_beta",
            email="officer2@coop.rw",
            phone_number="+250788000003",
            role=Role.COLLECTION_OFFICER,
            password="Password123!"
        )
        CooperativeStaff.objects.create(user=self.officer_coop2, cooperative=self.coop2, is_active=True)

        # Create Super Admin
        self.super_admin = User.objects.create_user(
            username="super_admin",
            email="superadmin@rca.gov.rw",
            phone_number="+250788999999",
            role=Role.SUPER_ADMIN,
            is_superuser=True,
            password="Password123!"
        )

    def test_coop_admin_user_scoping(self):
        # Authenticate as Coop 1 Admin
        self.client.force_authenticate(user=self.admin_coop1)
        response = self.client.get("/api/v1/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Admin 1 should see admin_coop1 and officer_coop1, but NOT officer_coop2
        usernames = [u["username"] for u in response.data["results"]]
        self.assertIn("officer_alpha", usernames)
        self.assertNotIn("officer_beta", usernames)

    def test_coop_admin_can_change_status_of_coop_officer(self):
        self.client.force_authenticate(user=self.admin_coop1)
        response = self.client.post(
            f"/api/v1/users/{self.officer_coop1.id}/change_status/",
            {"is_active": False},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.officer_coop1.refresh_from_db()
        self.assertFalse(self.officer_coop1.is_active)

    def test_coop_admin_cannot_change_status_of_admin_or_super_admin(self):
        self.client.force_authenticate(user=self.admin_coop1)
        
        # Attempt to deactivate self or another Admin
        response = self.client.post(
            f"/api/v1/users/{self.admin_coop1.id}/change_status/",
            {"is_active": False},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Attempt to change role of another user to ADMIN
        response = self.client.post(
            f"/api/v1/users/{self.officer_coop1.id}/change_role/",
            {"role": Role.ADMIN},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_super_admin_can_modify_any_user(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.post(
            f"/api/v1/users/{self.admin_coop1.id}/change_status/",
            {"is_active": False},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.admin_coop1.refresh_from_db()
        self.assertFalse(self.admin_coop1.is_active)
