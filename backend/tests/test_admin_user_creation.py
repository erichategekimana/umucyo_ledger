from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

User = get_user_model()


class AdminUserCreationTests(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="securepass123",
            role="SUPER_ADMIN",
            phone_number="0788000001",
        )
        self.client.force_login(self.admin_user)

    def test_admin_can_create_new_user(self):
        response = self.client.post(
            reverse("admin:accounts_user_add"),
            {
                "username": "newofficer",
                "email": "officer@example.com",
                "phone_number": "0788000002",
                "role": "COLLECTION_OFFICER",
                "preferred_language": "en",
                "password1": "StrongP@ssw0rd",
                "password2": "StrongP@ssw0rd",
                "is_active": "on",
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        created_user = User.objects.get(username="newofficer")
        self.assertEqual(created_user.role, "COLLECTION_OFFICER")
        self.assertEqual(created_user.phone_number, "0788000002")
        self.assertTrue(created_user.check_password("StrongP@ssw0rd"))
