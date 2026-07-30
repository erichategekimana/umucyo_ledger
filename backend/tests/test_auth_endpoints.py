from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

User = get_user_model()


class AuthRegistrationTests(TestCase):
    def test_public_signup_creates_user(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "newfarmer",
                "email": "farmer@example.com",
                "phone_number": "0788000003",
                "password": "StrongP@ssw0rd",
                "role": "FARMER",
                "preferred_language": "en",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(username="newfarmer").exists())
        created_user = User.objects.get(username="newfarmer")
        self.assertEqual(created_user.role, "FARMER")
        self.assertEqual(created_user.phone_number, "0788000003")
