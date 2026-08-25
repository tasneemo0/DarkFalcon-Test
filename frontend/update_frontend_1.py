import re

with open('app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update states
state_old = '''  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);
  const [twoStepEnabled, setTwoStepEnabled] = useState(false);
  const [twoStepPassword, setTwoStepPassword] = useState('');
  const [restrictIp, setRestrictIp] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);'''

state_new = '''  const [editEmail, setEditEmail] = useState('');
  const [editEmailOtp, setEditEmailOtp] = useState('');
  const [isEmailOtpModalOpen, setIsEmailOtpModalOpen] = useState(false);

  const [editPhone, setEditPhone] = useState('');
  const [editPhoneOtp, setEditPhoneOtp] = useState('');
  const [isPhoneOtpModalOpen, setIsPhoneOtpModalOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [twoFactor, setTwoFactor] = useState(false);
  
  const [restrictIp, setRestrictIp] = useState(false);
  const [allowedIps, setAllowedIps] = useState('');

  const [sessionLogs, setSessionLogs] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [notifyNewLogin, setNotifyNewLogin] = useState(true);
  const [notifyPasswordChange, setNotifyPasswordChange] = useState(true);
  const [notifyPackageExpiry, setNotifyPackageExpiry] = useState(true);
  const [notifyWhatsappDisconnect, setNotifyWhatsappDisconnect] = useState(true);
  const [notifyWebhookFailure, setNotifyWebhookFailure] = useState(true);'''

content = content.replace(state_old, state_new)

# 2. Update fetchClientData
fetch_old = '''      const lh = await fetchWithAuth('/api/v1/auth/login-history/');
      setLoginHistory(lh);'''

fetch_new = '''      const lh = await fetchWithAuth('/api/v1/auth/login-history/');
      setLoginHistory(lh);
      const al = await fetchWithAuth('/api/v1/auth/audit-logs/').catch(() => []);
      setAuditLogs(al);'''

content = content.replace(fetch_old, fetch_new)

# 3. Update useEffect
useEffect_old = '''    if (user?.profile) {
      setEditEmail(user.email);
      setTwoFactor(user.profile.two_factor_enabled);
      setTwoStepEnabled(user.profile.two_step_enabled);
      setRestrictIp(user.profile.restrict_ip_enabled);
    }'''

useEffect_new = '''    if (user?.profile) {
      setEditEmail(user.email);
      setEditPhone(user.profile.phone_number || '');
      setTwoFactor(user.profile.two_factor_enabled);
      setRestrictIp(user.profile.restrict_ip_enabled);
      setAllowedIps(user.profile.allowed_ips || '');
      setNotifyNewLogin(user.profile.notify_new_login ?? true);
      setNotifyPasswordChange(user.profile.notify_password_change ?? true);
      setNotifyPackageExpiry(user.profile.notify_package_expiry ?? true);
      setNotifyWhatsappDisconnect(user.profile.notify_whatsapp_disconnect ?? true);
      setNotifyWebhookFailure(user.profile.notify_webhook_failure ?? true);
    }'''

content = content.replace(useEffect_old, useEffect_new)

with open('app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
