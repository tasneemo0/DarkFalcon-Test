from django.db.models import Q
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer, ProfileSerializer, AdminRoleSerializer, AdminUserSerializer
from .models import Profile, AdminRole
from django.core import signing
from urllib.parse import quote
from .email_service import send_resend_email
from urllib.parse import quote
from .email_service import send_resend_email


User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        user.is_email_verified = False
        user.save(update_fields=["is_email_verified"])

        verification_token = signing.dumps(
            {"user_id": user.id},
            salt="email-verification",
        )

        verification_url = (
            "https://dark-falcon-test-b2kh.vercel.app/auth/verify-email"
            f"?token={quote(verification_token)}"
        )

        send_resend_email(
            user.email,
            "تأكيد بريدك الإلكتروني - DarkFalcon",
            f"""
            <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right">
                <h2>مرحبًا بك في DarkFalcon</h2>
                <p>اضغط على الزر التالي لتأكيد بريدك الإلكتروني:</p>

                <p>
                    <a href="{verification_url}"
                       style="
                            display:inline-block;
                            background:#f28a38;
                            color:white;
                            padding:12px 24px;
                            text-decoration:none;
                            border-radius:8px;
                       ">
                        تأكيد البريد الإلكتروني
                    </a>
                </p>

                <p>صلاحية الرابط 24 ساعة.</p>
            </div>
            """,
        )

        tokens = get_tokens_for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            'user': user_data,
            'tokens': tokens,
            'message': 'Registration successful. Email auto-verified for testing.'
        }, status=status.HTTP_201_CREATED)

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import authenticate
from .models import SessionLog, LoginHistory
from .serializers import SessionLogSerializer, LoginHistorySerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        request = self.context.get('request')
        ip = ''
        user_agent = ''
        if request:
            ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
            user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # SimpleJWT defaults to email if User model uses it as USERNAME_FIELD
        username = attrs.get(self.username_field)
        password = attrs.get('password')
        two_step_password = request.data.get('two_step_password') if request else None

        user = authenticate(email=username, password=password)
        if not user:
            # Try to find user by phone number
            from .models import Profile
            clean_username = ''.join(filter(str.isdigit, username)).lstrip('0')
            if clean_username:
                profile = Profile.objects.filter(phone_number__endswith=clean_username).first()
                if profile and profile.user:
                    user = authenticate(email=profile.user.email, password=password)
                
            if not user:
                LoginHistory.objects.create(email_attempted=username, ip_address=ip, status='failed')
                raise AuthenticationFailed('Invalid email, phone number, or password')

        profile = user.profile
        # IP restriction check
        if profile.restrict_ip_enabled and profile.last_login_ip and profile.last_login_ip != ip:
            LoginHistory.objects.create(user=user, email_attempted=username, ip_address=ip, status='failed_ip_restricted')
            raise AuthenticationFailed('Login restricted: Unauthorized IP address')

        # Two-step verification check
        if profile.two_step_enabled:
            if not two_step_password or two_step_password != profile.two_step_password:
                LoginHistory.objects.create(user=user, email_attempted=username, ip_address=ip, status='failed_2step')
                raise AuthenticationFailed('Two-step verification password is required or incorrect')

        # Retrieve token data
        data = super().validate(attrs)
        
        # Update last IP and logs
        profile.last_login_ip = ip
        profile.save()
        
        LoginHistory.objects.create(user=user, email_attempted=username, ip_address=ip, status='success')
        SessionLog.objects.create(user=user, ip_address=ip, browser_agent=user_agent)
        
        data['user'] = UserSerializer(user).data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        profile = user.profile
        
        # Update profile details
        profile_serializer = ProfileSerializer(profile, data=request.data, partial=True)
        profile_serializer.is_valid(raise_exception=True)
        profile_serializer.save()
        
        # Update user details if email passed and is not same
        email = request.data.get('email')
        if email and email != user.email:
            if User.objects.filter(email=email).exclude(pk=user.id).exists():
                return Response({'error': 'Email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
            user.email = email
            user.save()

        # Update password if passed
        password = request.data.get('password')
        if password:
            user.set_password(password)
            user.save()
            
        return Response(UserSerializer(user).data)

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response(
                {"error": "Verification token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data = signing.loads(
                token,
                salt="email-verification",
                max_age=60 * 60 * 24,
            )

            user_id = data.get("user_id")

            user = User.objects.get(id=user_id)

            if not user.is_email_verified:
                user.is_email_verified = True
                user.save(update_fields=["is_email_verified"])

            return Response(
                {"message": "Email verified successfully"},
                status=status.HTTP_200_OK,
            )

        except signing.SignatureExpired:
            return Response(
                {"error": "Verification link has expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except signing.BadSignature:
            return Response(
                {"error": "Invalid verification token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)

            reset_token = signing.dumps(
                {"user_id": user.id, "email": user.email},
                salt="password-reset",
            )

            reset_url = (
                "https://dark-falcon-test-b2kh.vercel.app/auth/forgot-password"
                f"?token={quote(reset_token)}&email={quote(user.email)}"
            )

            send_resend_email(
                user.email,
                "إعادة تعيين كلمة المرور - DarkFalcon",
                f"""
                <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right">
                    <h2>إعادة تعيين كلمة المرور</h2>
                    <p>وصلنا طلب لإعادة تعيين كلمة مرور حسابك.</p>

                    <p>
                        <a href="{reset_url}"
                           style="
                                display:inline-block;
                                background:#f28a38;
                                color:white;
                                padding:12px 24px;
                                text-decoration:none;
                                border-radius:8px;
                           ">
                            إعادة تعيين كلمة المرور
                        </a>
                    </p>

                    <p>صلاحية الرابط 30 دقيقة.</p>
                    <p>إذا لم تطلب هذا التغيير، تجاهل الرسالة.</p>
                </div>
                """,
            )

            return Response(
                {"message": "Password reset email sent successfully."},
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        new_password = request.data.get("new_password")
        token = request.data.get("token")

        if not new_password or not token:
            return Response(
                {"error": "new_password and token are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data = signing.loads(
                token,
                salt="password-reset",
                max_age=60 * 30,
            )

            user = User.objects.get(id=data.get("user_id"))

            user.set_password(new_password)
            user.save(update_fields=["password"])

            return Response(
                {"message": "Password reset successful"},
                status=status.HTTP_200_OK,
            )

        except signing.SignatureExpired:
            return Response(
                {"error": "Password reset link has expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except signing.BadSignature:
            return Response(
                {"error": "Invalid password reset token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class SessionLogsListView(generics.ListAPIView):
    serializer_class = SessionLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SessionLog.objects.filter(user=self.request.user).order_by('-created_at')

class SessionLogDestroyView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SessionLog.objects.filter(user=self.request.user)


class LoginHistoryListView(generics.ListAPIView):
    serializer_class = LoginHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LoginHistory.objects.filter(user=self.request.user).order_by('-created_at')


class SocialLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        provider = request.data.get('provider')
        token = request.data.get('token')
        
        email = None
        full_name = ""
        
        if provider == 'google':
            import requests
            # Try verification via ID token info first
            res = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}")
            if res.status_code == 200:
                data = res.json()
                email = data.get('email')
                full_name = data.get('name', '')
            else:
                # Fallback: check as OAuth2 access token
                res = requests.get("https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {token}"})
                if res.status_code == 200:
                    data = res.json()
                    email = data.get('email')
                    full_name = data.get('name', '')
                    
        elif provider == 'facebook':
            import requests
            res = requests.get(f"https://graph.facebook.com/me?fields=id,name,email&access_token={token}")
            if res.status_code == 200:
                data = res.json()
                email = data.get('email')
                full_name = data.get('name', '')
                
        elif provider == 'mock':
            from django.conf import settings
            if not settings.DEBUG:
                return Response({'error': 'Mock login only allowed in development'}, status=status.HTTP_400_BAD_REQUEST)
            email = request.data.get('email')
            full_name = request.data.get('name', 'Demo User')
            
        if not email:
            return Response({'error': 'Invalid social token or provider configuration.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Retrieve or create user
        user, created = User.objects.get_or_create(email=email)
        if created:
            user.set_unusable_password()
            user.is_email_verified = True
            user.save()
            
            # Create/save user profile details
            profile = user.profile
            profile.full_name = full_name
            profile.save()
        else:
            if not user.is_active:
                return Response({'error': 'User account is deactivated'}, status=status.HTTP_400_BAD_REQUEST)
            
            profile = user.profile
            if not profile.full_name and full_name:
                profile.full_name = full_name
                profile.save()
                
        tokens = get_tokens_for_user(user)
        user_data = UserSerializer(user).data
        
        # Log successful login
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        profile.last_login_ip = ip
        profile.save()
        
        LoginHistory.objects.create(user=user, email_attempted=email, ip_address=ip, status='success')
        SessionLog.objects.create(user=user, ip_address=ip, browser_agent=user_agent)
        
        return Response({
            'user': user_data,
            'tokens': tokens,
            'message': 'Social login successful.'
        }, status=status.HTTP_200_OK)


class IsSuperAdminOrManageAdmins(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        # Check profile admin_role
        profile = getattr(request.user, 'profile', None)
        if profile and profile.admin_role and profile.admin_role.is_active:
            perms = profile.admin_role.permissions or {}
            return perms.get('manage_admins', False)
        return False

class AdminRoleListCreateView(generics.ListCreateAPIView):
    serializer_class = AdminRoleSerializer
    permission_classes = [IsSuperAdminOrManageAdmins]
    queryset = AdminRole.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        role = serializer.save()
        from .models import AdminAuditLog
        ip = self.request.META.get('HTTP_X_FORWARDED_FOR', self.request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        AdminAuditLog.objects.create(
            admin=self.request.user,
            action_type='CREATE_ROLE',
            details=f"تم إنشاء رتبة جديدة: {role.name_en} / {role.name_ar}",
            ip_address=ip
        )

class AdminRoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdminRoleSerializer
    permission_classes = [IsSuperAdminOrManageAdmins]
    queryset = AdminRole.objects.all()

    def perform_update(self, serializer):
        role = serializer.save()
        from .models import AdminAuditLog
        ip = self.request.META.get('HTTP_X_FORWARDED_FOR', self.request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        AdminAuditLog.objects.create(
            admin=self.request.user,
            action_type='UPDATE_ROLE',
            details=f"تم تعديل الرتبة: {role.name_en} / {role.name_ar}",
            ip_address=ip
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if instance.name_en.lower() in ['system manager', 'super admin']:
            return Response({'error': 'لا يمكن حذف هذه الرتبة الأساسية للنظام.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if instance.users.exists():
            return Response({'error': 'لا يمكن حذف هذه الرتبة لأنها مستخدمة من قبل مدراء. يرجى نقلهم أولاً.'}, status=status.HTTP_400_BAD_REQUEST)
        
        role_name = f"{instance.name_en} / {instance.name_ar}"
        response = super().destroy(request, *args, **kwargs)
        
        from .models import AdminAuditLog
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        AdminAuditLog.objects.create(
            admin=request.user,
            action_type='DELETE_ROLE',
            details=f"تم حذف الرتبة: {role_name}",
            ip_address=ip
        )
        return response

class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperAdminOrManageAdmins]
    
    def get_queryset(self):
        # Return all staff or superusers, or those with admin_role
        return User.objects.filter(Q(is_staff=True) | Q(is_superuser=True) | Q(profile__admin_role__isnull=False)).distinct().order_by('-date_joined')

class AdminUserSearchView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperAdminOrManageAdmins]
    
    def get_queryset(self):
        query = self.request.query_params.get('q', '').strip()
        if not query:
            return User.objects.filter(is_superuser=False).order_by('-date_joined')[:20]
            
        return User.objects.filter(
            Q(email__icontains=query) | 
            Q(profile__full_name__icontains=query) |
            Q(profile__phone_number__icontains=query)
        ).filter(is_superuser=False).distinct()[:20]

class AdminAssignManagerView(APIView):
    permission_classes = [IsSuperAdminOrManageAdmins]

    def post(self, request):
        user_id = request.data.get('user_id')
        role_id = request.data.get('role_id')
        
        if not user_id or not role_id:
            return Response({'error': 'User ID and Role ID are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if target_user.is_superuser:
            return Response({'error': 'Cannot assign role to superadmin.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            role = AdminRole.objects.get(pk=role_id)
        except AdminRole.DoesNotExist:
            return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)
            
        target_user.profile.admin_role = role
        target_user.profile.save()
        
        if not target_user.is_staff:
            target_user.is_staff = True
            target_user.save()
            
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        from .models import AdminAuditLog
        AdminAuditLog.objects.create(
            admin=request.user,
            action_type='ASSIGN_ADMIN_ROLE',
            details=f"تم تعيين '{target_user.email}' كمدير برتبة '{role.name_ar}'",
            ip_address=ip
        )
        return Response({'message': 'تم التعيين بنجاح.', 'user': AdminUserSerializer(target_user).data})

class AdminChangeManagerRoleView(APIView):
    permission_classes = [IsSuperAdminOrManageAdmins]

    def patch(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if target_user.is_superuser and not request.user.is_superuser:
            return Response({'error': 'لا يمكن تعديل رتبة المدير العام الأساسي إلا من قبله.'}, status=status.HTTP_403_FORBIDDEN)
            
        if target_user == request.user and not request.user.is_superuser:
            return Response({'error': 'لا يمكنك تعديل رتبتك الخاصة.'}, status=status.HTTP_400_BAD_REQUEST)
            
        role_id = request.data.get('role_id')
        if not role_id:
            return Response({'error': 'Role ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            role = AdminRole.objects.get(pk=role_id)
        except AdminRole.DoesNotExist:
            return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)
            
        target_user.profile.admin_role = role
        target_user.profile.save()
        
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        from .models import AdminAuditLog
        AdminAuditLog.objects.create(
            admin=request.user,
            action_type='CHANGE_ADMIN_ROLE',
            details=f"تم تغيير رتبة '{target_user.email}' إلى '{role.name_ar}'",
            ip_address=ip
        )
        return Response({'message': 'تم تغيير الرتبة بنجاح.'})

class AdminRemoveManagerView(APIView):
    permission_classes = [IsSuperAdminOrManageAdmins]

    def patch(self, request, pk):
        return self.remove(request, pk)
        
    def delete(self, request, pk):
        return self.remove(request, pk)
        
    def remove(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if target_user.is_superuser:
            return Response({'error': 'لا يمكن حذف صلاحيات المدير العام الأساسي.'}, status=status.HTTP_403_FORBIDDEN)
            
        if target_user == request.user:
            return Response({'error': 'لا يمكنك حذف صلاحياتك الخاصة.'}, status=status.HTTP_400_BAD_REQUEST)
            
        target_user.profile.admin_role = None
        target_user.profile.save()
        target_user.is_staff = False
        target_user.save()
        
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        from .models import AdminAuditLog
        AdminAuditLog.objects.create(
            admin=request.user,
            action_type='REMOVE_ADMIN_ROLE',
            details=f"تم إزالة صلاحيات الإدارة عن '{target_user.email}'",
            ip_address=ip
        )
        return Response({'message': 'تم إزالة الرتبة بنجاح.'})

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response({'error': 'كلمة المرور الحالية والجديدة مطلوبة.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(current_password):
            return Response({'error': 'كلمة المرور الحالية غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        from .models import LoginHistory
        LoginHistory.objects.create(user=user, email_attempted=user.email, ip_address=ip, status='password_changed')

        return Response({'message': 'تم تغيير كلمة المرور بنجاح'})

class PhoneOTPRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        phone_number = request.data.get('phone_number')
        if not phone_number:
            return Response({'error': 'رقم الهاتف مطلوب'}, status=status.HTTP_400_BAD_REQUEST)

        from .models import Profile, PhoneOTP
        if Profile.objects.filter(phone_number=phone_number).exclude(user=request.user).exists():
            return Response({'error': 'رقم الهاتف مستخدم مسبقاً'}, status=status.HTTP_400_BAD_REQUEST)

        import random
        from datetime import timedelta
        from django.utils import timezone
        otp = str(random.randint(100000, 999999))
        
        PhoneOTP.objects.filter(user=request.user, phone_number=phone_number).delete()
        PhoneOTP.objects.create(
            user=request.user,
            phone_number=phone_number,
            otp=otp,
            expires_at=timezone.now() + timedelta(minutes=5)
        )
        
        print(f"--- MOCK SMS --- To: {phone_number} OTP: {otp}")
        return Response({'message': 'تم إرسال رمز التحقق'})

class PhoneOTPVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        phone_number = request.data.get('phone_number')
        otp = request.data.get('otp')
        
        if not phone_number or not otp:
            return Response({'error': 'الرقم ورمز التحقق مطلوبان'}, status=status.HTTP_400_BAD_REQUEST)

        from .models import PhoneOTP
        from django.utils import timezone
        otp_record = PhoneOTP.objects.filter(user=request.user, phone_number=phone_number, is_verified=False).order_by('-created_at').first()
        
        if not otp_record:
            return Response({'error': 'لم يتم العثور على طلب تحقق'}, status=status.HTTP_400_BAD_REQUEST)
            
        if timezone.now() > otp_record.expires_at:
            return Response({'error': 'انتهت صلاحية الرمز'}, status=status.HTTP_400_BAD_REQUEST)
            
        if otp_record.otp != otp:
            return Response({'error': 'الرمز غير صحيح'}, status=status.HTTP_400_BAD_REQUEST)
            
        otp_record.is_verified = True
        otp_record.save()
        
        profile = request.user.profile
        profile.phone_number = phone_number
        profile.save()
        
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        from .models import LoginHistory
        LoginHistory.objects.create(user=request.user, email_attempted=request.user.email, ip_address=ip, status='phone_verified')

        return Response({'message': 'تم التحقق وتحديث الرقم بنجاح'})

class LogoutAllSessionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        from .models import SessionLog, LoginHistory
        SessionLog.objects.filter(user=user).delete()
        
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        LoginHistory.objects.create(user=user, email_attempted=user.email, ip_address=ip, status='logout_all')
        
        return Response({'message': 'تم تسجيل الخروج من جميع الأجهزة'})

class DeleteAccountRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        password = request.data.get('password')
        if not password or not request.user.check_password(password):
            return Response({'error': 'كلمة المرور غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)
            
        profile = request.user.profile
        profile.account_deletion_requested = True
        from django.utils import timezone
        profile.deletion_requested_at = timezone.now()
        profile.save()
        
        return Response({'message': 'تم تسجيل طلب حذف الحساب. سيتم التواصل معك قريباً لتأكيد الحذف.'})

class EmailChangeRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        new_email = request.data.get('new_email')
        password = request.data.get('password')

        if not new_email or not password:
            return Response({'error': 'البريد الإلكتروني الجديد وكلمة المرور مطلوبان'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return Response({'error': 'كلمة المرور غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
            return Response({'error': 'البريد الإلكتروني مستخدم مسبقاً'}, status=status.HTTP_400_BAD_REQUEST)

        # Update email directly for demo purposes (usually this would involve a verification link)
        user.email = new_email
        user.is_email_verified = True
        user.save()
        
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        from .models import LoginHistory
        LoginHistory.objects.create(user=user, email_attempted=user.email, ip_address=ip, status='email_changed')

        return Response({'message': 'تم تحديث البريد الإلكتروني بنجاح'})

class AccountCenterProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile_data = {
            'email': user.email,
            'full_name': user.profile.full_name,
            'phone_number': user.profile.phone_number,
            'is_email_verified': getattr(user, 'is_email_verified', False),
            'account_type': user.profile.account_type,
            'account_status': user.profile.account_status,
            'member_since': user.date_joined.isoformat(),
            'two_factor_enabled': getattr(user.profile, 'two_factor_enabled', False),
            'deletion_requested': getattr(user.profile, 'account_deletion_requested', False),
        }
        return Response(profile_data)

    def patch(self, request):
        user = request.user
        full_name = request.data.get('full_name')
        
        if full_name is not None:
            user.profile.full_name = full_name
            user.profile.save()
            
        return Response({'message': 'Profile updated successfully'})


class AccountCenterSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        from django.utils import timezone
        today = timezone.now().date()
        from apps.billing.models import Subscription
        
        sub = Subscription.objects.filter(user=user, active=True).select_related('plan').first()
        if not sub:
            return Response(None)
            
        usage_data = {}
        if hasattr(sub, 'usage') and sub.usage:
            usage_data = {
                'messages_used': sub.usage.messages_used,
                'messages_limit': sub.usage.messages_limit,
                'devices_used': sub.usage.devices_used,
                'devices_limit': sub.usage.devices_limit,
            }
        
        subscription_data = {
            'plan_name': sub.plan.name,
            'price': str(sub.plan.price) if sub.plan.price else '0',
            'duration_days': getattr(sub.plan, 'duration_days', 30),
            'starts_at': sub.start_date.isoformat() if sub.start_date else None,
            'expires_at': sub.end_date.isoformat() if sub.end_date else None,
            'days_remaining': (sub.end_date.date() - today).days if sub.end_date else 0,
            'usage': usage_data,
            'is_unlimited': sub.plan.is_messages_unlimited,
            'features': {
                'api': True,
                'webhooks': sub.plan.features.get('webhooks', False) if hasattr(sub.plan, 'features') and sub.plan.features else True,
                'bot': sub.plan.features.get('bot', False) if hasattr(sub.plan, 'features') and sub.plan.features else True,
                'support': True
            }
        }
        return Response(subscription_data)


class AccountCenterStatisticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        from django.utils import timezone
        today = timezone.now().date()
        from datetime import timedelta
        start_7_days = today - timedelta(days=7)
        
        from apps.whatsapp.models import WhatsAppInstance, Message, FAQRule
        
        wa_instances = WhatsAppInstance.objects.filter(user=user)
        total_devices = wa_instances.count()
        connected_devices = wa_instances.filter(status='connected').count()
        webhook_enabled = wa_instances.filter(webhook_enabled=True).count()
        
        bot_rules = FAQRule.objects.filter(instance__user=user).count()
        
        today_messages = Message.objects.filter(instance__user=user, created_at__date=today)
        messages_sent_today = today_messages.filter(direction='outbound').count()
        messages_received_today = today_messages.filter(direction='inbound').count()
        
        messages_7_days = Message.objects.filter(instance__user=user, created_at__date__gte=start_7_days).count()
        failed_messages = Message.objects.filter(instance__user=user, status='failed').count()

        return Response({
            'total_devices': total_devices,
            'connected_devices': connected_devices,
            'webhooks_enabled': webhook_enabled,
            'bot_rules': bot_rules,
            'messages_sent_today': messages_sent_today,
            'messages_received_today': messages_received_today,
            'messages_last_7_days': messages_7_days,
            'failed_messages': failed_messages,
        })


class AccountCenterSecurityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        from .models import SessionLog, LoginHistory
        from django.utils import timezone
        from datetime import timedelta
        
        # Calculate truly active sessions (within last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        active_sessions = SessionLog.objects.filter(user=user, last_activity__gte=thirty_days_ago).count()
        
        # Get last login time
        last_login_record = LoginHistory.objects.filter(user=user, status='success').order_by('-created_at').first()
        last_login_time = last_login_record.created_at.isoformat() if last_login_record else None
        
        # Get last password change
        last_pwd_change = LoginHistory.objects.filter(user=user, status='password_changed').order_by('-created_at').first()
        last_password_change = last_pwd_change.created_at.isoformat() if last_pwd_change else None

        return Response({
            'active_sessions': active_sessions,
            'last_login_ip': getattr(user.profile, 'last_login_ip', None),
            'last_login_time': last_login_time,
            'last_password_change': last_password_change,
        })


class AccountCenterActivityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        from apps.whatsapp.models import APILog
        from .models import LoginHistory
        
        try:
            limit = int(request.query_params.get('limit', 8))
        except ValueError:
            limit = 8
            
        # Get enough records to have a good pool for sorting
        pool_size = limit * 2 if limit < 50 else limit
            
        # Get meaningful events, deduplicated
        login_history = LoginHistory.objects.filter(user=user).exclude(status__in=['failed', 'logout_all']).order_by('-created_at')[:pool_size]
        
        # We only care about important API actions
        api_logs = APILog.objects.filter(user=user).exclude(method='GET').order_by('-created_at')[:pool_size]
        
        activity_list = []
        for lh in login_history:
            activity_list.append({
                'id': f"log_{lh.id}",
                'type': 'auth',
                'raw_action': lh.status,
                'timestamp': lh.created_at.isoformat(),
                'ip': lh.ip_address
            })
            
        last_endpoint = None
        added_api_count = 0
        for al in api_logs:
            if added_api_count >= pool_size:
                break
            if al.endpoint == last_endpoint:
                continue # Skip consecutive duplicates
            last_endpoint = al.endpoint
            
            activity_list.append({
                'id': f"api_{al.id}",
                'type': 'api',
                'raw_action': f"{al.method} {al.endpoint}",
                'timestamp': al.created_at.isoformat(),
                'ip': al.ip_address
            })
            added_api_count += 1
            
        activity_list.sort(key=lambda x: x['timestamp'], reverse=True)
        return Response(activity_list[:limit])

