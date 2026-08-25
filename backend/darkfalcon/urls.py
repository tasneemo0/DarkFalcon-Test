from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'ok', 'service': 'TrustChat API'})

urlpatterns = [
    path('', health_check, name='root'),
    path('api/health/', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    
    # API Version 1 endpoints
    path('api/v1/', include('apps.accounts.urls')),
    path('api/v1/whatsapp/', include('apps.whatsapp.urls')),
    path('api/v1/billing/', include('apps.billing.urls')),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
