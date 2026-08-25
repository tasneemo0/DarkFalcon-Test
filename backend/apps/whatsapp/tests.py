from django.test import TestCase
from .utils import normalize_whatsapp_phone

class WhatsAppNormalizationTests(TestCase):
    def test_colombia_normalization(self):
        self.assertEqual(normalize_whatsapp_phone("57050184847469@s.whatsapp.net"), "5730184847469")
        self.assertEqual(normalize_whatsapp_phone("57050184847469"), "5730184847469")
        self.assertEqual(normalize_whatsapp_phone("+57050184847469"), "5730184847469")

    def test_mexico_normalization(self):
        self.assertEqual(normalize_whatsapp_phone("5215512345678@s.whatsapp.net"), "525512345678")
        self.assertEqual(normalize_whatsapp_phone("5215512345678"), "525512345678")

    def test_argentina_normalization(self):
        self.assertEqual(normalize_whatsapp_phone("5491123456789@s.whatsapp.net"), "541123456789")
        self.assertEqual(normalize_whatsapp_phone("5491123456789"), "541123456789")

    def test_other_countries_and_edge_cases(self):
        self.assertEqual(normalize_whatsapp_phone("9647873199794@s.whatsapp.net"), "9647873199794")
        self.assertEqual(normalize_whatsapp_phone("009647873199794"), "9647873199794")
        self.assertEqual(normalize_whatsapp_phone(""), "")
        self.assertEqual(normalize_whatsapp_phone(None), "")

    def test_local_number_with_instance(self):
        class MockInstance:
            def __init__(self, phone):
                self.phone_number = phone

        # Instance from Iraq (964)
        instance_iq = MockInstance("9647873199794")
        self.assertEqual(normalize_whatsapp_phone("07873199794", instance=instance_iq), "9647873199794")
        
        # Instance from Egypt (20)
        instance_eg = MockInstance("201234567890")
        self.assertEqual(normalize_whatsapp_phone("01234567890", instance=instance_eg), "201234567890")
        
        # Format without leading 0 should not be changed by instance
        self.assertEqual(normalize_whatsapp_phone("7873199794", instance=instance_iq), "7873199794")


