from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Existing views (untouched)
from .views import (
    WhatsAppInstanceViewSet,
    FAQRuleViewSet,
    SyncTemplatesView,
    SendTextMessageView,
    SendTemplateMessageView,
    SendMediaMessageView,
    MetaWebhookView,
    GatewayWebhookView,
    BookingViewSet,
    APILogViewSet,
    NotificationViewSet,
    AgreementViewSet,
    SendButtonsView,
    SendListView,
    GetChatsView,
    GetContactsView,
    GetGroupsView,
    DeveloperLogoutView,
    DeveloperRestartView,
    AdminOverviewStatsView,
    AdminClientViewSet,
    AdminSessionViewSet,
    AdminAgreementViewSet,
    AdminNotificationView,
    MetaCloudAPICallbackView,
    ManualMetaConnectView
)

# Support chat views (new — keeps views.py untouched)
from .support_views import SupportTicketViewSet, AdminSupportTicketViewSet

router = DefaultRouter()
router.register('instances', WhatsAppInstanceViewSet, basename='instances')
router.register('faq-rules', FAQRuleViewSet, basename='faq-rules')
router.register('bookings', BookingViewSet, basename='bookings')
router.register('logs', APILogViewSet, basename='logs')
router.register('notifications', NotificationViewSet, basename='notifications')
router.register('tickets', SupportTicketViewSet, basename='tickets')
router.register('agreements', AgreementViewSet, basename='agreements')

# Admin CRUD routers
router.register('admin/clients', AdminClientViewSet, basename='admin-clients')
router.register('admin/sessions', AdminSessionViewSet, basename='admin-sessions')
router.register('admin/agreements', AdminAgreementViewSet, basename='admin-agreements')
router.register('admin/support-tickets', AdminSupportTicketViewSet, basename='admin-support-tickets')

urlpatterns = [
    # Router endpoints
    path('', include(router.urls)),
    
    # Instance specific endpoints
    path('instances/<int:pk>/sync-templates/', SyncTemplatesView.as_view(), name='sync_templates'),
    
    # External API endpoints (API-key authenticated)
    path('send/text/', SendTextMessageView.as_view(), name='send_text'),
    path('send/template/', SendTemplateMessageView.as_view(), name='send_template'),
    path('send/media/', SendMediaMessageView.as_view(), name='send_media'),
    path('send/buttons/', SendButtonsView.as_view(), name='send_buttons'),
    path('send/list/', SendListView.as_view(), name='send_list'),
    path('chats/', GetChatsView.as_view(), name='get_chats'),
    path('contacts/', GetContactsView.as_view(), name='get_contacts'),
    path('groups/', GetGroupsView.as_view(), name='get_groups'),
    path('logout/', DeveloperLogoutView.as_view(), name='dev_logout'),
    path('restart/', DeveloperRestartView.as_view(), name='dev_restart'),
    
    # Webhook endpoints
    path('webhook/', MetaWebhookView.as_view(), name='meta_webhook'),
    path('bot/webhook/', GatewayWebhookView.as_view(), name='gateway_webhook'),
    
    # Meta Embedded Signup
    path('cloud-api/callback/', MetaCloudAPICallbackView.as_view(), name='cloud_api_callback'),
    path('cloud-api/manual/', ManualMetaConnectView.as_view(), name='cloud_api_manual'),
    
    # Admin stats
    path('admin/overview/', AdminOverviewStatsView.as_view(), name='admin_overview'),
    path('admin/notifications/', AdminNotificationView.as_view(), name='admin_notifications'),
]
