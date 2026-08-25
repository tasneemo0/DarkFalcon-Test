import os
import sys
import django

sys.stdout.reconfigure(encoding='utf-8')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'darkfalcon.settings')
django.setup()

from apps.whatsapp.models import Message, WhatsAppInstance, Booking

print("=== LATEST 20 MESSAGES ===")
for m in Message.objects.order_by('-id')[:20]:
    print(f"ID: {m.id} | Dir: {m.direction} | Recipient: {m.recipient_phone} | Status: {m.status} | Created: {m.created_at}")
    print(f"  Payload: {m.payload}")

print("\n=== LATEST BOOKINGS ===")
for b in Booking.objects.order_by('-id')[:10]:
    print(f"ID: {b.id} | Cust Phone: {b.customer_phone} | Name: {b.name} | Phone field: {b.phone} | Step: {b.current_step} | Status: {b.status}")

print("\n=== INSTANCES ===")
for inst in WhatsAppInstance.objects.all():
    print(f"ID: {inst.id} | Name: {inst.instance_name} | Type: {inst.instance_type} | Status: {inst.status} | Phone: {inst.phone_number} | Bot Mode: {inst.bot_mode}")
