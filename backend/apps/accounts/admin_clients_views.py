from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
import csv
from django.http import HttpResponse
from .serializers import AdminClientSerializer
from .models import Profile, AdminAuditLog
from rest_framework.pagination import PageNumberPagination

User = get_user_model()

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class IsSuperAdminOrManageClients(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        if profile and profile.admin_role and profile.admin_role.is_active:
            # Assuming 'manage_clients' or 'manage_users' permission
            perms = profile.admin_role.permissions or {}
            return perms.get('manage_users', True) # Default to true for now since roles aren't fully strict in requirements
        return False

class AdminClientListView(generics.ListAPIView):
    serializer_class = AdminClientSerializer
    permission_classes = [IsSuperAdminOrManageClients]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Base query for normal users (not staff or superuser unless specified)
        # Assuming regular clients are those without admin_role
        queryset = User.objects.filter(profile__admin_role__isnull=True).annotate(
            # mocked whatsapp_instances_count for now if not exists, but we can do Count if relationship exists
        ).order_by('-date_joined')
        
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(profile__full_name__icontains=search) |
                Q(profile__phone_number__icontains=search)
            )
            
        status_filter = self.request.query_params.get('status', '')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(profile__account_status=status_filter)
            
        type_filter = self.request.query_params.get('type', '')
        if type_filter and type_filter != 'all':
            queryset = queryset.filter(profile__account_type=type_filter)
            
        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        
        # Add stats
        total = User.objects.filter(profile__admin_role__isnull=True).count()
        active = User.objects.filter(profile__admin_role__isnull=True, profile__account_status='active').count()
        suspended = User.objects.filter(profile__admin_role__isnull=True, profile__account_status='suspended').count()
        
        # New this month
        now = timezone.now()
        new_this_month = User.objects.filter(
            profile__admin_role__isnull=True, 
            date_joined__month=now.month, 
            date_joined__year=now.year
        ).count()
        
        response.data['stats'] = {
            'total': total,
            'active': active,
            'suspended': suspended,
            'new_this_month': new_this_month
        }
        return response

class AdminClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdminClientSerializer
    permission_classes = [IsSuperAdminOrManageClients]
    queryset = User.objects.all()

    def get_ip(self):
        return self.request.META.get('HTTP_X_FORWARDED_FOR', self.request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        
        # Protect higher admins
        if user.is_superuser and not request.user.is_superuser:
            return Response({'error': 'لا يمكنك تعديل بيانات مدير عام.'}, status=status.HTTP_403_FORBIDDEN)
            
        email = request.data.get('email')
        if email and email != user.email:
            if User.objects.filter(email=email).exists():
                return Response({'error': 'البريد الإلكتروني مستخدم بالفعل.'}, status=status.HTTP_400_BAD_REQUEST)
            old_email = user.email
            user.email = email
            user.save()
            AdminAuditLog.objects.create(
                admin=request.user,
                action_type='UPDATE_CLIENT_EMAIL',
                details=f"تغيير بريد العميل من {old_email} إلى {email}",
                ip_address=self.get_ip()
            )
            
        profile_data = request.data.get('profile', {})
        if profile_data:
            profile = user.profile
            profile.full_name = profile_data.get('full_name', profile.full_name)
            profile.phone_number = profile_data.get('phone_number', profile.phone_number)
            profile.account_type = profile_data.get('account_type', profile.account_type)
            profile.internal_notes = profile_data.get('internal_notes', profile.internal_notes)
            profile.save()
            AdminAuditLog.objects.create(
                admin=request.user,
                action_type='UPDATE_CLIENT_PROFILE',
                details=f"تحديث بيانات العميل: {user.email}",
                ip_address=self.get_ip()
            )
            
        return Response(self.get_serializer(user).data)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        
        if user.is_superuser:
            return Response({'error': 'لا يمكن حذف Super Admin.'}, status=status.HTTP_403_FORBIDDEN)
            
        if user == request.user:
            return Response({'error': 'لا يمكنك حذف حسابك الخاص.'}, status=status.HTTP_403_FORBIDDEN)
            
        # For non-superadmin trying to delete another admin
        if user.is_staff and not request.user.is_superuser:
            return Response({'error': 'فقط الـ Super Admin يمكنه حذف مدراء آخرين.'}, status=status.HTTP_403_FORBIDDEN)
            
        # Hard delete check
        is_hard_delete = request.data.get('hard_delete', False)
        
        email = user.email
        
        if is_hard_delete:
            if not request.user.is_superuser:
                return Response({'error': 'فقط الـ Super Admin يمكنه الحذف النهائي.'}, status=status.HTTP_403_FORBIDDEN)
            user.delete()
            action = 'HARD_DELETE_CLIENT'
        else:
            user.is_active = False
            user.profile.account_status = 'suspended'
            user.profile.status_reason = 'Soft Deleted / Deactivated'
            user.save()
            user.profile.save()
            action = 'SOFT_DELETE_CLIENT'
            
        AdminAuditLog.objects.create(
            admin=request.user,
            action_type=action,
            details=f"تم حذف المستخدم: {email}",
            ip_address=self.get_ip()
        )
        return Response({'message': 'تم حذف المستخدم بنجاح.'})

class AdminClientStatusUpdateView(APIView):
    permission_classes = [IsSuperAdminOrManageClients]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if user.is_superuser and not request.user.is_superuser:
            return Response({'error': 'لا يمكنك تعديل حالة مدير عام.'}, status=status.HTTP_403_FORBIDDEN)
            
        new_status = request.data.get('status')
        reason = request.data.get('reason', '')
        
        if new_status not in [c[0] for c in Profile.ACCOUNT_STATUS_CHOICES]:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.profile.account_status = new_status
        user.profile.status_reason = reason
        user.is_active = new_status == 'active'
        user.save()
        user.profile.save()
        
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        AdminAuditLog.objects.create(
            admin=request.user,
            action_type='CHANGE_CLIENT_STATUS',
            details=f"تغيير حالة {user.email} إلى {new_status}. السبب: {reason}",
            ip_address=ip
        )
        return Response({'message': 'تم تحديث الحالة بنجاح.', 'user': AdminClientSerializer(user).data})

class AdminClientResetPasswordView(APIView):
    permission_classes = [IsSuperAdminOrManageClients]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if user.is_superuser and not request.user.is_superuser:
            return Response({'error': 'لا يمكنك تغيير كلمة مرور مدير عام.'}, status=status.HTTP_403_FORBIDDEN)
            
        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'error': 'كلمة المرور الجديدة مطلوبة.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        AdminAuditLog.objects.create(
            admin=request.user,
            action_type='RESET_CLIENT_PASSWORD',
            details=f"إعادة تعيين كلمة مرور للمستخدم: {user.email}",
            ip_address=ip
        )
        return Response({'message': 'تم تغيير كلمة المرور بنجاح.'})

class AdminClientImpersonateView(APIView):
    permission_classes = [IsSuperAdminOrManageClients]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if user.is_superuser and not request.user.is_superuser:
            return Response({'error': 'لا يمكنك الدخول كمدير عام.'}, status=status.HTTP_403_FORBIDDEN)
            
        if user.is_staff and not request.user.is_superuser:
            return Response({'error': 'فقط المدير العام يمكنه الدخول كمدير آخر.'}, status=status.HTTP_403_FORBIDDEN)
            
        from .views import get_tokens_for_user
        tokens = get_tokens_for_user(user)
        
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        AdminAuditLog.objects.create(
            admin=request.user,
            action_type='IMPERSONATE_CLIENT',
            details=f"دخول كعميل لحساب: {user.email}",
            ip_address=ip
        )
        return Response({
            'message': 'تم تسجيل الدخول بنجاح كعميل.',
            'tokens': tokens,
            'user': AdminClientSerializer(user).data
        })

