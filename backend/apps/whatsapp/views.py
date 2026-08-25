from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import WhatsAppInstance, Message, WhatsAppTemplate, FAQRule
from .serializers import WhatsAppInstanceSerializer, MessageSerializer, WhatsAppTemplateSerializer, FAQRuleSerializer
from .authentication import WhatsAppAPIKeyAuthentication
from .utils import (
    send_meta_whatsapp_message, 
    send_web_whatsapp_message, 
    sync_meta_templates, 
    init_web_instance, 
    logout_web_instance,
    normalize_whatsapp_phone
)
from .tasks import handle_inbound_message_task
import json
import logging
import requests
import threading
import time
from django.conf import settings

logger = logging.getLogger(__name__)

class WhatsAppInstanceViewSet(viewsets.ModelViewSet):
    serializer_class = WhatsAppInstanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WhatsAppInstance.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        if WhatsAppInstance.objects.filter(user=user).count() >= 3:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You have reached the maximum limit of 3 WhatsApp devices. Please delete a device before adding a new one.")
        instance_type = self.request.data.get('instance_type', 'meta')
        status_val = 'disconnected' if instance_type == 'web_qr' else 'connected'
        serializer.save(user=user, status=status_val)

    @action(detail=True, methods=['post'], url_path='init')
    def init_session(self, request, pk=None):
        instance = self.get_object()
        if instance.instance_type != 'web_qr':
            return Response({'error': 'Only web_qr instances require session initialization.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            init_web_instance(instance.id)
            instance.status = 'connecting'
            instance.save()
            return Response(WhatsAppInstanceSerializer(instance).data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='logout')
    def logout_session(self, request, pk=None):
        instance = self.get_object()
        if instance.instance_type != 'web_qr':
            return Response({'error': 'Only web_qr instances can log out via this endpoint.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logout_web_instance(instance.id)
            instance.status = 'disconnected'
            instance.qr_code = None
            instance.phone_number = None
            instance.save()
            return Response(WhatsAppInstanceSerializer(instance).data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FAQRuleViewSet(viewsets.ModelViewSet):
    serializer_class = FAQRuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FAQRule.objects.filter(instance__user=self.request.user)

    def perform_create(self, serializer):
        instance_id = self.request.data.get('instance')
        instance = get_object_or_404(WhatsAppInstance, pk=instance_id, user=self.request.user)
        serializer.save(instance=instance)


class SyncTemplatesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        instance = get_object_or_404(WhatsAppInstance, pk=pk, user=request.user)
        if instance.instance_type != 'meta':
            return Response({'error': 'Templates are only supported for Meta Cloud API instances.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            templates_data = sync_meta_templates(instance.waba_id, instance.access_token)
            
            synced_count = 0
            for t_data in templates_data:
                template, created = WhatsAppTemplate.objects.update_or_create(
                    instance=instance,
                    name=t_data.get('name'),
                    language=t_data.get('language'),
                    defaults={
                        'category': t_data.get('category'),
                        'status': t_data.get('status'),
                        'components': t_data.get('components', [])
                    }
                )
                synced_count += 1
                
            return Response({
                'message': f'Successfully synced {synced_count} templates from Meta.',
                'templates': WhatsAppTemplateSerializer(WhatsAppTemplate.objects.filter(instance=instance), many=True).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Error syncing templates")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


from .models import APILog

def log_api_request(request, outcome, status_code, endpoint):
    try:
        user = getattr(request, 'user', None)
        if user and not user.is_authenticated:
            user = None
        instance = getattr(request, 'whatsapp_instance', None)
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        APILog.objects.create(
            user=user,
            instance=instance,
            endpoint=endpoint,
            method=request.method,
            status_code=status_code,
            outcome=str(outcome)[:1000],
            ip_address=ip
        )
    except Exception as e:
        logger.error(f"Failed to create APILog: {e}")

class BaseDeveloperAPIView(APIView):
    authentication_classes = []
    permission_classes = [WhatsAppAPIKeyAuthentication]

class SendTextMessageView(BaseDeveloperAPIView):

    def post(self, request):
        instance = request.whatsapp_instance
        recipient = normalize_whatsapp_phone(request.data.get('to'), instance=instance)
        body = request.data.get('body')
        
        if not recipient or not body:
            log_api_request(request, "Validation Error: Fields 'to' and 'body' are required.", 400, "/api/v1/whatsapp/send/text/")
            return Response({'error': 'Fields "to" and "body" are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if instance.status != 'connected':
            log_api_request(request, "Validation Error: WhatsApp instance is not connected.", 400, "/api/v1/whatsapp/send/text/")
            return Response({'error': 'WhatsApp instance is not connected. Please scan the QR code first.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create outbound message record
        msg = Message.objects.create(
            instance=instance,
            recipient_phone=recipient,
            message_type='text',
            direction='outbound',
            status='sending',
            payload={'body': body}
        )
        
        try:
            if instance.instance_type == 'meta':
                meta_msg_id = send_meta_whatsapp_message(
                    phone_number_id=instance.phone_number_id,
                    access_token=instance.access_token,
                    recipient_phone=recipient,
                    message_type='text',
                    payload_data={'body': body}
                )
                if meta_msg_id:
                    msg.message_id = meta_msg_id
                    msg.status = 'sent'
                    msg.save()
            else:
                # Web QR instance
                gateway_msg_id = send_web_whatsapp_message(
                    instance_id=instance.id,
                    recipient_phone=recipient,
                    text=body,
                    message_type='text'
                )
                if gateway_msg_id:
                    msg.message_id = gateway_msg_id
                    msg.status = 'sent'
                    msg.save()
                    
            log_api_request(request, f"Success: Message ID {msg.message_id}", 201, "/api/v1/whatsapp/send/text/")
            return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Error sending message")
            msg.status = 'failed'
            msg.error_message = str(e)
            msg.save()
            err_str = str(e)
            status_code = status.HTTP_400_BAD_REQUEST if "not connected" in err_str.lower() else status.HTTP_500_INTERNAL_SERVER_ERROR
            log_api_request(request, f"Failure: {err_str}", status_code, "/api/v1/whatsapp/send/text/")
            return Response({
                'error': 'Failed to send message.',
                'details': err_str,
                'message_record': MessageSerializer(msg).data
            }, status=status_code)


class SendTemplateMessageView(BaseDeveloperAPIView):

    def post(self, request):
        instance = request.whatsapp_instance
        if instance.instance_type != 'meta':
            log_api_request(request, "Error: Templates only supported on Meta Cloud API.", 400, "/api/v1/whatsapp/send/template/")
            return Response({'error': 'Template messages are only supported on Meta Cloud API instances.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if instance.status != 'connected':
            log_api_request(request, "Validation Error: WhatsApp instance is not connected.", 400, "/api/v1/whatsapp/send/template/")
            return Response({'error': 'WhatsApp instance is not connected. Please connect the instance first.'}, status=status.HTTP_400_BAD_REQUEST)

        recipient = normalize_whatsapp_phone(request.data.get('to'), instance=instance)
        template_name = request.data.get('template')
        language_code = request.data.get('language', 'en')
        components = request.data.get('components', [])
        
        if not recipient or not template_name:
            log_api_request(request, "Validation Error: Fields 'to' and 'template' are required.", 400, "/api/v1/whatsapp/send/template/")
            return Response({'error': 'Fields "to" and "template" are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        payload_data = {
            'name': template_name,
            'language_code': language_code,
            'components': components
        }
        
        msg = Message.objects.create(
            instance=instance,
            recipient_phone=recipient,
            message_type='template',
            direction='outbound',
            status='sending',
            payload=payload_data
        )
        
        try:
            meta_msg_id = send_meta_whatsapp_message(
                phone_number_id=instance.phone_number_id,
                access_token=instance.access_token,
                recipient_phone=recipient,
                message_type='template',
                payload_data=payload_data
            )
            if meta_msg_id:
                msg.message_id = meta_msg_id
                msg.status = 'sent'
                msg.save()
            log_api_request(request, f"Success: Template Message ID {msg.message_id}", 201, "/api/v1/whatsapp/send/template/")
            return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Error sending template message")
            msg.status = 'failed'
            msg.error_message = str(e)
            msg.save()
            err_str = str(e)
            status_code = status.HTTP_400_BAD_REQUEST if "not connected" in err_str.lower() else status.HTTP_500_INTERNAL_SERVER_ERROR
            log_api_request(request, f"Failure: {err_str}", status_code, "/api/v1/whatsapp/send/template/")
            return Response({
                'error': 'Failed to send template message via Meta API.',
                'details': err_str,
                'message_record': MessageSerializer(msg).data
            }, status=status_code)


class SendMediaMessageView(BaseDeveloperAPIView):

    def post(self, request):
        instance = request.whatsapp_instance
        recipient = normalize_whatsapp_phone(request.data.get('to'), instance=instance)
        media_type = request.data.get('type')  # image, document, etc.
        media_link = request.data.get('link')
        caption = request.data.get('caption', '')
        filename = request.data.get('filename', 'file')
        
        if not recipient or not media_type or not media_link:
            log_api_request(request, "Validation Error: Fields 'to', 'type', and 'link' are required.", 400, "/api/v1/whatsapp/send/media/")
            return Response({'error': 'Fields "to", "type", and "link" are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if instance.status != 'connected':
            log_api_request(request, "Validation Error: WhatsApp instance is not connected.", 400, "/api/v1/whatsapp/send/media/")
            return Response({'error': 'WhatsApp instance is not connected. Please connect the instance first.'}, status=status.HTTP_400_BAD_REQUEST)

        payload_data = {
            'link': media_link,
            'caption': caption,
            'filename': filename
        }
        
        msg = Message.objects.create(
            instance=instance,
            recipient_phone=recipient,
            message_type=media_type,
            direction='outbound',
            status='sending',
            payload=payload_data
        )
        
        try:
            if instance.instance_type == 'meta':
                meta_msg_id = send_meta_whatsapp_message(
                    phone_number_id=instance.phone_number_id,
                    access_token=instance.access_token,
                    recipient_phone=recipient,
                    message_type=media_type,
                    payload_data=payload_data
                )
                if meta_msg_id:
                    msg.message_id = meta_msg_id
                    msg.status = 'sent'
                    msg.save()
            else:
                # Web QR instance
                gateway_msg_id = send_web_whatsapp_message(
                    instance_id=instance.id,
                    recipient_phone=recipient,
                    text=caption,
                    message_type=media_type,
                    media_url=media_link,
                    filename=filename,
                    caption=caption
                )
                if gateway_msg_id:
                    msg.message_id = gateway_msg_id
                    msg.status = 'sent'
                    msg.save()
            log_api_request(request, f"Success: Media {media_type} Message ID {msg.message_id}", 201, "/api/v1/whatsapp/send/media/")
            return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Error sending media message")
            msg.status = 'failed'
            msg.error_message = str(e)
            msg.save()
            err_str = str(e)
            status_code = status.HTTP_400_BAD_REQUEST if "not connected" in err_str.lower() else status.HTTP_500_INTERNAL_SERVER_ERROR
            log_api_request(request, f"Failure: {err_str}", status_code, "/api/v1/whatsapp/send/media/")
            return Response({
                'error': 'Failed to send media message.',
                'details': err_str,
                'message_record': MessageSerializer(msg).data
            }, status=status_code)


class MetaWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        verify_token = "darkfalcon_verify_token_123"
        mode = request.query_params.get('hub.mode')
        token = request.query_params.get('hub.verify_token')
        challenge = request.query_params.get('hub.challenge')
        
        if mode and token:
            if mode == 'subscribe' and token == verify_token:
                logger.info("Meta Webhook verified successfully!")
                return Response(int(challenge), status=status.HTTP_200_OK)
            return Response("Forbidden", status=status.HTTP_403_FORBIDDEN)
        return Response("Bad Request", status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        logger.info(f"Webhook event received: {json.dumps(request.data)}")
        entry = request.data.get('entry', [])
        for entry_item in entry:
            changes = entry_item.get('changes', [])
            for change in changes:
                value = change.get('value', {})
                
                # Status updates
                statuses = value.get('statuses', [])
                for status_item in statuses:
                    meta_msg_id = status_item.get('id')
                    status_val = status_item.get('status')
                    try:
                        msg = Message.objects.get(message_id=meta_msg_id)
                        msg.status = status_val
                        if status_val == 'failed':
                            errors = status_item.get('errors', [])
                            if errors:
                                msg.error_message = errors[0].get('message')
                        msg.save()
                    except Message.DoesNotExist:
                        pass
                
                # Inbound messages
                messages = value.get('messages', [])
                metadata = value.get('metadata', {})
                phone_number_id = metadata.get('phone_number_id')
                
                if messages and phone_number_id:
                    try:
                        instance = WhatsAppInstance.objects.get(phone_number_id=phone_number_id)
                        for msg_item in messages:
                            from_phone = normalize_whatsapp_phone(msg_item.get('from'))
                            meta_msg_id = msg_item.get('id')
                            msg_type = msg_item.get('type', 'text')
                            
                            payload_data = {}
                            text_content = ""
                            if msg_type == 'text':
                                text_content = msg_item.get('text', {}).get('body', '')
                                payload_data['body'] = text_content
                            else:
                                payload_data = msg_item.get(msg_type, {})
                                
                            msg_obj, created = Message.objects.get_or_create(
                                message_id=meta_msg_id,
                                defaults={
                                    'instance': instance,
                                    'recipient_phone': from_phone,
                                    'message_type': msg_type,
                                    'direction': 'inbound',
                                    'status': 'received',
                                    'payload': payload_data
                                }
                            )
                            
                            # Trigger Bot reply handler if bot is enabled
                            if created and instance.bot_mode != 'off' and msg_type == 'text':
                                handle_inbound_message_task.apply(args=[instance.id, from_phone, text_content])
                                
                            # Forward Webhook to User if configured
                            if instance.webhook_url:
                                try:
                                    requests.post(instance.webhook_url, json={
                                        "event": "message_received",
                                        "instance_id": instance.id,
                                        "message": {
                                            "id": meta_msg_id,
                                            "from": from_phone,
                                            "type": msg_type,
                                            "body": text_content,
                                            "payload": payload_data
                                        }
                                    }, timeout=3)
                                except Exception as webhook_err:
                                    logger.error(f"Failed to forward webhook to user: {webhook_err}")
                                    
                    except WhatsAppInstance.DoesNotExist:
                        logger.error(f"Received inbound message for unknown phone_number_id: {phone_number_id}")
                        
        return Response({'status': 'processed'}, status=status.HTTP_200_OK)


class GatewayWebhookView(APIView):
    """
    Receives events from the Node.js WhatsApp Gateway microservice.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        instance_id = request.data.get('instance_id')
        event = request.data.get('event')
        data = request.data.get('data', {})

        # Handle gateway restart - reset all disconnected instances
        if event == 'gateway_restart':
            active_sessions = data.get('active_sessions', [])
            logger.info(f"[GATEWAY-WH] Gateway restarted. Active sessions: {active_sessions}")
            # Mark all web_qr instances that are NOT in active_sessions as disconnected
            stale_instances = WhatsAppInstance.objects.filter(
                instance_type='web_qr',
                status__in=['connected', 'connecting', 'qrcode']
            ).exclude(pk__in=[int(s) for s in active_sessions if s.isdigit()])
            count = stale_instances.update(status='disconnected', qr_code=None)
            logger.info(f"[GATEWAY-WH] Reset {count} stale instances to disconnected after gateway restart.")
            return Response({'status': 'ok', 'reset_count': count})

        if not instance_id or not event:
            return Response({'error': 'instance_id and event are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            instance = WhatsAppInstance.objects.get(pk=instance_id)
        except WhatsAppInstance.DoesNotExist:
            return Response({'error': f'WhatsAppInstance {instance_id} not found'}, status=status.HTTP_404_NOT_FOUND)

        if event == 'qrcode':
            instance.status = 'qrcode'
            instance.qr_code = data.get('qr')
            instance.save()
            logger.info(f"Updated QR code for instance {instance_id}")

        elif event == 'status':
            status_val = data.get('status')
            instance.status = status_val
            if status_val == 'connected':
                instance.phone_number = normalize_whatsapp_phone(data.get('phone'))
                instance.qr_code = None
            elif status_val == 'disconnected':
                instance.qr_code = None
            instance.save()
            logger.info(f"Updated connection status of instance {instance_id} to {status_val}")

        elif event == 'message':
            msg_id = data.get('msg_id')
            sender = normalize_whatsapp_phone(data.get('from'))
            sender_jid = data.get('jid', '')  # Full JID (e.g. 123@lid or 123@s.whatsapp.net)
            from_me = data.get('from_me', False)
            text = data.get('text', '')
            timestamp = data.get('timestamp')
            
            logger.info(f"[GATEWAY-WH] Message event: instance={instance_id}, msg_id={msg_id}, from={sender}, jid={sender_jid}, from_me={from_me}, text='{text}'")
            
            direction = 'outbound' if from_me else 'inbound'
            status_val = 'sent' if from_me else 'received'

            # Log message to database
            msg_obj, created = Message.objects.get_or_create(
                message_id=msg_id,
                defaults={
                    'instance': instance,
                    'recipient_phone': sender,
                    'message_type': 'text',
                    'direction': direction,
                    'status': status_val,
                    'payload': {'body': text, 'timestamp': timestamp, 'jid': sender_jid}
                }
            )
            
            logger.info(f"[GATEWAY-WH] Message saved: created={created}, direction={direction}, bot_mode={instance.bot_mode}")

            # Determine the reply address: use full JID if available, otherwise fall back to phone number
            reply_to = sender_jid if sender_jid else sender

            # Trigger auto-reply if this is a new inbound message (in background thread to avoid deadlock)
            if created and not from_me and instance.bot_mode != 'off' and text.strip():
                # Check if message is older than 2 minutes to prevent replying to historical sync messages
                is_recent = True
                if timestamp:
                    try:
                        current_time = time.time()
                        msg_time = int(timestamp)
                        if current_time - msg_time > 120:  # older than 2 minutes
                            is_recent = False
                            logger.info(f"[GATEWAY-WH] Message is old (diff={current_time - msg_time}s). Skipping auto-reply to prevent spam/timeout.")
                    except Exception as e:
                        logger.error(f"[GATEWAY-WH] Error parsing timestamp {timestamp}: {e}")

                if is_recent:
                    logger.info(f"[GATEWAY-WH] Triggering auto-reply in background thread for instance {instance_id}, reply_to={reply_to}")
                    def _run_reply(inst_id, phone, msg_text):
                        try:
                            # Small delay to let Django return 200 first
                            time.sleep(0.5)
                            logger.info(f"[GATEWAY-WH] Background thread starting reply: inst={inst_id}, phone={phone}, text='{msg_text}'")
                            result = handle_inbound_message_task.apply(args=[inst_id, phone, msg_text])
                            logger.info(f"[GATEWAY-WH] Background reply task result: {result}")
                        except Exception as e:
                            logger.error(f"[GATEWAY-WH] Background reply thread error: {e}", exc_info=True)
                    t = threading.Thread(target=_run_reply, args=(instance.id, reply_to, text), daemon=True)
                    t.start()

            # Forward Webhook to customer's custom webhook URL if configured
            if instance.webhook_url:
                try:
                    requests.post(instance.webhook_url, json={
                        "event": "message_received" if not from_me else "message_sent",
                        "instance_id": instance.id,
                        "message": {
                            "id": msg_id,
                            "from": sender,
                            "type": "text",
                            "body": text,
                            "from_me": from_me,
                            "timestamp": timestamp
                        }
                    }, timeout=3)
                except Exception as webhook_err:
                    logger.error(f"Failed to forward custom webhook: {webhook_err}")

        return Response({'status': 'ok'})


# ----------------------------------------------------------------------
# ViewSets & Support endpoints
# ----------------------------------------------------------------------

from .models import Agreement, ConsentSignature, APILog, Notification, SupportTicket, TicketMessage, Booking
from .serializers import (
    AgreementSerializer, ConsentSignatureSerializer, APILogSerializer, 
    NotificationSerializer, SupportTicketSerializer, TicketMessageSerializer, BookingSerializer
)

class BookingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(instance__user=self.request.user).order_by('-created_at')


class APILogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = APILogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return APILog.objects.filter(user=self.request.user).order_by('-created_at')


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        return Notification.objects.filter(Q(user=self.request.user) | Q(user__isnull=True)).order_by('-created_at')

    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.read = True
        notif.save()
        return Response({'status': 'marked as read'})


class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        ticket = self.get_object()
        msg_text = request.data.get('message')
        if not msg_text:
            return Response({'error': 'Message text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        msg = TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=msg_text
        )
        if ticket.status == 'closed':
            ticket.status = 'open'
            ticket.save()
        return Response(TicketMessageSerializer(msg).data, status=status.HTTP_201_CREATED)


class AgreementViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AgreementSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Agreement.objects.filter(is_active=True)

    @action(detail=True, methods=['post'], url_path='sign')
    def sign(self, request, pk=None):
        agreement = self.get_object()
        full_name = request.data.get('full_name')
        email = request.data.get('email')
        phone_number = request.data.get('phone_number')
        
        if not full_name or not email or not phone_number:
            return Response({'error': 'full_name, email, and phone_number are required'}, status=status.HTTP_400_BAD_REQUEST)

        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        sig = ConsentSignature.objects.create(
            user=request.user,
            agreement=agreement,
            full_name=full_name,
            email=email,
            phone_number=phone_number,
            ip_address=ip
        )
        return Response(ConsentSignatureSerializer(sig).data, status=status.HTTP_201_CREATED)


# ----------------------------------------------------------------------
# Developer API Views (Authenticated by Instance API Key)
# ----------------------------------------------------------------------

class SendButtonsView(BaseDeveloperAPIView):

    def post(self, request):
        instance = request.whatsapp_instance
        recipient = normalize_whatsapp_phone(request.data.get('to'), instance=instance)
        text = request.data.get('text')
        buttons = request.data.get('buttons')
        footer = request.data.get('footer', '')
        
        if not recipient or not text or not buttons:
            log_api_request(request, "Validation Error: to, text, and buttons are required.", 400, "/api/v1/whatsapp/send/buttons/")
            return Response({'error': 'Fields "to", "text", and "buttons" are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if instance.status != 'connected':
            log_api_request(request, "Validation Error: WhatsApp instance is not connected.", 400, "/api/v1/whatsapp/send/buttons/")
            return Response({'error': 'WhatsApp instance is not connected. Please connect the instance first.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if instance.instance_type == 'meta':
                # Mock sending Buttons to Meta
                msg_id = "meta_mock_buttons_" + recipient
            else:
                msg_id = send_web_whatsapp_message(
                    instance.id, recipient, text, 'buttons', buttons=buttons, footer=footer
                )
            log_api_request(request, f"Success: Buttons message sent ID {msg_id}", 201, "/api/v1/whatsapp/send/buttons/")
            return Response({'status': 'sent', 'message_id': msg_id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            err_str = str(e)
            status_code = status.HTTP_400_BAD_REQUEST if "not connected" in err_str.lower() else status.HTTP_500_INTERNAL_SERVER_ERROR
            log_api_request(request, f"Failure: {err_str}", status_code, "/api/v1/whatsapp/send/buttons/")
            return Response({'error': err_str}, status=status_code)


class SendListView(BaseDeveloperAPIView):

    def post(self, request):
        instance = request.whatsapp_instance
        recipient = normalize_whatsapp_phone(request.data.get('to'), instance=instance)
        text = request.data.get('text')
        sections = request.data.get('sections')
        title = request.data.get('title', '')
        button_text = request.data.get('buttonText', 'Select')
        footer = request.data.get('footer', '')

        if not recipient or not text or not sections:
            log_api_request(request, "Validation Error: to, text, and sections are required.", 400, "/api/v1/whatsapp/send/list/")
            return Response({'error': 'Fields "to", "text", and "sections" are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if instance.status != 'connected':
            log_api_request(request, "Validation Error: WhatsApp instance is not connected.", 400, "/api/v1/whatsapp/send/list/")
            return Response({'error': 'WhatsApp instance is not connected. Please connect the instance first.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if instance.instance_type == 'meta':
                msg_id = "meta_mock_list_" + recipient
            else:
                msg_id = send_web_whatsapp_message(
                    instance.id, recipient, text, 'list', sections=sections, buttonText=button_text, title=title, footer=footer
                )
            log_api_request(request, f"Success: List message sent ID {msg_id}", 201, "/api/v1/whatsapp/send/list/")
            return Response({'status': 'sent', 'message_id': msg_id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            err_str = str(e)
            status_code = status.HTTP_400_BAD_REQUEST if "not connected" in err_str.lower() else status.HTTP_500_INTERNAL_SERVER_ERROR
            log_api_request(request, f"Failure: {err_str}", status_code, "/api/v1/whatsapp/send/list/")
            return Response({'error': err_str}, status=status_code)


class GetChatsView(BaseDeveloperAPIView):

    def get(self, request):
        instance = request.whatsapp_instance
        try:
            if instance.instance_type == 'meta':
                return Response({'success': True, 'chats': []})
            from .utils import WHATSAPP_GATEWAY_URL
            res = requests.get(f"{WHATSAPP_GATEWAY_URL}/instance/chats", params={"instanceId": str(instance.id)}, timeout=5)
            log_api_request(request, "Success: fetched chats", 200, "/api/v1/whatsapp/chats/")
            return Response(res.json())
        except Exception as e:
            log_api_request(request, f"Failure: {str(e)}", 500, "/api/v1/whatsapp/chats/")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetContactsView(BaseDeveloperAPIView):

    def get(self, request):
        instance = request.whatsapp_instance
        try:
            if instance.instance_type == 'meta':
                return Response({'success': True, 'contacts': []})
            from .utils import WHATSAPP_GATEWAY_URL
            res = requests.get(f"{WHATSAPP_GATEWAY_URL}/instance/contacts", params={"instanceId": str(instance.id)}, timeout=5)
            log_api_request(request, "Success: fetched contacts", 200, "/api/v1/whatsapp/contacts/")
            return Response(res.json())
        except Exception as e:
            log_api_request(request, f"Failure: {str(e)}", 500, "/api/v1/whatsapp/contacts/")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetGroupsView(BaseDeveloperAPIView):

    def get(self, request):
        instance = request.whatsapp_instance
        try:
            if instance.instance_type == 'meta':
                return Response({'success': True, 'groups': []})
            from .utils import WHATSAPP_GATEWAY_URL
            res = requests.get(f"{WHATSAPP_GATEWAY_URL}/instance/groups", params={"instanceId": str(instance.id)}, timeout=5)
            log_api_request(request, "Success: fetched groups", 200, "/api/v1/whatsapp/groups/")
            return Response(res.json())
        except Exception as e:
            log_api_request(request, f"Failure: {str(e)}", 500, "/api/v1/whatsapp/groups/")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DeveloperLogoutView(BaseDeveloperAPIView):

    def post(self, request):
        instance = request.whatsapp_instance
        if instance.instance_type != 'web_qr':
            return Response({'error': 'Only web_qr instances can log out.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            logout_web_instance(instance.id)
            instance.status = 'disconnected'
            instance.qr_code = None
            instance.phone_number = None
            instance.save()
            log_api_request(request, "Success: logged out", 200, "/api/v1/whatsapp/logout/")
            return Response({'status': 'logged_out'})
        except Exception as e:
            log_api_request(request, f"Failure: {str(e)}", 500, "/api/v1/whatsapp/logout/")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DeveloperRestartView(BaseDeveloperAPIView):

    def post(self, request):
        instance = request.whatsapp_instance
        if instance.instance_type != 'web_qr':
            return Response({'error': 'Only web_qr instances require restart.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            init_web_instance(instance.id)
            instance.status = 'connecting'
            instance.save()
            log_api_request(request, "Success: restarted", 200, "/api/v1/whatsapp/restart/")
            return Response({'status': 'connecting'})
        except Exception as e:
            log_api_request(request, f"Failure: {str(e)}", 500, "/api/v1/whatsapp/restart/")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ----------------------------------------------------------------------
# Admin Control Views (Staff/Superusers Only)
# ----------------------------------------------------------------------

from django.db.models import Q, Sum
from django.utils import timezone

class AdminOverviewStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        clients_count = User.objects.filter(is_staff=False).count()
        active_sessions = WhatsAppInstance.objects.filter(status='connected').count()
        
        today = timezone.now().date()
        sent_messages_today = Message.objects.filter(direction='outbound', created_at__date=today).count()
        
        from apps.billing.models import Invoice
        start_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0)
        revenue_sum = Invoice.objects.filter(status='paid', created_at__gte=start_of_month).aggregate(total=Sum('amount'))['total'] or 0.0
        
        open_tickets = SupportTicket.objects.filter(status='open').count()
        new_clients = User.objects.filter(is_staff=False, date_joined__date=today).count()

        return Response({
            'clients_count': clients_count,
            'active_sessions': active_sessions,
            'sent_messages_today': sent_messages_today,
            'monthly_revenue': revenue_sum,
            'open_tickets': open_tickets,
            'new_clients': new_clients
        })


class AdminClientViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]
    from django.contrib.auth import get_user_model
    User = get_user_model()
    from apps.accounts.serializers import UserSerializer
    serializer_class = UserSerializer
    queryset = User.objects.filter(is_staff=False).order_by('-date_joined')

    @action(detail=True, methods=['post'], url_path='suspend')
    def suspend(self, request, pk=None):
        client = self.get_object()
        client.is_active = False
        client.save()
        return Response({'status': 'suspended'})

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        client = self.get_object()
        client.is_active = True
        client.save()
        return Response({'status': 'activated'})

    @action(detail=True, methods=['post'], url_path='login-as')
    def login_as(self, request, pk=None):
        client = self.get_object()
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(client)
        return Response({
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'user': self.get_serializer(client).data
        })


class AdminSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = WhatsAppInstanceSerializer
    queryset = WhatsAppInstance.objects.all().order_by('-created_at')

    @action(detail=True, methods=['post'], url_path='terminate')
    def terminate(self, request, pk=None):
        instance = self.get_object()
        if instance.instance_type == 'web_qr':
            try:
                logout_web_instance(instance.id)
            except Exception:
                pass
        instance.status = 'disconnected'
        instance.qr_code = None
        instance.save()
        return Response({'status': 'terminated'})


class AdminAgreementViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AgreementSerializer
    queryset = Agreement.objects.all().order_by('-created_at')

    @action(detail=False, methods=['get'], url_path='signatures')
    def signatures(self, request):
        sigs = ConsentSignature.objects.all().order_by('-timestamp')
        return Response(ConsentSignatureSerializer(sigs, many=True).data)

    @action(detail=True, methods=['get'], url_path='signatures/pdf')
    def signatures_pdf(self, request, pk=None):
        agreement = self.get_object()
        sigs = ConsentSignature.objects.filter(agreement=agreement).order_by('-timestamp')
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="consent_report_{agreement.id}.pdf"'
        
        response.write(f"%PDF-1.4\n")
        response.write(f"1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n")
        response.write(f"2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n")
        response.write(f"3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R>> endobj\n")
        response.write(f"4 0 obj <</Length 500>> stream\n")
        response.write(f"BT\n/F1 12 Tf\n70 750 Td\n(AGREEMENT CONSENT SIGNATURE REPORT: {agreement.title.upper()}) Tj\n")
        for s in sigs[:15]:
            response.write(f"0 -25 Td\n({s.timestamp.strftime('%Y-%m-%d')} - {s.full_name} ({s.email}) - IP: {s.ip_address}) Tj\n")
        response.write(f"ET\nendstream\nendobj\n")
        response.write(f"trailer <</Size 5 /Root 1 0 R>>\n%%EOF\n")
        return response


class AdminNotificationView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        user_id = request.data.get('user_id')
        title = request.data.get('title')
        content = request.data.get('content')
        notif_type = request.data.get('type', 'update')
        
        if not title or not content:
            return Response({'error': 'Title and content are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        recipient_user = None
        if user_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            recipient_user = get_object_or_404(User, pk=user_id)
            
        notif = Notification.objects.create(
            user=recipient_user,
            title=title,
            content=content,
            type=notif_type
        )
        return Response(NotificationSerializer(notif).data, status=status.HTTP_201_CREATED)

class MetaCloudAPICallbackView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        device_name = request.data.get('device_name', 'Meta API Device')
        code = request.data.get('code')
        waba_id = request.data.get('waba_id')
        phone_number_id = request.data.get('phone_number_id')
        business_id = request.data.get('business_id')

        if not all([code, phone_number_id]):
            return Response({'error': 'Missing required fields (code or phone_number_id)'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already connected by this user
        if WhatsAppInstance.objects.filter(user=request.user, phone_number_id=phone_number_id).exists():
            return Response({'error': 'هذا الرقم مربوط بالفعل في حسابك.'}, status=status.HTTP_400_BAD_REQUEST)

        # Exchange code for access token
        app_id = getattr(settings, 'META_APP_ID', None)
        app_secret = getattr(settings, 'META_APP_SECRET', None)
        
        if not app_id or not app_secret:
            return Response({'error': 'Meta App credentials are not configured in backend.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        token_url = f"https://graph.facebook.com/v20.0/oauth/access_token"
        token_params = {
            'client_id': app_id,
            'client_secret': app_secret,
            'code': code
        }
        
        token_res = requests.get(token_url, params=token_params)
        if not token_res.ok:
            logger.error(f"Failed to exchange code: {token_res.text}")
            return Response({'error': 'Failed to exchange Meta code for token'}, status=status.HTTP_400_BAD_REQUEST)

        token_data = token_res.json()
        access_token = token_data.get('access_token')
        
        if not access_token:
            return Response({'error': 'No access token in Meta response'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch phone number details
        phone_url = f"https://graph.facebook.com/v20.0/{phone_number_id}"
        phone_params = {
            'access_token': access_token,
            'fields': 'display_phone_number,verified_name,quality_rating,status'
        }
        phone_res = requests.get(phone_url, params=phone_params)
        
        display_phone_number = None
        verified_name = None
        quality_rating = None
        cloud_status = None
        
        if phone_res.ok:
            phone_data = phone_res.json()
            display_phone_number = phone_data.get('display_phone_number')
            verified_name = phone_data.get('verified_name')
            quality_rating = phone_data.get('quality_rating')
            cloud_status = phone_data.get('status')
            
            if display_phone_number:
                # clean formatting spaces/dashes for internal storage
                display_phone_number = ''.join(filter(str.isdigit, display_phone_number))

        # Save Instance
        instance = WhatsAppInstance.objects.create(
            user=request.user,
            instance_name=device_name,
            instance_type='meta',
            status='connected',
            phone_number_id=phone_number_id,
            waba_id=waba_id,
            business_id=business_id,
            access_token=access_token,
            phone_number=display_phone_number,
            display_name=verified_name,
            quality_rating=quality_rating,
            cloud_api_status=cloud_status,
            embedded_signup_completed=True
        )

        return Response(WhatsAppInstanceSerializer(instance).data, status=status.HTTP_201_CREATED)

class ManualMetaConnectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        device_name = request.data.get('device_name', 'Meta API Device')
        phone_number_id = request.data.get('phone_number_id')
        waba_id = request.data.get('waba_id')
        business_id = request.data.get('business_id', '')
        access_token = request.data.get('access_token')
        
        if not all([phone_number_id, access_token]):
            return Response({'error': 'Missing required fields (phone_number_id, access_token)'}, status=status.HTTP_400_BAD_REQUEST)

        if WhatsAppInstance.objects.filter(user=request.user, phone_number_id=phone_number_id).exists():
            return Response({'error': 'هذا الرقم مربوط بالفعل في حسابك.'}, status=status.HTTP_400_BAD_REQUEST)

        # Attempt to fetch phone number details directly
        phone_url = f"https://graph.facebook.com/v20.0/{phone_number_id}"
        phone_params = {
            'access_token': access_token,
            'fields': 'display_phone_number,verified_name,quality_rating,status'
        }
        phone_res = requests.get(phone_url, params=phone_params)
        
        display_phone_number = None
        verified_name = None
        quality_rating = None
        cloud_status = None
        
        if phone_res.ok:
            phone_data = phone_res.json()
            display_phone_number = phone_data.get('display_phone_number')
            verified_name = phone_data.get('verified_name')
            quality_rating = phone_data.get('quality_rating')
            cloud_status = phone_data.get('status')
            
            if display_phone_number:
                display_phone_number = ''.join(filter(str.isdigit, display_phone_number))
        else:
            logger.warning(f"Failed to fetch phone data manually: {phone_res.text}")

        instance = WhatsAppInstance.objects.create(
            user=request.user,
            instance_name=device_name,
            instance_type='meta',
            status='connected',
            phone_number_id=phone_number_id,
            waba_id=waba_id,
            business_id=business_id,
            access_token=access_token,
            phone_number=display_phone_number,
            display_name=verified_name,
            quality_rating=quality_rating,
            cloud_api_status=cloud_status,
            embedded_signup_completed=False  # manual
        )

        return Response(WhatsAppInstanceSerializer(instance).data, status=status.HTTP_201_CREATED)

