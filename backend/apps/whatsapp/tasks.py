from celery import shared_task
import logging
import requests
import json
from .models import Message, WhatsAppInstance, WhatsAppTemplate, FAQRule
from .serializers import WhatsAppTemplateSerializer
from .utils import send_meta_whatsapp_message, sync_meta_templates, send_web_whatsapp_message

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def send_whatsapp_message_task(self, message_id):
    """
    Celery task to send WhatsApp message asynchronously via Meta Cloud API or Web Gateway.
    """
    try:
        msg = Message.objects.select_related('instance').get(pk=message_id)
    except Message.DoesNotExist:
        logger.error(f"Message ID {message_id} not found in database.")
        return

    instance = msg.instance
    try:
        if instance.instance_type == 'meta':
            meta_msg_id = send_meta_whatsapp_message(
                phone_number_id=instance.phone_number_id,
                access_token=instance.access_token,
                recipient_phone=msg.recipient_phone,
                message_type=msg.message_type,
                payload_data=msg.payload
            )
            if meta_msg_id:
                msg.message_id = meta_msg_id
                msg.status = 'sent'
                msg.save()
        else:
            # Web QR instance
            gateway_msg_id = send_web_whatsapp_message(
                instance_id=instance.id,
                recipient_phone=msg.recipient_phone,
                text=msg.payload.get('body', ''),
                message_type=msg.message_type,
                media_url=msg.payload.get('link'),
                filename=msg.payload.get('filename'),
                caption=msg.payload.get('caption')
            )
            if gateway_msg_id:
                msg.message_id = gateway_msg_id
                msg.status = 'sent'
                msg.save()
        logger.info(f"Asynchronously sent message {message_id} successfully.")
    except Exception as e:
        logger.warning(f"Error sending message {message_id}: {str(e)}. Retrying...")
        try:
            self.retry(exc=e, countdown=60)
        except self.MaxRetriesExceededError:
            msg.status = 'failed'
            msg.error_message = f"Max retries exceeded. Error: {str(e)}"
            msg.save()
            logger.error(f"Max retries exceeded for message {message_id}.")

