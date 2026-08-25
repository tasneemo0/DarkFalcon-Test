from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlanViewSet, SubscriptionDetailView, InvoiceViewSet, InvoiceDownloadView, UsageView

router = DefaultRouter()
router.register('plans', PlanViewSet, basename='plans')
router.register('invoices', InvoiceViewSet, basename='invoices')

urlpatterns = [
    path('', include(router.urls)),
    path('subscription/', SubscriptionDetailView.as_view(), name='subscription_detail'),
    path('invoices/<int:pk>/download/', InvoiceDownloadView.as_view(), name='invoice_download'),
    path('usage/', UsageView.as_view(), name='billing_usage'),
]
