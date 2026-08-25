from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Plan(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.IntegerField(default=30)
    
    # Limits
    message_limit = models.IntegerField(default=10000)
    is_messages_unlimited = models.BooleanField(default=False)
    device_limit = models.IntegerField(default=3)
    is_devices_unlimited = models.BooleanField(default=False)
    number_limit = models.IntegerField(default=1)
    is_numbers_unlimited = models.BooleanField(default=False)
    
    # Features
    interactive_bot = models.BooleanField(default=False)
    ai_reply = models.BooleanField(default=False)
    webhooks = models.BooleanField(default=False)
    api_access = models.BooleanField(default=False)
    broadcasts = models.BooleanField(default=False)
    
    # Design and UI
    SUPPORT_CHOICES = [
        ('regular', 'Regular'),
        ('medium', 'Medium'),
        ('priority', 'Priority'),
        ('vip', 'VIP'),
    ]
    support_type = models.CharField(max_length=20, choices=SUPPORT_CHOICES, default='regular')
    
    ICON_CHOICES = [
        ('vip', 'VIP'),
        ('max', 'Max'),
        ('plus', 'Plus'),
        ('gold', 'Gold'),
        ('silver', 'Silver'),
        ('diamond', 'Diamond'),
        ('basic', 'Basic'),
    ]
    icon = models.CharField(max_length=50, choices=ICON_CHOICES, default='basic')
    color_gradient = models.CharField(max_length=100, default='linear-gradient(135deg, #333333, #000000)')
    order = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.price} SAR"

class Subscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='subscriptions')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.plan.name} ({self.active})"

class SubscriptionUsage(models.Model):
    subscription = models.OneToOneField(Subscription, on_delete=models.CASCADE, related_name='usage')
    
    messages_used = models.IntegerField(default=0)
    messages_limit = models.IntegerField(default=10000)
    
    devices_used = models.IntegerField(default=0)
    devices_limit = models.IntegerField(default=1)
    
    numbers_used = models.IntegerField(default=0)
    numbers_limit = models.IntegerField(default=1)
    
    @property
    def messages_remaining(self):
        return max(0, self.messages_limit - self.messages_used)

    def __str__(self):
        return f"Usage for {self.subscription.user.email} - {self.subscription.plan.name}"

class Invoice(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('unpaid', 'Unpaid'),
        ('refunded', 'Refunded'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    pdf_file = models.FileField(upload_to='invoices/', null=True, blank=True)
    receipt_image = models.ImageField(upload_to='receipts/', null=True, blank=True)
    payment_method = models.CharField(max_length=50, default='bank_transfer')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice #{self.id} for {self.user.email} - {self.amount} ({self.status})"