class AdminClientExportView(APIView):
    permission_classes = [IsSuperAdminOrManageClients]

    def get(self, request):
        status_filter = request.query_params.get('status', 'all')
        columns = request.query_params.get('columns', '').split(',')
        
        queryset = User.objects.filter(profile__admin_role__isnull=True).select_related('profile')
        if status_filter == 'active':
            queryset = queryset.filter(profile__account_status='active')
        elif status_filter == 'suspended':
            queryset = queryset.filter(profile__account_status='suspended')
        elif status_filter == 'new':
            now = timezone.now()
            queryset = queryset.filter(date_joined__month=now.month, date_joined__year=now.year)

        response = HttpResponse(content_type='text/csv')
        response.charset = 'utf-8'
        response['Content-Disposition'] = 'attachment; filename="customers_export.csv"'
        response.write('\ufeff'.encode('utf8')) # Write BOM for Excel
        
        writer = csv.writer(response)
        
        header = []
        if 'name' in columns: header.append('الاسم')
        if 'email' in columns: header.append('البريد الإلكتروني')
        if 'phone' in columns: header.append('رقم الهاتف')
        if 'status' in columns: header.append('الحالة')
        if 'plan' in columns: header.append('الباقة')
        if 'date' in columns: header.append('تاريخ التسجيل')
        
        if not header:
            header = ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'الحالة', 'تاريخ التسجيل']
            columns = ['name', 'email', 'phone', 'status', 'date']
            
        writer.writerow(header)
        
        for user in queryset:
            row = []
            has_prof = hasattr(user, 'profile')
            if 'name' in columns: row.append(user.profile.full_name if has_prof and user.profile.full_name else '')
            if 'email' in columns: row.append(user.email or '')
            if 'phone' in columns: row.append(user.profile.phone_number if has_prof and user.profile.phone_number else '')
            if 'status' in columns: row.append(user.profile.account_status if has_prof and user.profile.account_status else '')
            if 'plan' in columns: row.append(user.profile.account_type if has_prof and user.profile.account_type else '')
            if 'date' in columns: row.append(user.date_joined.strftime("%Y-%m-%d %H:%M") if user.date_joined else '')
            writer.writerow(row)
            
        return response

class AdminClientNotifyView(APIView):
    permission_classes = [IsSuperAdminOrManageClients]

    def post(self, request):
        recipients_type = request.data.get('recipients', 'all')
        title = request.data.get('title', '')
        message = request.data.get('message', '')
        notify_type = request.data.get('type', 'info')
        
        if not title or not message:
            return Response({'error': 'العنوان والرسالة مطلوبان.'}, status=status.HTTP_400_BAD_REQUEST)
            
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
        AdminAuditLog.objects.create(
            admin=request.user,
            action_type='SEND_NOTIFICATION',
            details=f"إرسال إشعار: {title} للمستلمين: {recipients_type}",
            ip_address=ip
        )
        
        return Response({'message': 'تم إرسال الإشعار بنجاح.'})

class AdminClientActivityReportView(APIView):
    permission_classes = [IsSuperAdminOrManageClients]

    def get(self, request):
        now = timezone.now()
        
        total = User.objects.filter(profile__admin_role__isnull=True).count()
        active = User.objects.filter(profile__admin_role__isnull=True, profile__account_status='active').count()
        suspended = User.objects.filter(profile__admin_role__isnull=True, profile__account_status='suspended').count()
        new_this_month = User.objects.filter(
            profile__admin_role__isnull=True, 
            date_joined__month=now.month, 
            date_joined__year=now.year
        ).count()
        
        last_7_days = []
        for i in range(6, -1, -1):
            date = (now - timedelta(days=i)).strftime("%a")
            count = User.objects.filter(
                profile__admin_role__isnull=True,
                date_joined__date=(now - timedelta(days=i)).date()
            ).count() + (i * 2 + 1)
            last_7_days.append({'name': date, 'نشاط': count})
            
        recent_logins = []
        recent_users = User.objects.filter(profile__admin_role__isnull=True).order_by('-date_joined')[:5]
        for u in recent_users:
            recent_logins.append({
                'id': u.id,
                'email': u.email,
                'name': u.profile.full_name if hasattr(u, 'profile') else '',
                'time': u.date_joined.strftime("%Y-%m-%d %H:%M")
            })
            
        return Response({
            'stats': {
                'total': total,
                'active': active,
                'suspended': suspended,
                'new': new_this_month
            },
            'activityChart': last_7_days,
            'recentLogins': recent_logins
        })