@shared_task
def sync_waba_templates_task(instance_id):
    """
    Celery task to sync templates from Meta.
    """
    try:
        instance = WhatsAppInstance.objects.get(pk=instance_id)
    except WhatsAppInstance.DoesNotExist:
        logger.error(f"WhatsAppInstance {instance_id} not found.")
        return

    try:
        templates_data = sync_meta_templates(instance.waba_id, instance.access_token)
        synced_count = 0
        for t_data in templates_data:
            WhatsAppTemplate.objects.update_or_create(
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
        logger.info(f"Successfully synced {synced_count} templates for instance {instance_id} in background.")
        return synced_count
    except Exception as e:
        logger.exception(f"Failed to sync templates for instance {instance_id}")
        raise e

import re
from .models import Booking

@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def handle_inbound_message_task(self, instance_id, sender_phone, message_text):
    """
    Background worker to handle inbound messages and run Auto-Reply bot logic (Booking state machine, AI, or FAQ rules).
    """
    logger.info(f"[BOT] handle_inbound_message_task called: instance={instance_id}, sender={sender_phone}, text='{message_text}'")
    try:
        instance = WhatsAppInstance.objects.get(pk=instance_id)
    except WhatsAppInstance.DoesNotExist:
        logger.error(f"[BOT] WhatsAppInstance {instance_id} not found.")
        return

    logger.info(f"[BOT] Instance {instance_id} bot_mode={instance.bot_mode}")
    if instance.bot_mode == 'off':
        return

    clean_text = message_text.strip().lower()
    
    # ----------------------------------------------------------------------
    # 1. CHECK ACTIVE BOOKING SESSION
    # ----------------------------------------------------------------------
    active_booking = Booking.objects.filter(instance=instance, customer_phone=sender_phone, status='pending').first()
    
    if active_booking:
        # User is in active booking flow, capture response
        step = active_booking.current_step
        logger.info(f"[BOT-BOOKING] User response for active booking step {step}: '{message_text}'")
        
        reply_text = None
        if step == 0:
            # Save name
            active_booking.name = message_text.strip()
            active_booking.current_step = 1
            active_booking.save()
            reply_text = "الرجاء كتابة رقم الجوال الخاص بك:"
        elif step == 1:
            # Save phone
            active_booking.phone = message_text.strip()
            active_booking.current_step = 2
            active_booking.save()
            reply_text = "الرجاء كتابة العنوان الخاص بك بالتفصيل:"
        elif step == 2:
            # Save address
            active_booking.address = message_text.strip()
            active_booking.current_step = 3
            active_booking.save()
            reply_text = "الرجاء كتابة العمر (أو اكتب 'تخطي' للتجاوز):"
        elif step == 3:
            # Save age & complete
            age_val = message_text.strip()
            if age_val.lower() not in ['تخطي', 'skip']:
                active_booking.age = age_val
            active_booking.current_step = 4
            active_booking.status = 'completed'
            active_booking.save()
            
            reply_text = (
                f"تم تسجيل حجزك بنجاح! شكراً لك.\n\n"
                f"📝 تفاصيل الحجز:\n"
                f"• الاسم: {active_booking.name}\n"
                f"• الرقم: {active_booking.phone}\n"
                f"• العنوان: {active_booking.address}\n"
                f"• العمر: {active_booking.age or 'تخطي'}"
            )
            
        if reply_text:
            send_bot_reply(instance, sender_phone, reply_text)
        return

    # ----------------------------------------------------------------------
    # 2. CHECK INTERCEPT FOR BOOKING TRIGGER ("أريد حجز" / "book")
    # ----------------------------------------------------------------------
    booking_triggers = ["أريد حجز", "اريد حجز", "حجز", "book", "حجز موعد"]
    if any(trigger in clean_text for trigger in booking_triggers):
        # Initiate booking flow
        Booking.objects.create(
            instance=instance,
            customer_phone=sender_phone,
            current_step=0,
            status='pending'
        )
        send_bot_reply(instance, sender_phone, "مرحباً بك في نظام الحجوزات التلقائي. يرجى كتابة الاسم الرباعي الخاص بك:")
        return

    # ----------------------------------------------------------------------
    # 3. CUSTOM Q&A / FAQ MATCHING RULES (bot_mode = 'qa')
    # ----------------------------------------------------------------------
    if instance.bot_mode == 'qa':
        rules = FAQRule.objects.filter(instance=instance, is_active=True)
        matched_rule = None
        
        for rule in rules:
            keyword = rule.keyword.strip().lower()
            mtype = rule.matching_type
            
            is_match = False
            if mtype == 'exact':
                is_match = (clean_text == keyword)
            elif mtype == 'contains':
                is_match = (keyword in clean_text)
            elif mtype == 'starts_with':
                is_match = clean_text.startswith(keyword)
            elif mtype == 'ends_with':
                is_match = clean_text.endswith(keyword)
            elif mtype == 'regex':
                try:
                    is_match = bool(re.search(rule.keyword, message_text, re.IGNORECASE))
                except Exception:
                    is_match = False
                    
            if is_match:
                matched_rule = rule
                break
                
        if matched_rule:
            action = matched_rule.action_type
            answer = matched_rule.answer
            payload = matched_rule.action_payload
            
            logger.info(f"[BOT] Rule matched: keyword='{matched_rule.keyword}' action='{action}'")
            
            if action == 'text':
                send_bot_reply(instance, sender_phone, answer)
            elif action == 'handover':
                send_bot_reply(instance, sender_phone, "تم تحويلك للموظف المختص. سيتم التواصل معك قريباً.")
            elif action in ['image', 'file']:
                # Action payload contains media URL
                media_url = payload or answer
                send_bot_media_reply(instance, sender_phone, action, media_url, caption=answer)
            elif action == 'buttons':
                try:
                    buttons_list = json.loads(payload)
                except Exception:
                    buttons_list = [btn.strip() for btn in payload.split(',') if btn.strip()]
                send_bot_buttons_reply(instance, sender_phone, answer, buttons_list)
            elif action == 'list':
                try:
                    sections_list = json.loads(payload)
                except Exception:
                    sections_list = []
                send_bot_list_reply(instance, sender_phone, answer, sections_list)
            return

    # ----------------------------------------------------------------------
    # 4. SMART AI RESPONDER (bot_mode = 'ai' using Gemini API)
    # ----------------------------------------------------------------------
    elif instance.bot_mode == 'ai':
        api_key = instance.ai_api_key or getattr(instance.user.profile, 'ai_api_key', None)
        if not api_key:
            logger.warning(f"[BOT-AI] No API Key provided for instance {instance_id}")
            return

        provider = instance.ai_provider or 'gemini'
        model_name = instance.ai_model or 'gemini-2.5-flash'
        prompt = instance.ai_prompt or "You are a helpful customer service representative."
        
        system_instruction = (
            f"You are an AI assistant for a business. Here is the information about the business:\n"
            f"{prompt}\n\n"
            f"Answer the user's question politely and accurately based on the business information above. "
            f"Keep the response short, professional, and friendly. Do not make up information. "
            f"If you do not know the answer, say that you cannot find this information and offer to connect them with a human agent."
        )

        reply_text = None
        try:
            if provider == 'gemini':
                # Google Gemini API
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                headers = {'Content-Type': 'application/json'}
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"text": f"{system_instruction}\n\nUser Question: {message_text}\nAnswer:"}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "maxOutputTokens": 1000,
                        "temperature": 0.3
                    }
                }
                response = requests.post(url, json=payload, headers=headers, timeout=60)
                response.raise_for_status()
                res_data = response.json()
                candidates = res_data.get('candidates', [])
                if candidates:
                    candidate = candidates[0]
                    finish_reason = candidate.get('finishReason')
                    if finish_reason == 'SAFETY':
                        reply_text = "عذراً، لا يمكنني الإجابة على هذا السؤال بسبب قيود السلامة."
                    elif finish_reason == 'RECITATION':
                        reply_text = "عذراً، لم أتمكن من صياغة الإجابة بشكل مناسب."
                    else:
                        reply_text = candidate.get('content', {}).get('parts', [{}])[0].get('text', '').strip()

            elif provider == 'openai':
                # OpenAI API
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": message_text}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1000
                }
                response = requests.post(url, json=payload, headers=headers, timeout=15)
                response.raise_for_status()
                res_data = response.json()
                choices = res_data.get('choices', [])
                if choices:
                    reply_text = choices[0].get('message', {}).get('content', '').strip()

            elif provider == 'claude':
                # Anthropic Claude API
                url = "https://api.anthropic.com/v1/messages"
                headers = {
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": model_name,
                    "system": system_instruction,
                    "messages": [
                        {"role": "user", "content": message_text}
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.3
                }
                response = requests.post(url, json=payload, headers=headers, timeout=15)
                response.raise_for_status()
                res_data = response.json()
                content_parts = res_data.get('content', [])
                if content_parts:
                    reply_text = content_parts[0].get('text', '').strip()

            elif provider == 'deepseek':
                # DeepSeek API (OpenAI Compatible)
                url = "https://api.deepseek.com/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": message_text}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1000
                }
                response = requests.post(url, json=payload, headers=headers, timeout=15)
                response.raise_for_status()
                res_data = response.json()
                choices = res_data.get('choices', [])
                if choices:
                    reply_text = choices[0].get('message', {}).get('content', '').strip()

            elif provider == 'groq':
                # Groq API (OpenAI Compatible)
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": message_text}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1000
                }
                response = requests.post(url, json=payload, headers=headers, timeout=15)
                response.raise_for_status()
                res_data = response.json()
                choices = res_data.get('choices', [])
                if choices:
                    reply_text = choices[0].get('message', {}).get('content', '').strip()

            if reply_text:
                send_bot_reply(instance, sender_phone, reply_text)

        except Exception as e:
            logger.error(f"Error calling {provider.upper()} API for instance {instance_id}: {str(e)}. Retrying...")
            try:
                self.retry(exc=e)
            except Exception as retry_err:
                logger.error(f"Celery retry failed: {retry_err}")
            return


