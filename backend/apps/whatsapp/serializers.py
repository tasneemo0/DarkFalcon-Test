from rest_framework import serializers
from .models import (
    WhatsAppInstance, Message, WhatsAppTemplate, FAQRule,
    Booking, Agreement, ConsentSignature, APILog, Notification,
    SupportTicket, TicketMessage
)

class FAQRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQRule
        fields = ['id', 'keyword', 'matching_type', 'action_type', 'answer', 'action_payload', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class WhatsAppInstanceSerializer(serializers.ModelSerializer):
    faq_rules = FAQRuleSerializer(many=True, read_only=True)

    class Meta:
        model = WhatsAppInstance
        fields = [
            'id', 'instance_name', 'instance_type', 
            'phone_number_id', 'waba_id', 'access_token',
            'phone_number', 'qr_code', 'status', 'api_key', 'webhook_url', 
            'bot_mode', 'ai_provider', 'ai_model', 'ai_prompt', 'ai_api_key',
            'webhook_enabled', 'wh_message_received', 'wh_message_sent',
            'wh_status_changed', 'wh_group_member_join', 'wh_group_member_leave',
            'wh_qr_updated', 'profile_picture', 'last_activity',
            'faq_rules', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'api_key', 'qr_code', 'phone_number', 'created_at', 'updated_at', 'last_activity', 'profile_picture']

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'instance', 'message_id', 'recipient_phone', 'message_type', 'direction', 'status', 'error_message', 'payload', 'created_at']
        read_only_fields = ['id', 'message_id', 'created_at']

class WhatsAppTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhatsAppTemplate
        fields = ['id', 'name', 'language', 'category', 'status', 'components', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = '__all__'

class AgreementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agreement
        fields = '__all__'

class ConsentSignatureSerializer(serializers.ModelSerializer):
    agreement_title = serializers.CharField(source='agreement.title', read_only=True)

    class Meta:
        model = ConsentSignature
        fields = ['id', 'agreement', 'agreement_title', 'full_name', 'email', 'phone_number', 'ip_address', 'timestamp']

class APILogSerializer(serializers.ModelSerializer):
    instance_name = serializers.CharField(source='instance.instance_name', read_only=True)

    class Meta:
        model = APILog
        fields = ['id', 'instance', 'instance_name', 'endpoint', 'method', 'status_code', 'outcome', 'ip_address', 'created_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

# ---------------------------------------------------------------------------
# Support Chat Serializers
# ---------------------------------------------------------------------------

class TicketMessageSerializer(serializers.ModelSerializer):
    """
    Full message serializer.
    Returns all fields needed by the frontend chat view.
    Does NOT expose sensitive data (no password, no tokens).
    """
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = [
            'id', 'ticket',
            'sender', 'sender_email', 'sender_name', 'sender_type',
            'message', 'is_read', 'created_at'
        ]
        read_only_fields = [
            'id', 'ticket', 'sender', 'sender_email',
            'sender_name', 'sender_type', 'created_at'
        ]

    def get_sender_name(self, obj):
        profile = getattr(obj.sender, 'profile', None)
        if profile and profile.full_name:
            return profile.full_name
        return obj.sender.email

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        is_admin_request = request and request.user and request.user.is_staff
        
        if not is_admin_request and instance.sender_type == 'admin':
            data.pop('sender_email', None)
            data['sender_name'] = 'فريق الدعم'
            
        return data


class SupportTicketSerializer(serializers.ModelSerializer):
    """
    Full ticket serializer used for detail views (ticket + all messages).
    """
    messages = TicketMessageSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    assigned_admin_name = serializers.SerializerMethodField()
    assigned_admin_email = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    ticket_number = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number',
            'user', 'user_email', 'user_name',
            'assigned_to', 'assigned_admin_name', 'assigned_admin_email',
            'subject', 'description', 'status',
            'unread_count', 'last_message', 'last_message_time',
            'messages',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'ticket_number', 'created_at', 'updated_at', 'user',
            'user_email', 'user_name', 'assigned_admin_name', 'assigned_admin_email'
        ]

    def get_ticket_number(self, obj):
        """Human-readable ticket ID: DF-000001"""
        return f"DF-{obj.id:06d}"

    def get_user_name(self, obj):
        profile = getattr(obj.user, 'profile', None)
        if profile and profile.full_name:
            return profile.full_name
        return obj.user.email

    def get_assigned_admin_name(self, obj):
        if not obj.assigned_to:
            return None
        profile = getattr(obj.assigned_to, 'profile', None)
        if profile and profile.full_name:
            return profile.full_name
        return obj.assigned_to.email

    def get_assigned_admin_email(self, obj):
        if not obj.assigned_to:
            return None
        return obj.assigned_to.email

    def get_unread_count(self, obj):
        """Unread count from the perspective of the requesting party."""
        request = self.context.get('request')
        if not request:
            return 0
        if request.user == obj.user:
            # Client: count unread admin replies
            return obj.messages.filter(sender_type='admin', is_read=False).count()
        # Admin: count unread user messages
        return obj.messages.filter(sender_type='user', is_read=False).count()

    def get_last_message(self, obj):
        """Text preview of the most recent message (max 120 chars)."""
        last = obj.messages.order_by('-created_at').first()
        if last:
            return last.message[:120]
        return obj.description[:120]

    def get_last_message_time(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return last.created_at if last else obj.updated_at

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        is_admin_request = request and request.user and request.user.is_staff
        
        if not is_admin_request:
            data.pop('assigned_admin_email', None)
            if data.get('assigned_admin_name'):
                data['assigned_admin_name'] = 'فريق الدعم'
                
        return data


class SupportTicketListSerializer(serializers.ModelSerializer):
    """
    Lightweight list serializer — no full message thread.
    Used in paginated list endpoints to keep responses small.
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    assigned_admin_name = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    ticket_number = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number',
            'user', 'user_email', 'user_name',
            'assigned_to', 'assigned_admin_name',
            'subject', 'status',
            'unread_count', 'last_message', 'last_message_time',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'ticket_number', 'user', 'user_email', 'user_name',
            'assigned_to', 'assigned_admin_name',
            'subject', 'status',
            'unread_count', 'last_message', 'last_message_time',
            'created_at', 'updated_at'
        ]

    def get_ticket_number(self, obj):
        return f"DF-{obj.id:06d}"

    def get_user_name(self, obj):
        profile = getattr(obj.user, 'profile', None)
        if profile and profile.full_name:
            return profile.full_name
        return obj.user.email

    def get_assigned_admin_name(self, obj):
        if not obj.assigned_to:
            return None
        profile = getattr(obj.assigned_to, 'profile', None)
        if profile and profile.full_name:
            return profile.full_name
        return obj.assigned_to.email

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        if request.user == obj.user:
            return obj.messages.filter(sender_type='admin', is_read=False).count()
        return obj.messages.filter(sender_type='user', is_read=False).count()

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if last:
            return last.message[:120]
        return obj.description[:120]

    def get_last_message_time(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return last.created_at if last else obj.updated_at

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        is_admin_request = request and request.user and request.user.is_staff
        
        if not is_admin_request:
            if data.get('assigned_admin_name'):
                data['assigned_admin_name'] = 'فريق الدعم'
                
        return data
