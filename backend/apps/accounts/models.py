from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

from datetime import timedelta

class AdminRole(models.Model):
    name_ar = models.CharField(max_length=150)
    name_en = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=50, default="#3b82f6")
    icon = models.CharField(max_length=50, default="Shield")
    is_active = models.BooleanField(default=True)
    permissions = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name_en} / {self.name_ar}"

class Profile(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ('ordinary', 'Ordinary'),
        ('professional', 'Professional'),
        ('company', 'Company'),
    ]

    ACCOUNT_STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('banned', 'Banned'),
        ('pending', 'Pending'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=150, blank=True)
    company_name = models.CharField(max_length=150, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    admin_role = models.ForeignKey(AdminRole, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    
    # Account status & upgrades
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, default='ordinary')
    account_status = models.CharField(max_length=20, choices=ACCOUNT_STATUS_CHOICES, default='active')
    status_reason = models.TextField(blank=True, null=True)
    internal_notes = models.TextField(blank=True, null=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    
    # Security options
    two_factor_enabled = models.BooleanField(default=False)
    two_step_enabled = models.BooleanField(default=False)
    two_step_password = models.CharField(max_length=128, blank=True, null=True)
    last_login_ip = models.CharField(max_length=45, blank=True, null=True)
    restrict_ip_enabled = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Account Deletion
    account_deletion_requested = models.BooleanField(default=False)
    deletion_requested_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email}'s Profile"

class SessionLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='session_logs')
    ip_address = models.CharField(max_length=45)
    browser_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.ip_address} @ {self.created_at}"

class LoginHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_histories', null=True, blank=True)
    email_attempted = models.EmailField(blank=True, null=True)
    ip_address = models.CharField(max_length=45)
    status = models.CharField(max_length=20, default='success')  # success / failed
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.email_attempted or self.user.email} - {self.status} - {self.ip_address}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # 7-day free trial default
        trial_end = timezone.now() + timedelta(days=7)
        Profile.objects.create(user=instance, trial_ends_at=trial_end)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

class AdminAuditLog(models.Model):
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action_type = models.CharField(max_length=50) # e.g., 'CREATE_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'CHANGE_ADMIN_ROLE'
    details = models.TextField(blank=True, null=True)
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.admin.email if self.admin else 'System'} - {self.action_type} - {self.created_at}"

class PhoneOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='phone_otps')
    phone_number = models.CharField(max_length=20)
    otp = models.CharField(max_length=10)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"{self.user.email} - {self.phone_number} - {self.otp}"