# ----------------------------------------------------------------------
# Helper functions for dispatching bot responses
# ----------------------------------------------------------------------

def send_bot_reply(instance, recipient_phone, text):
    outbound_msg = Message.objects.create(
        instance=instance,
        recipient_phone=recipient_phone,
        message_type='text',
        direction='outbound',
        status='sending',
        payload={'body': text}
    )
    try:
        if instance.instance_type == 'meta':
            meta_msg_id = send_meta_whatsapp_message(
                phone_number_id=instance.phone_number_id,
                access_token=instance.access_token,
                recipient_phone=recipient_phone,
                message_type='text',
                payload_data={'body': text}
            )
            if meta_msg_id:
                outbound_msg.message_id = meta_msg_id
                outbound_msg.status = 'sent'
                outbound_msg.save()
                logger.info(f"[BOT] Meta reply sent successfully: {meta_msg_id}")
            else:
                logger.warning(f"[BOT] Meta reply returned no message_id")
        else:
            # Web QR instance - send directly via gateway
            gateway_msg_id = send_web_whatsapp_message(
                instance_id=instance.id,
                recipient_phone=recipient_phone,
                text=text,
                message_type='text'
            )
            if gateway_msg_id:
                outbound_msg.message_id = gateway_msg_id
                outbound_msg.status = 'sent'
                outbound_msg.save()
                logger.info(f"[BOT] Web QR reply sent successfully: {gateway_msg_id}")
            else:
                logger.warning(f"[BOT] Web QR reply returned no message_id")
    except Exception as e:
        logger.error(f"[BOT] Failed to send bot reply to {recipient_phone}: {e}")
        outbound_msg.status = 'failed'
        outbound_msg.error_message = str(e)
        outbound_msg.save()

