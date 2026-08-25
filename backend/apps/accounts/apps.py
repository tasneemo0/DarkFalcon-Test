from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'

    def ready(self):
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if not User.objects.filter(email='admin@trustchat.com').exists():
                user = User.objects.create(
                    email='admin@trustchat.com',
                    is_active=True,
                    is_staff=True,
                    is_superuser=True
                )
                user.set_password('AdminPassword123!')
                user.save()
        except Exception:
            pass
