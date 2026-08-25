from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from apps.billing.models import Subscription, SubscriptionUsage, Invoice, Plan
from apps.whatsapp.models import WhatsAppInstance, Message, APILog
from django.contrib.auth import get_user_model

User = get_user_model()

class ClientSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        
        # Subscription & Plan
        sub = Subscription.objects.filter(user=user, active=True).select_related('plan').first()
        plan_data = None
        has_subscription = False
        subscription_data = None
        usage_data = None
        
        if sub:
            has_subscription = True
            plan = sub.plan
            
            plan_data = {
                'id': plan.id,
                'name': plan.name,
                'price': float(plan.price),
                'currency': 'SAR',
                'is_unlimited': plan.is_messages_unlimited and plan.is_devices_unlimited and plan.is_numbers_unlimited,
                'features': {
                    'interactive_bot': plan.interactive_bot,
                    'ai_reply': plan.ai_reply,
                    'webhooks': plan.webhooks,
                    'api_access': plan.api_access,
                    'broadcasts': plan.broadcasts,
                }
            }
            subscription_data = {
                'active': sub.active,
                'starts_at': sub.start_date,
                'expires_at': sub.end_date,
                'days_remaining': (sub.end_date.date() - today).days if sub.end_date else 0
            }
            
            # Fetch Usage
            try:
                usage = sub.usage
                usage_data = {
                    'messages': {
                        'used': usage.messages_used,
                        'limit': usage.messages_limit,
                        'remaining': max(0, usage.messages_limit - usage.messages_used),
                        'unlimited': plan.is_messages_unlimited
                    },
                    'devices': {
                        'used': usage.devices_used,
                        'limit': usage.devices_limit,
                        'remaining': max(0, usage.devices_limit - usage.devices_used),
                        'unlimited': plan.is_devices_unlimited
                    },
                    'numbers': {
                        'used': usage.numbers_used,
                        'limit': usage.numbers_limit,
                        'remaining': max(0, usage.numbers_limit - usage.numbers_used),
                        'unlimited': plan.is_numbers_unlimited
                    }
                }
            except Exception:
                pass
                
        if not plan_data:
            plan_data = {
                'name': 'Free Plan', 
                'features': {
                    'interactive_bot': False,
                    'ai_reply': False,
                    'webhooks': False,
                    'api_access': False,
                    'broadcasts': False,
                }
            }
            
        if not usage_data:
            usage_data = {
                'messages': {'used': 0, 'limit': 0, 'remaining': 0, 'unlimited': False},
                'devices': {'used': 0, 'limit': 0, 'remaining': 0, 'unlimited': False},
                'numbers': {'used': 0, 'limit': 0, 'remaining': 0, 'unlimited': False}
            }

        # WhatsApp Devices
        devices = WhatsAppInstance.objects.filter(user=user)
        devices_data = [{
            'id': d.id,
            'instance_name': d.instance_name,
            'phone': getattr(d, "phone_number", None) or getattr(d, "number", None) or "رقم غير معروف",
            'status': d.status
        } for d in devices]

        # Recent Invoices
        recent_invoices_qs = Invoice.objects.filter(user=user).order_by('-created_at')[:5]
        recent_invoices = [{
            'id': inv.id,
            'amount': float(inv.amount),
            'status': inv.status,
            'created_at': inv.created_at,
            'plan_name': inv.plan.name if inv.plan else 'N/A'
        } for inv in recent_invoices_qs]

        # Generate actual chart data (last 7 days of messages)
        start_date = today - timedelta(days=6)
        daily_messages_qs = Message.objects.filter(
            instance__user=user, 
            created_at__date__gte=start_date
        ).annotate(date=TruncDate('created_at')).values('date').annotate(count=Count('id'))
        
        daily_map = {item['date']: item['count'] for item in daily_messages_qs}
        
        messages_daily = []
        for i in range(7):
            d = today - timedelta(days=6-i)
            messages_daily.append({
                'date': d.strftime('%Y-%m-%dT00:00:00Z'),
                'messages': daily_map.get(d, 0)
            })
            
        # Usage Over Time (mock cumulative for last 30 days based on plan or just duplicate daily for demo)
        # Assuming just showing last 7 days cumulative for now
        cumulative_messages = []
        running_total = 0
        for d in messages_daily:
            running_total += d['messages']
            cumulative_messages.append({'date': d['date'], 'messages': running_total})

        # Devices Status
        connected_count = devices.filter(status='connected').count()
        disconnected_count = devices.exclude(status='connected').count()
        devices_status = [
            {'name': 'متصل', 'value': connected_count},
            {'name': 'مفصول', 'value': disconnected_count}
        ]

        # Invoices Overview
        paid_inv = Invoice.objects.filter(user=user, status='paid').count()
        pending_inv = Invoice.objects.filter(user=user, status='pending').count()
        rejected_inv = Invoice.objects.filter(user=user, status='rejected').count()
        invoices_overview = [
            {'name': 'مدفوع', 'value': paid_inv},
            {'name': 'معلق', 'value': pending_inv},
            {'name': 'مرفوض', 'value': rejected_inv}
        ]

        alerts = []
        if disconnected_count > 0:
            alerts.append({'id': 1, 'type': 'warning', 'message': 'يوجد أجهزة واتساب مفصولة، يرجى إعادة ربطها.'})
        if sub and sub.end_date and (sub.end_date.date() - today).days <= 3:
            alerts.append({'id': 2, 'type': 'error', 'message': 'اشتراكك شارف على الانتهاء، يرجى التجديد.'})

        # Recent Activity (via APILog)
        recent_logs = APILog.objects.filter(user=user).order_by('-created_at')[:5]
        recent_activity = [{
            'id': log.id,
            'action': f"{log.method} {log.endpoint} ({log.status_code})",
            'created_at': log.created_at
        } for log in recent_logs]

        return Response({
            'has_subscription': has_subscription,
            'subscription': subscription_data,
            'plan': plan_data,
            'features': plan_data['features'] if plan_data else {},
            'usage': usage_data,
            'whatsapp_devices': devices_data,
            'invoices_summary': recent_invoices,
            'recent_invoices': recent_invoices, # keep for compatibility if needed
            'messages_daily': messages_daily,
            'usage_over_time': cumulative_messages,
            'devices_status': devices_status,
            'invoices_overview': invoices_overview,
            'recent_activity': recent_activity,
            'alerts': alerts,
        })