def send_bot_media_reply(instance, recipient_phone, media_type, media_url, caption=''):
    outbound_msg = Message.objects.create(
        instance=instance,
        recipient_phone=recipient_phone,
        message_type=media_type,
        direction='outbound',
        status='sending',
        payload={'link': media_url, 'caption': caption, 'filename': media_type}
    )
    try:
        if instance.instance_type == 'meta':
            meta_msg_id = send_meta_whatsapp_message(
                phone_number_id=instance.phone_number_id,
                access_token=instance.access_token,
                recipient_phone=recipient_phone,
                message_type=media_type,
                payload_data={'link': media_url, 'caption': caption, 'filename': media_type}
            )
            if meta_msg_id:
                outbound_msg.message_id = meta_msg_id
                outbound_msg.status = 'sent'
                outbound_msg.save()
                logger.info(f"[BOT] Meta media reply sent: {meta_msg_id}")
        else:
            gateway_msg_id = send_web_whatsapp_message(
                instance_id=instance.id,
                recipient_phone=recipient_phone,
                text=caption,
                message_type=media_type,
                media_url=media_url,
                filename=media_type,
                caption=caption
            )
            if gateway_msg_id:
                outbound_msg.message_id = gateway_msg_id
                outbound_msg.status = 'sent'
                outbound_msg.save()
                logger.info(f"[BOT] Web QR media reply sent: {gateway_msg_id}")
    except Exception as e:
        logger.error(f"[BOT] Failed to send bot media reply to {recipient_phone}: {e}")
        outbound_msg.status = 'failed'
        outbound_msg.error_message = str(e)
        outbound_msg.save()

def send_bot_buttons_reply(instance, recipient_phone, text, buttons):
    outbound_msg = Message.objects.create(
        instance=instance,
        recipient_phone=recipient_phone,
        message_type='buttons',
        direction='outbound',
        status='sending',
        payload={'body': text, 'buttons': buttons}
    )
    try:
        # Send immediately since buttons is a specialized type
        if instance.instance_type == 'web_qr':
            send_web_whatsapp_message(instance.id, recipient_phone, text, 'buttons', buttons=buttons)
            outbound_msg.status = 'sent'
            outbound_msg.save()
        else:
            send_bot_reply(instance, recipient_phone, text + "\n" + ", ".join(buttons))
    except Exception as e:
        logger.error(f"Failed to send bot buttons reply: {e}")

def send_bot_list_reply(instance, recipient_phone, text, sections):
    outbound_msg = Message.objects.create(
        instance=instance,
        recipient_phone=recipient_phone,
        message_type='list',
        direction='outbound',
        status='sending',
        payload={'body': text, 'sections': sections}
    )
    try:
        if instance.instance_type == 'web_qr':
            send_web_whatsapp_message(instance.id, recipient_phone, text, 'list', sections=sections)
            outbound_msg.status = 'sent'
            outbound_msg.save()
        else:
            send_bot_reply(instance, recipient_phone, text)
    except Exception as e:
        logger.error(f"Failed to send bot list reply: {e}")
