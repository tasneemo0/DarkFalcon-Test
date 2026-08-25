from .dashboard_views import ClientSummaryView, AdminSummaryView, SystemHealthView
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, ProfileView, VerifyEmailView, ForgotPasswordView, ResetPasswordView,
    CustomTokenObtainPairView, SessionLogsListView, SessionLogDestroyView, LoginHistoryListView, SocialLoginView,
    AdminRoleListCreateView, AdminRoleDetailView, AdminUserListView,
    AdminUserSearchView, AdminAssignManagerView, AdminChangeManagerRoleView, AdminRemoveManagerView,
    ChangePasswordView, PhoneOTPRequestView, PhoneOTPVerifyView,
    LogoutAllSessionsView, DeleteAccountRequestView, EmailChangeRequestView,
    AccountCenterProfileView, AccountCenterSubscriptionView,
    AccountCenterStatisticsView, AccountCenterSecurityView, AccountCenterActivityView
)
from .admin_clients_views import (
    AdminClientListView, AdminClientDetailView, AdminClientStatusUpdateView, 
    AdminClientResetPasswordView, AdminClientImpersonateView,
    AdminClientExportView, AdminClientNotifyView, AdminClientActivityReportView
)

urlpatterns = [
    # JWT authentication (customized)
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Custom registration and profile endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/profile/', ProfileView.as_view(), name='auth_profile'),
    
    # Social Login
    path('auth/social/', SocialLoginView.as_view(), name='auth_social'),
    
    # Security logs
    path('auth/sessions/', SessionLogsListView.as_view(), name='auth_sessions'),
    path('auth/sessions/<int:pk>/', SessionLogDestroyView.as_view(), name='auth_session_destroy'),
    path('auth/login-history/', LoginHistoryListView.as_view(), name='auth_login_history'),

    # Security/activation flows
    path('auth/verify-email/', VerifyEmailView.as_view(), name='auth_verify_email'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='auth_forgot_password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth_reset_password'),

    # Account Center & Security
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('auth/email/request-change/', EmailChangeRequestView.as_view(), name='auth_email_request_change'),
    path('auth/phone/request-otp/', PhoneOTPRequestView.as_view(), name='auth_phone_request_otp'),
    path('auth/phone/verify-otp/', PhoneOTPVerifyView.as_view(), name='auth_phone_verify_otp'),
    path('auth/logout-all/', LogoutAllSessionsView.as_view(), name='auth_logout_all'),
    path('auth/delete-request/', DeleteAccountRequestView.as_view(), name='auth_delete_request'),
    path('account-center/profile/', AccountCenterProfileView.as_view(), name='account_center_profile'),
    path('account-center/subscription/', AccountCenterSubscriptionView.as_view(), name='account_center_subscription'),
    path('account-center/statistics/', AccountCenterStatisticsView.as_view(), name='account_center_statistics'),
    path('account-center/security/', AccountCenterSecurityView.as_view(), name='account_center_security'),
    path('account-center/activity/', AccountCenterActivityView.as_view(), name='account_center_activity'),


    # Dashboard stats
    path('dashboard/client-summary/', ClientSummaryView.as_view(), name='dashboard_client_summary'),
    path('dashboard/admin-summary/', AdminSummaryView.as_view(), name='dashboard_admin_summary'),
    path('dashboard/system-health/', SystemHealthView.as_view(), name='dashboard_system_health'),

    # Admin roles and users
    path('admin/roles/', AdminRoleListCreateView.as_view(), name='admin_roles_list_create'),
    path('admin/roles/<int:pk>/', AdminRoleDetailView.as_view(), name='admin_roles_detail'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_users_list'),
    path('admin/users/search/', AdminUserSearchView.as_view(), name='admin_users_search'),
    path('admin/managers/assign-role/', AdminAssignManagerView.as_view(), name='admin_managers_assign'),
    path('admin/managers/<int:pk>/change-role/', AdminChangeManagerRoleView.as_view(), name='admin_managers_change'),
    path('admin/managers/<int:pk>/remove-admin/', AdminRemoveManagerView.as_view(), name='admin_managers_remove'),

    # Admin Clients Management
    path('admin/clients/', AdminClientListView.as_view(), name='admin_clients_list'),
    path('admin/clients/<int:pk>/', AdminClientDetailView.as_view(), name='admin_clients_detail'),
    path('admin/clients/<int:pk>/status/', AdminClientStatusUpdateView.as_view(), name='admin_clients_status'),
    path('admin/clients/<int:pk>/reset-password/', AdminClientResetPasswordView.as_view(), name='admin_clients_reset_password'),
    path('admin/clients/<int:pk>/impersonate/', AdminClientImpersonateView.as_view(), name='admin_clients_impersonate'),
    path('admin/clients/export/', AdminClientExportView.as_view(), name='admin_clients_export'),
    path('admin/clients/notify/', AdminClientNotifyView.as_view(), name='admin_clients_notify'),
    path('admin/clients/activity/', AdminClientActivityReportView.as_view(), name='admin_clients_activity'),
]