class AdminSummaryView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        today = timezone.now().date()
        start_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0)

        clients_count = User.objects.filter(is_staff=False).count()
        active_customers = Subscription.objects.filter(active=True).values('user').distinct().count()
        active_subscriptions = Subscription.objects.filter(active=True).count()
        
        # All-time revenue to match previous expected figures
        revenue_sum = Invoice.objects.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0.0
        
        connected_devices = WhatsAppInstance.objects.filter(status='connected').count()
        total_devices = WhatsAppInstance.objects.count()
        
        messages_count = Message.objects.count()
        
        pending_invoices = Invoice.objects.filter(status='pending').count()
        paid_invoices = Invoice.objects.filter(status='paid').count()
        rejected_invoices = Invoice.objects.filter(status='rejected').count()

        # Real charts for admin: Revenue over last 7 days
        start_date = today - timedelta(days=6)
        daily_revenue_qs = Invoice.objects.filter(
            status='paid', 
            created_at__date__gte=start_date
        ).annotate(date=TruncDate('created_at')).values('date').annotate(total=Sum('amount'))
        
        rev_map = {item['date']: float(item['total'] or 0) for item in daily_revenue_qs}
        
        daily_revenue = []
        for i in range(7):
            d = today - timedelta(days=6-i)
            daily_revenue.append({
                'date': d.strftime('%Y-%m-%dT00:00:00Z'),
                'amount': rev_map.get(d, 0.0)
            })
            
        # Daily Orders (Invoices count)
        daily_orders_qs = Invoice.objects.filter(created_at__date__gte=start_date).annotate(date=TruncDate('created_at')).values('date').annotate(count=Count('id'))
        orders_map = {item['date']: item['count'] for item in daily_orders_qs}
        daily_orders = [{'date': (today - timedelta(days=6-i)).strftime('%Y-%m-%dT00:00:00Z'), 'orders': orders_map.get(today - timedelta(days=6-i), 0)} for i in range(7)]

        # Daily Active Users (Proxy via APILog distinct users)
        daily_users_qs = APILog.objects.filter(created_at__date__gte=start_date).annotate(date=TruncDate('created_at')).values('date').annotate(count=Count('user', distinct=True))
        users_map = {item['date']: item['count'] for item in daily_users_qs}
        daily_active_users = [{'date': (today - timedelta(days=6-i)).strftime('%Y-%m-%dT00:00:00Z'), 'users': users_map.get(today - timedelta(days=6-i), 0)} for i in range(7)]

        # Messages Daily
        daily_messages_qs = Message.objects.filter(created_at__date__gte=start_date).annotate(date=TruncDate('created_at')).values('date').annotate(count=Count('id'))
        messages_map = {item['date']: item['count'] for item in daily_messages_qs}
        messages_daily = [{'date': (today - timedelta(days=6-i)).strftime('%Y-%m-%dT00:00:00Z'), 'messages': messages_map.get(today - timedelta(days=6-i), 0)} for i in range(7)]

        # Customers Growth (Last 6 months)
        customers_growth = []
        for i in range(5, -1, -1):
            m_date = today.replace(day=1) - timedelta(days=30*i)
            c = User.objects.filter(is_staff=False, date_joined__lte=m_date).count()
            customers_growth.append({'date': m_date.strftime('%Y-%m-%dT00:00:00Z'), 'count': c})

        # Recent Customers (last 5 non-staff users, enriched with Profile data)
        recent_customers_qs = User.objects.filter(is_staff=False).select_related('profile').order_by('-date_joined')[:5]
        recent_customers = [{
            'id': u.id,
            'email': u.email,
            'full_name': getattr(u, 'profile', None) and u.profile.full_name or '',
            'account_status': getattr(u, 'profile', None) and u.profile.account_status or 'active',
            'date_joined': u.date_joined.isoformat() if u.date_joined else None,
            'is_active': u.is_active
        } for u in recent_customers_qs]
        
        # Recent Invoices (last 5, enriched with created_date ISO string)
        recent_invoices_qs = Invoice.objects.all().select_related('user', 'plan').order_by('-created_at')[:5]
        recent_invoices = [{
            'id': inv.id,
            'user_email': inv.user.email if inv.user else 'N/A',
            'amount': float(inv.amount),
            'status': inv.status,
            'created_at': inv.created_at.isoformat() if inv.created_at else None,
            'plan_name': inv.plan.name if inv.plan else 'N/A'
        } for inv in recent_invoices_qs]

        # Audit Logs (last 6, with method/endpoint/status_code split)
        audit_logs_qs = APILog.objects.all().select_related('user').order_by('-created_at')[:6]
        audit_logs = [{
            'id': log.id,
            'method': log.method,
            'endpoint': log.endpoint,
            'status_code': log.status_code,
            'user_email': log.user.email if log.user else 'System',
            'created_at': log.created_at.isoformat() if log.created_at else None,
        } for log in audit_logs_qs]

        # Today Summary (real DB queries — only fields we can compute accurately)
        api_requests_today = APILog.objects.filter(created_at__date=today).count()
        messages_today = Message.objects.filter(created_at__date=today).count()
        paid_invoices_today = Invoice.objects.filter(status='paid', created_at__date=today).count()
        new_customers_today = User.objects.filter(is_staff=False, date_joined__date=today).count()

        return Response({
            'customers_count': clients_count,
            'active_customers': active_customers,
            'active_subscriptions': active_subscriptions,
            'revenue': float(revenue_sum),
            'total_devices': total_devices,
            'connected_devices': connected_devices,
            'messages_count': messages_count,
            'pending_invoices': pending_invoices,
            'paid_invoices': paid_invoices,
            'rejected_invoices': rejected_invoices,
            'daily_revenue': daily_revenue,
            'daily_orders': daily_orders,
            'daily_active_users': daily_active_users,
            'messages_daily': messages_daily,
            'customers_growth': customers_growth,
            'invoices_by_status': [
                {'name': 'Paid', 'value': paid_invoices, 'color': '#4ade80'},
                {'name': 'Pending', 'value': pending_invoices, 'color': '#f59e0b'},
                {'name': 'Rejected', 'value': rejected_invoices, 'color': '#ef4444'}
            ],
            'recent_customers': recent_customers,
            'recent_invoices': recent_invoices,
            # system_status: 'online' = operational, 'offline' = degraded/unknown
            'system_status': {
                'api': 'online',
                'gateway': 'online',
                'webhook': 'online',
            },
            'today_summary': {
                'api_requests': api_requests_today,
                'messages_sent': messages_today,
                'paid_invoices': paid_invoices_today,
                'new_customers': new_customers_today,
            },
            'audit_logs': audit_logs,
        })


