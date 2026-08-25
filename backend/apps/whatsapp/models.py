from django.db import models
from django.contrib.auth import get_user_model
import secrets

User = get_user_model()

class WhatsAppInstance(models.Model):
    STATUS_CHOICES = [
        ('connected', 'Connected'),
        ('disconnected', 'Disconnected'),
        ('qrcode', 'Scan QR Code'),
        ('connecting', 'Connecting'),
        ('pending', 'Pending'),
    ]
    
    TYPE_CHOICES = [
        ('meta', 'Meta Cloud API'),
        ('web_qr', 'WhatsApp Web (QR Code)'),
    ]
    
    BOT_MODE_CHOICES = [
        ('off', 'Disabled'),
        ('ai', 'AI Auto-Reply'),
        ('qa', 'Q&A Custom Rules'),
    ]

    PROVIDER_CHOICES = [
        ('gemini', 'Google Gemini'),
        ('openai', 'OpenAI'),
        ('claude', 'Anthropic Claude'),
        ('deepseek', 'DeepSeek'),
        ('groq', 'Groq'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='whatsapp_instances')
    instance_name = models.CharField(max_length=100)
    instance_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='meta')
    
    # Meta Cloud API fields (optional if type is web_qr)
    phone_number_id = models.CharField(max_length=100, blank=True, null=True, help_text="Meta Phone Number ID")
    waba_id = models.CharField(max_length=100, blank=True, null=True, help_text="Meta WhatsApp Business Account ID")
    business_id = models.CharField(max_length=100, blank=True, null=True, help_text="Meta Business ID")
    access_token = models.TextField(blank=True, null=True, help_text="Meta Permanent Access Token")
    
    # Meta specific metadata
    display_name = models.CharField(max_length=150, blank=True, null=True, help_text="Verified Display Name")
    quality_rating = models.CharField(max_length=50, blank=True, null=True, help_text="Phone Number Quality Rating")
    cloud_api_status = models.CharField(max_length=50, blank=True, null=True, help_text="Meta Cloud API Status")
    embedded_signup_completed = models.BooleanField(default=False)
    
    # WhatsApp Web (QR code) fields
    phone_number = models.CharField(max_length=30, blank=True, null=True, help_text="Connected WhatsApp phone number")
    qr_code = models.TextField(blank=True, null=True, help_text="Base64 QR Code string for scanning")
    
    # Auto-Reply / Bot fields
    bot_mode = models.CharField(max_length=20, choices=BOT_MODE_CHOICES, default='off')
    ai_provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES, default='gemini', help_text="AI Provider")
    ai_model = models.CharField(max_length=100, default='gemini-2.5-flash', help_text="AI Model Name")
    ai_prompt = models.TextField(blank=True, null=True, help_text="Business information / context for the AI agent")
    ai_api_key = models.CharField(max_length=255, blank=True, null=True, help_text="Gemini or OpenAI API key")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    api_key = models.CharField(max_length=64, unique=True, blank=True)
    webhook_url = models.URLField(max_length=500, blank=True, null=True, help_text="User Webhook to receive incoming messages")
    
    # Event-specific webhooks toggles
    webhook_enabled = models.BooleanField(default=True)
    wh_message_received = models.BooleanField(default=True)
    wh_message_sent = models.BooleanField(default=False)
    wh_status_changed = models.BooleanField(default=True)
    wh_group_member_join = models.BooleanField(default=False)
    wh_group_member_leave = models.BooleanField(default=False)
    wh_qr_updated = models.BooleanField(default=True)

    profile_picture = models.TextField(blank=True, null=True, help_text="Base64 or URL of WhatsApp avatar")
    last_activity = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.api_key:
            self.api_key = secrets.token_hex(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.instance_name} ({self.instance_type})"

