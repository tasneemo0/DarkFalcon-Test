from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile, AdminRole

User = get_user_model()

from .models import SessionLog, LoginHistory

class SessionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionLog
        fields = '__all__'

class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = '__all__'

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            'full_name', 'company_name', 'phone_number', 'account_type',
            'trial_ends_at', 'two_factor_enabled', 'two_step_enabled',
            'two_step_password', 'last_login_ip', 'restrict_ip_enabled',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'last_login_ip', 'account_type', 'trial_ends_at']
        extra_kwargs = {
            'two_step_password': {'write_only': True}
        }

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'is_email_verified', 'is_staff', 'date_joined', 'profile']
        read_only_fields = ['id', 'is_email_verified', 'date_joined', 'is_staff']


class AdminRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminRole
        fields = '__all__'

class AdminUserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    admin_role = AdminRoleSerializer(source='profile.admin_role', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'profile', 'admin_role']

class AdminUserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'

class AdminClientSerializer(serializers.ModelSerializer):
    profile = AdminUserProfileSerializer(read_only=True)
    whatsapp_instances_count = serializers.IntegerField(read_only=True)
    messages_used_count = serializers.IntegerField(read_only=True)
    last_login_at = serializers.DateTimeField(source='profile.last_activity', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'is_active', 'is_email_verified', 'date_joined', 'profile', 'whatsapp_instances_count', 'messages_used_count', 'last_login_at']



class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    company_name = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    country_code = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = ['email', 'password', 'full_name', 'company_name', 'phone_number', 'country_code']

    def create(self, validated_data):
        email = validated_data.get('email')
        phone_number = validated_data.get('phone_number')
        country_code = validated_data.get('country_code', '')
        password = validated_data.get('password')
        
        full_phone = ''
        if phone_number:
            clean_phone = ''.join(filter(str.isdigit, phone_number)).lstrip('0')
            clean_cc = ''.join(filter(str.isdigit, country_code))
            full_phone = f"+{clean_cc}{clean_phone}" if clean_cc else phone_number
            
            if not email:
                email = f"phone_{full_phone.replace('+', '')}@trustchat.local"
                validated_data['email'] = email
        
        user = User.objects.create_user(email=email, password=password)
        
        # Populate profile if extra profile fields are passed
        profile = user.profile
        profile.full_name = validated_data.get('full_name', '')
        profile.company_name = validated_data.get('company_name', '')
        profile.phone_number = full_phone if phone_number else ''
        profile.save()
        
        return user
