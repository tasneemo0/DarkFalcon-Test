# -*- coding: utf-8 -*-
import re

with open('app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

handlers_old = '''  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { email: editEmail };
      if (editPassword) payload.password = editPassword;

      const updated = await fetchWithAuth('/api/v1/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      setUser(updated);
      setEditPassword('');
      alert(locale === 'ar' ? 'تم تحديث معلومات الحساب بنجاح' : 'Account updated successfully');
    } catch (e) {
      alert('Failed to update credentials');
    }
  };

  const handleToggleSecurity = async (field: string, val: boolean) => {
    try {
      const payload: any = {};
      if (field === '2fa') payload.two_factor_enabled = val;
      if (field === '2step') {
        payload.two_step_enabled = val;
        if (val && twoStepPassword) payload.two_step_password = twoStepPassword;
      }
      if (field === 'ip') payload.restrict_ip_enabled = val;

      const updated = await fetchWithAuth('/api/v1/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      setUser(updated);
      alert(locale === 'ar' ? 'تم حفظ التعديلات الأمنية بنجاح' : 'Security settings updated successfully');
    } catch (e) {
      alert('Failed to update security toggles');
    }
  };'''

handlers_new = '''  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editPassword !== confirmPassword) {
      alert(locale === 'ar' ? 'كلمة المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    try {
      await fetchWithAuth('/api/v1/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: editPassword
        })
      });
      setCurrentPassword('');
      setEditPassword('');
      setConfirmPassword('');
      alert(locale === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
    } catch (e: any) {
      alert(e.message || 'Failed to update password');
    }
  };

  const handleChangeEmailRequest = async () => {
    try {
      await fetchWithAuth('/api/v1/auth/change-email/request/', {
        method: 'POST',
        body: JSON.stringify({ new_email: editEmail })
      });
      setIsEmailOtpModalOpen(true);
    } catch (e: any) {
      alert(e.message || 'Failed to request email change');
    }
  };

  const handleChangeEmailVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/api/v1/auth/change-email/verify/', {
        method: 'POST',
        body: JSON.stringify({ otp: editEmailOtp })
      });
      setIsEmailOtpModalOpen(false);
      setEditEmailOtp('');
      const updated = await fetchWithAuth('/api/v1/auth/profile/');
      setUser(updated);
      alert(locale === 'ar' ? 'تم تغيير البريد الإلكتروني بنجاح' : 'Email changed successfully');
    } catch (e: any) {
      alert(e.message || 'Failed to verify email');
    }
  };

  const handleChangePhoneRequest = async () => {
    try {
      await fetchWithAuth('/api/v1/auth/change-phone/request/', {
        method: 'POST',
        body: JSON.stringify({ new_phone: editPhone })
      });
      setIsPhoneOtpModalOpen(true);
    } catch (e: any) {
      alert(e.message || 'Failed to request phone change');
    }
  };

  const handleChangePhoneVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/api/v1/auth/change-phone/verify/', {
        method: 'POST',
        body: JSON.stringify({ otp: editPhoneOtp })
      });
      setIsPhoneOtpModalOpen(false);
      setEditPhoneOtp('');
      const updated = await fetchWithAuth('/api/v1/auth/profile/');
      setUser(updated);
      alert(locale === 'ar' ? 'تم تغيير رقم الهاتف بنجاح' : 'Phone changed successfully');
    } catch (e: any) {
      alert(e.message || 'Failed to verify phone');
    }
  };

  const handleToggleSecurity = async (field: string, val: boolean) => {
    try {
      const payload: any = {};
      if (field === '2fa') payload.two_factor_enabled = val;
      if (field === 'ip') payload.restrict_ip_enabled = val;
      if (field === 'notify_new_login') payload.notify_new_login = val;
      if (field === 'notify_password_change') payload.notify_password_change = val;
      if (field === 'notify_package_expiry') payload.notify_package_expiry = val;
      if (field === 'notify_whatsapp_disconnect') payload.notify_whatsapp_disconnect = val;
      if (field === 'notify_webhook_failure') payload.notify_webhook_failure = val;

      const updated = await fetchWithAuth('/api/v1/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      setUser(updated);
      if (field !== 'notify_new_login' && field !== 'notify_password_change' && field !== 'notify_package_expiry' && field !== 'notify_whatsapp_disconnect' && field !== 'notify_webhook_failure') {
          alert(locale === 'ar' ? 'تم حفظ التعديلات الأمنية بنجاح' : 'Security settings updated successfully');
      }
    } catch (e) {
      alert('Failed to update security toggles');
    }
  };

  const handleSaveAllowedIps = async () => {
    try {
      const updated = await fetchWithAuth('/api/v1/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify({ allowed_ips: allowedIps })
      });
      setUser(updated);
      alert(locale === 'ar' ? 'تم حفظ التعديلات الأمنية بنجاح' : 'Security settings updated successfully');
    } catch (e) {
      alert('Failed to update allowed IPs');
    }
  };

  const handleLogoutDevice = async (sessionId: number) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من تسجيل الخروج من هذا الجهاز؟' : 'Are you sure you want to log out from this device?')) return;
    try {
      await fetchWithAuth(/api/v1/auth/sessions//logout/, { method: 'DELETE' });
      setSessionLogs(prev => prev.filter(s => s.id !== sessionId));
    } catch (e) {
      alert('Failed to logout device');
    }
  };'''

content = content.replace(handlers_old, handlers_new)

with open('app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
