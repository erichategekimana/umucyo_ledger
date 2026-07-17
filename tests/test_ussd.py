"""
Tests for USSD Gateway Handler (*789# Africa's Talking Protocol & Sub-20s Timeout).
"""
from decimal import Decimal
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from apps.cooperatives.models import Cooperative, Farmer
from apps.harvest_ledger.models import CropDelivery

User = get_user_model()


class USSDGatewayTests(TestCase):
    """Verifies FR 1.x menu options and CON/END protocol responses."""

    def setUp(self):
        self.client = Client()
        self.coop = Cooperative.objects.create(name="Coop USSD", rca_registration_no="RCA/USSD/001", sector="Gisozi", district="Gasabo")
        self.officer = User.objects.create_user(username="off_u", password="pass", role="COLLECTION_OFFICER", phone_number="0788002000")
        self.user_farmer = User.objects.create_user(username="farmer_u", password="pass", role="FARMER", phone_number="0788002001", preferred_language="rw")
        self.farmer = Farmer.objects.create(
            user=self.user_farmer,
            cooperative=self.coop,
            national_id="301",
            full_name="Farmer USSD",
            phone_number="0788002001",
            district="Gasabo"
        )
        CropDelivery.log_delivery(self.farmer, self.coop, self.officer, "soya", Decimal("150.00"))

    def test_ussd_root_menu(self):
        """Verifies dialing *789# returns Kinyarwanda root menu starting with CON."""
        payload = {"sessionId": "SESS123", "phoneNumber": "0788002001", "text": ""}
        response = self.client.post("/ussd/callback/", payload)
        self.assertEqual(response.status_code, 200)
        content = response.content.decode("utf-8")
        self.assertTrue(content.startswith("CON"))
        self.assertIn("Murakaza neza kuri Umucyo Ledger", content)

    def test_ussd_option_1_recent_deliveries(self):
        """Verifies Option 1 returns recent deliveries terminating with END."""
        payload = {"sessionId": "SESS123", "phoneNumber": "0788002001", "text": "1"}
        response = self.client.post("/ussd/callback/", payload)
        self.assertEqual(response.status_code, 200)
        content = response.content.decode("utf-8")
        self.assertTrue(content.startswith("END"))
        self.assertIn("150.0kg", content)

    def test_ussd_option_2_season_balance(self):
        """Verifies Option 2 returns running season balance terminating with END."""
        payload = {"sessionId": "SESS123", "phoneNumber": "0788002001", "text": "2"}
        response = self.client.post("/ussd/callback/", payload)
        self.assertEqual(response.status_code, 200)
        content = response.content.decode("utf-8")
        self.assertTrue(content.startswith("END"))
        self.assertIn("150.0 kg", content)

    def test_ussd_unregistered_phone(self):
        """Verifies unregistered phone number receives immediate END error message."""
        payload = {"sessionId": "SESS123", "phoneNumber": "0788999999", "text": ""}
        response = self.client.post("/ussd/callback/", payload)
        self.assertEqual(response.status_code, 200)
        content = response.content.decode("utf-8")
        self.assertTrue(content.startswith("END"))
        self.assertIn("ntabwo yanditswe", content)
