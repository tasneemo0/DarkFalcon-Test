from rest_framework import permissions, exceptions
from .models import WhatsAppInstance

class WhatsAppAPIKeyAuthentication(permissions.BasePermission):
    """
    Custom permission/authentication helper for API Key-based external endpoints.
    Allows authentication via:
    1. 'Authorization: Bearer <api_key>' header
    2. 'api_key' in query parameters
    3. 'api_key' in post body
    """
    def has_permission(self, request, view):
        api_key = None
        
        # 1. Check Header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            api_key = auth_header.split(' ')[1]
            
        # 2. Check Query Params
        if not api_key:
            api_key = request.query_params.get('api_key')
            
        # 3. Check Post Body
        if not api_key and isinstance(request.data, dict):
            api_key = request.data.get('api_key')
            
        if not api_key:
            raise exceptions.PermissionDenied("API key is required. Provide it in the Authorization header, query parameter, or request body.")

        try:
            instance = WhatsAppInstance.objects.select_related('user').get(api_key=api_key)
            # Attach the instance and its owner user to request for access inside the view
            request.whatsapp_instance = instance
            request.user = instance.user
            return True
        except WhatsAppInstance.DoesNotExist:
            raise exceptions.AuthenticationFailed("Invalid API Key.")
