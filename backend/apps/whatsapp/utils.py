import requests
import logging
import os

logger = logging.getLogger(__name__)

WHATSAPP_GATEWAY_URL = os.getenv('WHATSAPP_GATEWAY_URL', 'http://localhost:4000')
def send_meta_whatsapp_message(phone_number_id, access_token, recipient_phone, message_type, payload_data):
    """
    Synchronous helper to send a WhatsApp message via Meta Cloud API.
    Returns the meta message_id on success, or raises requests.HTTPError/Exception.
    """
    url = f"https://graph.facebook.com/v20.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # Format payload based on Meta Cloud API specs
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient_phone,
        "type": message_type,
    }

    if message_type == 'text':
        payload['text'] = {
            "preview_url": payload_data.get('preview_url', False),
            "body": payload_data.get('body')
        }
    elif message_type == 'template':
        payload['template'] = {
            "name": payload_data.get('name'),
            "language": {
                "code": payload_data.get('language_code', 'en')
            }
        }
        if 'components' in payload_data:
            payload['template']['components'] = payload_data.get('components')
    elif message_type == 'image':
        payload['image'] = {
            "link": payload_data.get('link'),
            "caption": payload_data.get('caption', '')
        }
    elif message_type == 'document':
        payload['document'] = {
            "link": payload_data.get('link'),
            "filename": payload_data.get('filename', 'document'),
            "caption": payload_data.get('caption', '')
        }
    else:
        # Fallback to direct raw payload if passed
        payload.update(payload_data)

    logger.info(f"Sending Meta message to {recipient_phone} via PhoneID {phone_number_id}")
    response = requests.post(url, json=payload, headers=headers, timeout=15)
    
    if response.status_code >= 400:
        logger.error(f"Meta API Error: {response.text}")
        response.raise_for_status()
        
    res_data = response.json()
    messages = res_data.get('messages', [])
    if messages:
        return messages[0].get('id')
    return None

def sync_meta_templates(waba_id, access_token):
    """
    Fetch all templates from Meta WhatsApp Business Account.
    """
    url = f"https://graph.facebook.com/v20.0/{waba_id}/message_templates"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(url, headers=headers, timeout=15)
    if response.status_code >= 400:
        logger.error(f"Meta WABA Templates Error: {response.text}")
        response.raise_for_status()
        
    return response.json().get('data', [])

def init_web_instance(instance_id):
    """
    Start/initiate WhatsApp session on Node.js gateway
    """
    url = f"{WHATSAPP_GATEWAY_URL}/instance/init"
    try:
        response = requests.post(url, json={"instanceId": str(instance_id)}, timeout=10)
        return response.json()
    except Exception as e:
        logger.error(f"Failed to init web instance: {e}")
        raise e

def logout_web_instance(instance_id):
    """
    Log out and clean up session from Node.js gateway
    """
    url = f"{WHATSAPP_GATEWAY_URL}/instance/logout"
    try:
        response = requests.post(url, json={"instanceId": str(instance_id)}, timeout=10)
        return response.json()
    except Exception as e:
        logger.error(f"Failed to logout web instance: {e}")
        raise e

def send_web_whatsapp_message(instance_id, recipient_phone, text, message_type='text', media_url=None, filename=None, caption=None, **kwargs):
    """
    Send message via Node.js WhatsApp gateway (QR/Web session)
    """
    url = f"{WHATSAPP_GATEWAY_URL}/instance/send"
    payload = {
        "instanceId": str(instance_id),
        "to": recipient_phone,
        "text": text,
        "type": message_type,
        "mediaUrl": media_url,
        "filename": filename,
        "caption": caption
    }
    payload.update(kwargs)
    try:
        response = requests.post(url, json=payload, timeout=15)
        res_data = response.json()
        if response.status_code >= 400 or 'error' in res_data:
            raise Exception(res_data.get('error', 'Unknown gateway error'))
        return res_data.get('messageId')
    except Exception as e:
        logger.error(f"Failed to send web WhatsApp message: {e}")
        raise e

def extract_country_code(phone):
    """
    Extract country code from clean phone digits using ITU-T E.164 specifications.
    """
    if not phone:
        return ""
    phone = str(phone)
    if phone.startswith('1'):
        return '1'
    # Check common 2-digit country codes
    for prefix in ['20', '27', '30', '31', '32', '33', '34', '36', '39', '40', 
                  '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', 
                  '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', 
                  '63', '64', '65', '66', '81', '82', '84', '86', '90', '91', 
                  '92', '93', '94', '95', '98']:
        if phone.startswith(prefix):
            return prefix
    # Default fallback to first 3 digits
    if len(phone) >= 3:
        return phone[:3]
    return ""

def normalize_whatsapp_phone(phone, instance=None):
    """
    Normalize WhatsApp JID phone numbers to standard format:
    1. Strip any domain suffixes (e.g. @s.whatsapp.net).
    2. Retain digits only.
    3. Strip leading double zero (00) if present.
    4. Handle local number format (starts with single '0' followed by digits)
       by prefixing the instance's resolved country code if available.
    5. Colombia quirk: converts 5705... (14 digits) -> 573... (13 digits).
    6. Mexico quirk: converts 521... (13 digits) -> 52... (12 digits).
    7. Argentina quirk: converts 549... (13 digits) -> 54... (12 digits).
    """
    if not phone:
        return ""
    phone_str = str(phone)
    if '@' in phone_str:
        phone_str = phone_str.split('@')[0]
    
    # Strip non-digits
    phone_str = ''.join(c for c in phone_str if c.isdigit())
    
    # Strip leading 00
    if phone_str.startswith('00'):
        phone_str = phone_str[2:]
        
    # Handle local format (starts with single 0)
    if phone_str.startswith('0') and not phone_str.startswith('00') and instance:
        # Resolve instance number
        inst_phone = getattr(instance, 'phone_number', '') or getattr(instance, 'phone_number_id', '')
        if inst_phone:
            inst_phone_clean = ''.join(c for c in str(inst_phone) if c.isdigit())
            country_code = extract_country_code(inst_phone_clean)
            if country_code:
                # Prepend country code and strip the leading '0'
                phone_str = country_code + phone_str[1:]
                
    # Normalize country-specific quirks:
    # Colombia: 57 + 05 + 8 digits -> 57 + 3 + 8 digits (14 digits -> 13 digits)
    if phone_str.startswith('5705') and len(phone_str) == 14:
        phone_str = '573' + phone_str[4:]
    # Mexico: 52 + 1 + 10 digits -> 52 + 10 digits (13 digits -> 12 digits)
    elif phone_str.startswith('521') and len(phone_str) == 13:
        phone_str = '52' + phone_str[3:]
    # Argentina: 54 + 9 + 10 digits -> 54 + 10 digits (13 digits -> 12 digits)
    elif phone_str.startswith('549') and len(phone_str) == 13:
        phone_str = '54' + phone_str[3:]
        
    return phone_str