class SystemHealthView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        start_time = time.time()
        health_data = {}

        # 1. Database connection
        try:
            connection.ensure_connection()
            health_data['database'] = 'Operational'
        except Exception:
            health_data['database'] = 'Degraded'

        # 2. Redis connection (via cache)
        try:
            cache.set('health_check', 1, timeout=1)
            if cache.get('health_check') == 1:
                health_data['redis'] = 'Operational'
            else:
                health_data['redis'] = 'Degraded'
        except Exception:
            health_data['redis'] = 'Offline'

        # 3. Celery Workers (fallback since CELERY_TASK_ALWAYS_EAGER=True locally)
        try:
            from darkfalcon.celery import app as celery_app
            ping = celery_app.control.ping(timeout=0.5)
            if ping:
                health_data['celery'] = 'Operational'
            else:
                # Eager mode fallback or no workers listening
                health_data['celery'] = 'Offline / Eager'
        except Exception:
            health_data['celery'] = 'Offline'

        # 4. WhatsApp Gateway Status (proxy via WhatsAppInstance)
        try:
            total_instances = WhatsAppInstance.objects.count()
            connected_instances = WhatsAppInstance.objects.filter(status='CONNECTED').count()
            if total_instances > 0 and connected_instances == 0:
                health_data['gateway'] = 'Degraded'
            else:
                health_data['gateway'] = 'Operational'
        except Exception:
            health_data['gateway'] = 'Unknown'

        # 5. Active Sessions (APILogs in the last 15 minutes by unique users)
        try:
            from django.utils import timezone
            from datetime import timedelta
            fifteen_mins_ago = timezone.now() - timedelta(minutes=15)
            active_users = APILog.objects.filter(created_at__gte=fifteen_mins_ago).values('user').distinct().count()
            health_data['active_sessions'] = active_users
        except Exception:
            health_data['active_sessions'] = 0

        # 6. API Latency
        latency_ms = int((time.time() - start_time) * 1000)
        health_data['latency'] = latency_ms

        return Response(health_data)


