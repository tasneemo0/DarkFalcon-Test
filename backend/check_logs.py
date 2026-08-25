import os
import sys
import django

sys.stdout.reconfigure(encoding='utf-8')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'darkfalcon.settings')
django.setup()

from apps.whatsapp.models import Message, WhatsAppInstance, Booking, APILog

print("=== ALL MESSAGES ===")
for m in Message.objects.all().order_by('-id'):
    print(f"ID: {m.id} | Dir: {m.direction} | Recipient: {m.recipient_phone} | Status: {m.status} | Created: {m.created_at}")
    print(f"  Payload: {m.payload}")
    if m.error_message:
        print(f"  Error: {m.error_message}")

print("\n=== ALL API LOGS ===")
for log in APILog.objects.all().order_by('-id')[:20]:
    print(f"ID: {log.id} | Endpoint: {log.endpoint} | Method: {log.method} | Code: {log.status_code} | Created: {log.created_at}")
    print(f"  Outcome: {log.outcome}")
