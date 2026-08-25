from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.accounts.models import Profile, PhoneOTP, SessionLog

User = get_user_model()

class AccountCenterAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='test@example.com', password='testpassword123')
        self.user.profile.full_name = "Test User"
        self.user.profile.phone_number = "1234567890"
        self.user.profile.save()
        self.client.force_authenticate(user=self.user)
        
        self.other_user = User.objects.create_user(email='other@example.com', password='testpassword123')

    def test_account_center_data(self):
        url = reverse('account_center_data')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['profile']['email'], 'test@example.com')
        # Ensure it doesn't return other users' data

    def test_change_password_correct(self):
        url = reverse('auth_change_password')
        response = self.client.post(url, {
            'current_password': 'testpassword123',
            'new_password': 'newpassword456'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword456'))

    def test_change_password_incorrect(self):
        url = reverse('auth_change_password')
        response = self.client.post(url, {
            'current_password': 'wrongpassword',
            'new_password': 'newpassword456'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_phone_otp_flow(self):
        # Request OTP
        request_url = reverse('auth_phone_request_otp')
        response = self.client.post(request_url, {'phone_number': '0987654321'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        otp_record = PhoneOTP.objects.get(user=self.user, phone_number='0987654321')
        self.assertFalse(otp_record.is_verified)

        # Verify OTP
        verify_url = reverse('auth_phone_verify_otp')
        response = self.client.post(verify_url, {
            'phone_number': '0987654321',
            'otp': otp_record.otp
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.phone_number, '0987654321')

    def test_phone_otp_duplicate(self):
        self.other_user.profile.phone_number = '0987654321'
        self.other_user.profile.save()
        
        request_url = reverse('auth_phone_request_otp')
        response = self.client.post(request_url, {'phone_number': '0987654321'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_all(self):
        SessionLog.objects.create(user=self.user, ip_address='127.0.0.1')
        self.assertEqual(SessionLog.objects.filter(user=self.user).count(), 1)
        
        url = reverse('auth_logout_all')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(SessionLog.objects.filter(user=self.user).count(), 0)