class FAQRule(models.Model):
    MATCH_CHOICES = [
        ('exact', 'Exact Match'),
        ('contains', 'Contains Keyword'),
        ('starts_with', 'Starts With'),
        ('ends_with', 'Ends With'),
        ('regex', 'Regular Expression'),
    ]

    ACTION_CHOICES = [
        ('text', 'Send Text'),
        ('image', 'Send Image'),
        ('file', 'Send File'),
        ('buttons', 'Send Buttons'),
        ('list', 'Send List'),
        ('handover', 'Handover to Agent'),
    ]

    instance = models.ForeignKey(WhatsAppInstance, on_delete=models.CASCADE, related_name='faq_rules')
    keyword = models.CharField(max_length=255, help_text="Keyword or question to match")
    matching_type = models.CharField(max_length=20, choices=MATCH_CHOICES, default='contains')
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES, default='text')
    answer = models.TextField(help_text="Response to send (or action payload details)")
    action_payload = models.TextField(blank=True, null=True, help_text="JSON payload/metadata for lists/buttons/files")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.keyword} ({self.matching_type}) -> {self.action_type}"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    instance = models.ForeignKey(WhatsAppInstance, on_delete=models.CASCADE, related_name='bookings')
    customer_phone = models.CharField(max_length=30)
    name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    age = models.CharField(max_length=50, blank=True, null=True)
    current_step = models.IntegerField(default=0)  # 0: Ask Name, 1: Ask Phone, 2: Ask Address, 3: Ask Age, 4: Done
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking {self.customer_phone} - Step {self.current_step} ({self.status})"

class Agreement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class ConsentSignature(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consent_signatures')
    agreement = models.ForeignKey(Agreement, on_delete=models.CASCADE, related_name='signatures')
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone_number = models.CharField(max_length=30)
    ip_address = models.CharField(max_length=45)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} signed {self.agreement.title} @ {self.timestamp}"

class APILog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_logs', null=True, blank=True)
    instance = models.ForeignKey(WhatsAppInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name='api_logs')
    endpoint = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    status_code = models.IntegerField()
    outcome = models.TextField(blank=True, null=True)
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.method} {self.endpoint} - {self.status_code}"

class Notification(models.Model):
    TYPE_CHOICES = [
        ('expiry', 'Subscription Expiry'),
        ('disconnected', 'Disconnected Session'),
        ('success', 'Operation Success'),
        ('update', 'System Update'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)  # Null means broadcast
    title = models.CharField(max_length=255)
    content = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='success')
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class SupportTicket(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('pending', 'Pending'),
        ('closed', 'Closed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_tickets')
    # Admin assigned to handle this ticket (nullable — unassigned by default)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_support_tickets'
    )
    subject = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Ticket #{self.id}: {self.subject}"

class TicketMessage(models.Model):
    SENDER_TYPE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]

    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    # Distinguishes whether sender is a regular user or an admin
    sender_type = models.CharField(max_length=10, choices=SENDER_TYPE_CHOICES, default='user')
    message = models.TextField()
    # Track if the opposing party has read this message
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Msg on Ticket #{self.ticket.id} by {self.sender.email} ({self.sender_type})"

class Message(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
        ('failed', 'Failed'),
        ('received', 'Received'),
    ]
    DIRECTION_CHOICES = [
        ('outbound', 'Outbound'),
        ('inbound', 'Inbound'),
    ]

    instance = models.ForeignKey(WhatsAppInstance, on_delete=models.CASCADE, related_name='messages')
    message_id = models.CharField(max_length=255, unique=True, null=True, blank=True, help_text="Message identifier")
    recipient_phone = models.CharField(max_length=30)
    message_type = models.CharField(max_length=20, default='text')
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES, default='outbound')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')
    error_message = models.TextField(blank=True, null=True)
    payload = models.JSONField(blank=True, null=True, help_text="Raw payload sent or received")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.direction} - {self.recipient_phone} ({self.status})"

class WhatsAppTemplate(models.Model):
    instance = models.ForeignKey(WhatsAppInstance, on_delete=models.CASCADE, related_name='templates')
    name = models.CharField(max_length=255)
    language = models.CharField(max_length=10)
    category = models.CharField(max_length=100)
    status = models.CharField(max_length=50)
    components = models.JSONField(help_text="Header, Body, Footer, Buttons")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('instance', 'name', 'language')

    def __str__(self):
        return f"{self.name} ({self.language}) - {self.status}"
