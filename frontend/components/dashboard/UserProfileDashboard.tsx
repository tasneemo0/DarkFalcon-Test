import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/context';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Lock, LogOut, CheckCircle, Shield,
  Key, AlertCircle, Smartphone, Activity, MapPin,
  Clock, Package, Bot, Webhook, MessageCircle, Settings, X, Edit2, AlertTriangle, Infinity, RotateCcw,
  Eye, EyeOff, ChevronLeft, ChevronRight, Globe, Moon
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { PremiumStatCard, PremiumCardWrapper } from '@/components/dashboard/PremiumCard';

function useCountUp(target: number, duration = 700, enabled = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled || target === 0) {
      setCount(target);
      return;
    }
    let startTimestamp: number | null = null;
    let timer: any;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      if (progress >= 0) {
        setCount(Math.floor(progress * target));
      }

      if (progress < 1) {
        timer = window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    timer = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(timer);
  }, [target, duration, enabled]);

  return count;
}

export default function UserProfileDashboard({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { locale, token, logout } = useApp();

  const [profile, setProfile] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [security, setSecurity] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);

  const [loading, setLoading] = useState({
    profile: true,
    statistics: true,
    subscription: true,
    security: true,
    activity: true
  });

  const [errors, setErrors] = useState({
    profile: null as string | null,
    statistics: null as string | null,
    subscription: null as string | null,
    security: null as string | null,
    activity: null as string | null
  });

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [sessionsData, setSessionsData] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [isLoginHistoryModalOpen, setIsLoginHistoryModalOpen] = useState(false);
  const [loginHistoryData, setLoginHistoryData] = useState<any[]>([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [loginHistoryError, setLoginHistoryError] = useState<string | null>(null);

  const [isFullActivityModalOpen, setIsFullActivityModalOpen] = useState(false);
  const [fullActivityData, setFullActivityData] = useState<any[]>([]);
  const [fullActivityLoading, setFullActivityLoading] = useState(false);
  const [fullActivityError, setFullActivityError] = useState<string | null>(null);

  const [newPhone, setNewPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const [deletePass, setDeletePass] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPass, setEmailPass] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const headers: any = {
      'Authorization': `Bearer ${token || localStorage.getItem('df-token')}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (res.status === 401) {
      logout();
      throw new Error('Session expired');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'API Request Failed');
    }
    return res.json();
  };

  const loadSection = async (key: keyof typeof loading, endpoint: string) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: null }));
    try {
      const res = await fetchWithAuth(endpoint);
      if (key === 'profile') setProfile(res);
      if (key === 'statistics') setStatistics(res);
      if (key === 'subscription') setSubscription(res);
      if (key === 'security') setSecurity(res);
      if (key === 'activity') setActivity(res);
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [key]: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const loadAllData = () => {
    loadSection('profile', '/api/v1/account-center/profile/');
    loadSection('statistics', '/api/v1/account-center/statistics/');
    loadSection('subscription', '/api/v1/account-center/subscription/');
    loadSection('security', '/api/v1/account-center/security/');
    loadSection('activity', '/api/v1/account-center/activity/');
  };

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const requestOtp = async () => {
    if (!newPhone) return;
    try {
      setPhoneLoading(true);
      setPhoneError(null);
      await fetchWithAuth('/api/v1/auth/phone/request-otp/', { method: 'POST', body: JSON.stringify({ phone_number: newPhone }) });
      setOtpSent(true);
      showToast(locale === 'ar' ? 'تم إرسال الرمز' : 'OTP sent', 'success');
    } catch (err: any) {
      setPhoneError(err.message);
    } finally {
      setPhoneLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length < 6) return;
    try {
      setPhoneLoading(true);
      setPhoneError(null);
      await fetchWithAuth('/api/v1/auth/phone/verify-otp/', { method: 'POST', body: JSON.stringify({ phone_number: newPhone, otp }) });
      showToast(locale === 'ar' ? 'تم تحديث الرقم بنجاح' : 'Phone updated successfully', 'success');
      setIsPhoneModalOpen(false); setOtpSent(false); setNewPhone(''); setOtp('');
      loadSection('profile', '/api/v1/account-center/profile/');
    } catch (err: any) {
      setPhoneError(err.message);
    } finally {
      setPhoneLoading(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPassError(locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    try {
      setPassLoading(true);
      setPassError(null);
      await fetchWithAuth('/api/v1/auth/change-password/', { method: 'POST', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
      showToast(locale === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed', 'success');
      setIsPasswordModalOpen(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      loadSection('security', '/api/v1/account-center/security/');
    } catch (err: any) {
      setPassError(err.message);
    } finally {
      setPassLoading(false);
    }
  };

  const requestDeletion = async () => {
    const confirmTarget = locale === 'ar' ? 'حذف حسابي' : 'delete my account';
    if (deleteConfirmText !== confirmTarget) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await fetchWithAuth('/api/v1/auth/delete-request/', { method: 'POST', body: JSON.stringify({ password: deletePass }) });
      showToast(locale === 'ar' ? 'تم تقديم الطلب بنجاح' : 'Request submitted successfully', 'success');
      setIsDeleteModalOpen(false); setDeletePass(''); setDeleteConfirmText('');
      loadSection('profile', '/api/v1/account-center/profile/');
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const updateName = async () => {
    if (!newName) return;
    try {
      setNameLoading(true);
      setNameError(null);
      await fetchWithAuth('/api/v1/account-center/profile/', { method: 'PATCH', body: JSON.stringify({ full_name: newName }) });
      showToast(locale === 'ar' ? 'تم تحديث الاسم بنجاح' : 'Name updated successfully', 'success');
      setIsNameModalOpen(false);
      loadSection('profile', '/api/v1/account-center/profile/');
    } catch (err: any) {
      setNameError(err.message);
    } finally {
      setNameLoading(false);
    }
  };

  const updateEmail = async () => {
    if (!newEmail) return;
    try {
      setEmailLoading(true);
      setEmailError(null);
      await fetchWithAuth('/api/v1/auth/email/request-change/', { method: 'POST', body: JSON.stringify({ new_email: newEmail, password: emailPass }) });
      showToast(locale === 'ar' ? 'تم إرسال رابط التأكيد' : 'Confirmation link sent', 'success');
      setIsEmailModalOpen(false);
    } catch (err: any) {
      setEmailError(err.message);
    } finally {
      setEmailLoading(false);
    }
  };

  const logoutAll = async () => {
    if (!window.confirm(locale === 'ar' ? 'هل أنت متأكد من تسجيل الخروج من جميع الأجهزة؟' : 'Are you sure you want to log out from all devices?')) return;
    try {
      await fetchWithAuth('/api/v1/auth/logout-all/', { method: 'POST' });
      showToast(locale === 'ar' ? 'تم تسجيل الخروج من باقي الأجهزة' : 'Logged out from other devices', 'success');
      loadSection('security', '/api/v1/account-center/security/');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      const res = await fetchWithAuth('/api/v1/auth/sessions/');
      setSessionsData(res);
    } catch (err: any) {
      setSessionsError(err.message);
    } finally {
      setSessionsLoading(false);
    }
  };

  const terminateSession = async (id: number) => {
    try {
      await fetchWithAuth(`/api/v1/auth/sessions/${id}/`, { method: 'DELETE' });
      setSessionsData(prev => prev.filter(s => s.id !== id));
      showToast(locale === 'ar' ? 'تم إنهاء الجلسة' : 'Session terminated', 'success');
      loadSection('security', '/api/v1/account-center/security/');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const loadLoginHistory = async () => {
    try {
      setLoginHistoryLoading(true);
      setLoginHistoryError(null);
      const res = await fetchWithAuth('/api/v1/auth/login-history/');
      setLoginHistoryData(res);
    } catch (err: any) {
      setLoginHistoryError(err.message);
    } finally {
      setLoginHistoryLoading(false);
    }
  };

  const loadFullActivity = async () => {
    try {
      setFullActivityLoading(true);
      setFullActivityError(null);
      const res = await fetchWithAuth('/api/v1/account-center/activity/?limit=50');
      setFullActivityData(res);
    } catch (err: any) {
      setFullActivityError(err.message);
    } finally {
      setFullActivityLoading(false);
    }
  };

  const translateActivity = (raw: string) => {
    if (raw === 'success') return locale === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful';
    if (raw === 'password_changed') return locale === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed';
    if (raw === 'phone_verified') return locale === 'ar' ? 'تم التحقق من رقم الهاتف' : 'Phone verified';
    if (raw === 'logout_all') return locale === 'ar' ? 'تسجيل الخروج من جميع الأجهزة' : 'Logout from all devices';
    if (raw.includes('/api/v1/whatsapp/send')) return locale === 'ar' ? 'تم إرسال رسالة واتساب' : 'WhatsApp message sent';
    if (raw.includes('/api/v1/whatsapp/webhook')) return locale === 'ar' ? 'تم إنشاء/تحديث Webhook' : 'Webhook created/updated';
    if (raw.includes('/api/v1/billing')) return locale === 'ar' ? 'تحديث الباقة والاشتراك' : 'Subscription updated';
    if (raw.includes('/api/v1/whatsapp/bot')) return locale === 'ar' ? 'تم تعديل إعدادات البوت' : 'Bot settings updated';
    return raw;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return locale === 'ar' ? 'غير متوفر' : 'N/A';
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(new Date(dateStr));
  };

  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return locale === 'ar' ? 'غير متوفر' : 'N/A';
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(dateStr));
  };

  if (loading.profile && !profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="spinner"></div>
        <style jsx>{`.spinner { width: 40px; height: 40px; border: 3px solid rgba(var(--primary-rgb), 0.3); border-radius: 50%; border-top-color: var(--primary); animation: spin 1s ease-in-out infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (errors.profile) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--danger)' }} />
        <p>{errors.profile}</p>
        <button className="btn btn-primary" onClick={() => loadSection('profile', '/api/v1/account-center/profile/')} style={{ marginTop: '16px' }}>
          <RotateCcw size={16} style={{ marginRight: locale === 'ar' ? 0 : '8px', marginLeft: locale === 'ar' ? '8px' : 0 }} />
          {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  const pwdStrength = checkPasswordStrength(newPassword, locale);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>

      {/* PREMIUM TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: locale === 'ar' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'fixed', top: '24px', left: locale === 'ar' ? '24px' : 'auto', right: locale === 'ar' ? 'auto' : '24px',
              background: 'var(--surface)', border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              padding: '12px 20px', borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 9999,
              display: 'flex', alignItems: 'center', gap: '12px'
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={20} color="var(--success)" /> : <AlertCircle size={20} color="var(--danger)" />}
            <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. COMPACT HERO SECTION */}
      <PremiumCardWrapper className="card-section" style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-hover) 100%)',
        borderRadius: 'var(--radius-xl)', padding: '24px',
        display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1
      }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #a855f7)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '32px', fontWeight: 700, flexShrink: 0, boxShadow: '0 8px 24px rgba(var(--primary-rgb), 0.3)' }}>
          {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : <User size={40} />}
        </div>

        <div style={{ flex: 1, minWidth: '250px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{profile.full_name || 'User'}</h1>
            {profile.account_status === 'active' && <span style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> {locale === 'ar' ? 'نشط' : 'Active'}</span>}
            <span style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Package size={12} /> {profile.account_type === 'professional' ? (locale === 'ar' ? 'حساب مدفوع' : 'Pro Account') : (locale === 'ar' ? 'حساب تجريبي' : 'Trial Account')}</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }} dir="ltr"><Mail size={14} /> {profile.email} {profile.is_email_verified && <CheckCircle size={14} color="var(--success)" />}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }} dir="ltr"><Phone size={14} /> {profile.phone_number || (locale === 'ar' ? 'غير محدد' : 'Not set')} {profile.phone_number ? <CheckCircle size={14} color="var(--success)" /> : <AlertCircle size={14} color="var(--warning)" />}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {locale === 'ar' ? 'عضو منذ' : 'Member since'} {formatShortDate(profile.member_since)}</span>
          </div>
        </div>
      </PremiumCardWrapper>

      {/* 2. KPI STATISTICS */}
      <section>
        {loading.statistics ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '110px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', animation: 'pulse 2s infinite' }} />)}
          </div>
        ) : errors.statistics ? (
          <ErrorFallback message={errors.statistics} onRetry={() => loadSection('statistics', '/api/v1/account-center/statistics/')} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <PremiumStatCard title={locale === 'ar' ? 'أجهزة واتساب' : 'WhatsApp Devices'} value={statistics.total_devices} subtitle={`${statistics.connected_devices} ${locale === 'ar' ? 'متصلة' : 'connected'}`} icon={<Smartphone size={24} />} color="primary" />
            <PremiumStatCard title={locale === 'ar' ? 'الرسائل اليوم' : 'Messages Today'} value={statistics.messages_sent_today + statistics.messages_received_today} subtitle={`${statistics.messages_sent_today} ${locale === 'ar' ? 'مرسلة' : 'sent'} / ${statistics.messages_received_today} ${locale === 'ar' ? 'مستلمة' : 'received'}`} icon={<MessageCircle size={24} />} color="success" />
            <PremiumStatCard title={locale === 'ar' ? 'آخر 7 أيام' : 'Last 7 Days'} value={statistics.messages_last_7_days} subtitle={locale === 'ar' ? 'إجمالي الرسائل' : 'total messages'} icon={<Activity size={24} />} color="info" />
            <PremiumStatCard title={locale === 'ar' ? 'رسائل فاشلة' : 'Failed Messages'} value={statistics.failed_messages} subtitle={locale === 'ar' ? 'تتطلب الانتباه' : 'requires attention'} icon={<AlertTriangle size={24} />} color="danger" />
            <PremiumStatCard title={locale === 'ar' ? 'قواعد البوت' : 'Bot Rules'} value={statistics.bot_rules} subtitle={locale === 'ar' ? 'فعالة' : 'active'} icon={<Bot size={24} />} color="warning" />
            <PremiumStatCard title={locale === 'ar' ? 'Webhooks' : 'Webhooks'} value={statistics.webhooks_enabled} subtitle={locale === 'ar' ? 'مفعلة' : 'enabled'} icon={<Webhook size={24} />} color="info" />
          </div>
        )}
      </section>

      {/* 3. SETTINGS & SUBSCRIPTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

        {/* ACCOUNT SETTINGS */}
        <PremiumCardWrapper className="card-section" style={{ zIndex: 1 }}>
          <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Settings size={18} color="var(--primary)" /> {locale === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{locale === 'ar' ? 'إدارة معلومات حسابك وتفضيلاتك' : 'Manage your account information and preferences'}</p>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <SettingRow
              icon={<User size={20} />}
              label={locale === 'ar' ? 'الاسم' : 'Name'}
              value={profile.full_name || <span style={{ color: 'var(--text-secondary)' }}>{locale === 'ar' ? 'لم يتم إضافة الاسم' : 'Name not added'}</span>}
              action={profile.full_name ? (locale === 'ar' ? 'تعديل' : 'Edit') : (locale === 'ar' ? 'إضافة الاسم' : 'Add Name')}
              onClick={() => { setIsNameModalOpen(true); setNewName(profile.full_name || ''); }}
            />
            <SettingRow
              icon={<Phone size={20} />}
              label={locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              value={
                profile.phone_number ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span dir="ltr">{profile.phone_number}</span>
                    <span className="badge-success"><CheckCircle size={12} /> {locale === 'ar' ? 'موثق' : 'Verified'}</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>{locale === 'ar' ? 'غير محدد' : 'Not set'}</span>
                )
              }
              action={profile.phone_number ? (locale === 'ar' ? 'تغيير الرقم' : 'Change Phone') : (locale === 'ar' ? '+ إضافة رقم' : '+ Add Phone')}
              onClick={() => setIsPhoneModalOpen(true)}
            />
            <SettingRow
              icon={<Mail size={20} />}
              label={locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span dir="ltr">{profile.email}</span>
                  {profile.is_email_verified && <span className="badge-success"><CheckCircle size={12} /> {locale === 'ar' ? 'موثق' : 'Verified'}</span>}
                </div>
              }
              action={locale === 'ar' ? 'تغيير' : 'Change'}
              onClick={() => { setIsEmailModalOpen(true); setNewEmail(''); setEmailPass(''); }}
            />
            <SettingRow
              icon={<Key size={20} />}
              label={locale === 'ar' ? 'كلمة المرور' : 'Password'}
              value={
                security && security.last_password_change ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ letterSpacing: '2px' }}>••••••••••</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{locale === 'ar' ? 'تم تعيين كلمة مرور' : 'Password is set'}</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>{locale === 'ar' ? 'تسجيل الدخول عبر مزود خارجي' : 'External login provider'}</span>
                )
              }
              action={locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
              onClick={() => setIsPasswordModalOpen(true)}
            />
          </div>
        </PremiumCardWrapper>

        {/* PREFERENCES */}
        <PremiumCardWrapper className="card-section" style={{ marginTop: '24px', zIndex: 1 }}>
          <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="var(--primary)" /> {locale === 'ar' ? 'التفضيلات' : 'Preferences'}
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <SettingRow
              icon={<Globe size={20} />}
              label={locale === 'ar' ? 'اللغة' : 'Language'}
              value={locale === 'ar' ? 'العربية' : 'English'}
              action={locale === 'ar' ? 'تغيير' : 'Change'}
              onClick={() => showToast(locale === 'ar' ? 'سيتم تفعيل الميزة قريباً' : 'Feature coming soon', 'success')}
            />
            <SettingRow
              icon={<Moon size={20} />}
              label={locale === 'ar' ? 'المظهر' : 'Theme'}
              value={locale === 'ar' ? 'داكن' : 'Dark'}
              action={locale === 'ar' ? 'تغيير' : 'Change'}
              onClick={() => showToast(locale === 'ar' ? 'سيتم تفعيل الميزة قريباً' : 'Feature coming soon', 'success')}
            />
            <SettingRow
              icon={<Clock size={20} />}
              label={locale === 'ar' ? 'المنطقة الزمنية' : 'Timezone'}
              value={<span dir="ltr">{profile.timezone || 'Asia/Riyadh'}</span>}
              action={locale === 'ar' ? 'تغيير' : 'Change'}
              onClick={() => showToast(locale === 'ar' ? 'سيتم تفعيل الميزة قريباً' : 'Feature coming soon', 'success')}
            />
          </div>
        </PremiumCardWrapper>

        {/* SUBSCRIPTION */}
        <PremiumCardWrapper className="card-section" style={{ zIndex: 1 }}>
          <div className="card-header"><Package size={18} color="var(--primary)" /> <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{locale === 'ar' ? 'الباقة والاشتراك' : 'Plan & Subscription'}</h3></div>
          <div className="card-body">
            {loading.subscription ? (
              <div style={{ height: '150px', animation: 'pulse 2s infinite', background: 'var(--bg-secondary)', borderRadius: '8px' }} />
            ) : errors.subscription ? (
              <ErrorFallback message={errors.subscription} onRetry={() => loadSection('subscription', '/api/v1/account-center/subscription/')} />
            ) : subscription ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>{subscription.plan_name} <span style={{ fontSize: '12px', background: 'rgba(var(--primary-rgb), 0.1)', padding: '2px 8px', borderRadius: '12px' }}>{locale === 'ar' ? 'نشطة' : 'Active'}</span></span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{subscription.price} {locale === 'ar' ? 'ر.س' : 'SAR'} / {subscription.duration_days} {locale === 'ar' ? 'يوم' : 'days'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  <span>{formatShortDate(subscription.starts_at)} — {formatShortDate(subscription.expires_at)}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{subscription.days_remaining} {locale === 'ar' ? 'أيام متبقية' : 'days left'}</span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span>{locale === 'ar' ? 'استهلاك الرسائل' : 'Messages Usage'}</span>
                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {subscription.is_unlimited ? <><Infinity size={14} /> {locale === 'ar' ? 'غير محدود' : 'Unlimited'}</> : `${subscription.usage.messages_used.toLocaleString()} / ${subscription.usage.messages_limit.toLocaleString()}`}
                    </span>
                  </div>
                  {!subscription.is_unlimited && (
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (subscription.usage.messages_used / subscription.usage.messages_limit) * 100)}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {Object.entries(subscription.features).map(([key, val]) => (
                    val ? <span key={key} style={{ fontSize: '11px', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={10} color="var(--success)" /> {key.toUpperCase()}</span> : null
                  ))}
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { if (onNavigate) onNavigate('billing'); }}>
                  {locale === 'ar' ? 'ترقية الباقة' : 'Upgrade Plan'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>{locale === 'ar' ? 'لا يوجد اشتراك نشط' : 'No active subscription'}</div>
            )}
          </div>
        </PremiumCardWrapper>

      </div>

      {/* 4. SECURITY & ACTIVITY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

        {/* SECURITY */}
        <PremiumCardWrapper className="card-section" style={{ zIndex: 1 }}>
          <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--primary)" /> {locale === 'ar' ? 'الأمان والتحقق' : 'Security & Verification'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{locale === 'ar' ? 'راقب حالة أمان حسابك ووسائل التحقق' : 'Monitor your account security and verification methods'}</p>
          </div>
          <div className="card-body">
            {loading.security ? (
              <div style={{ height: '150px', animation: 'pulse 2s infinite', background: 'var(--bg-secondary)', borderRadius: '16px' }} />
            ) : errors.security ? (
              <ErrorFallback message={errors.security} onRetry={() => loadSection('security', '/api/v1/account-center/security/')} />
            ) : (
              <div>
                <div className="security-cards-grid">
                  <div className="security-mini-card">
                    <div className="security-mini-icon"><Mail size={16} /></div>
                    <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 4px 0', fontWeight: 500 }}>{locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</h4>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '8px', wordBreak: 'break-all' }} dir="ltr">{profile.email}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginBottom: '16px' }}>
                      {profile.is_email_verified ? <><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} /> <span style={{ color: 'var(--success)' }}>{locale === 'ar' ? 'موثق' : 'Verified'}</span></> : <><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)' }} /> <span style={{ color: 'var(--warning)' }}>{locale === 'ar' ? 'غير موثق' : 'Unverified'}</span></>}
                    </div>
                    <button className="security-mini-btn" onClick={() => { setIsEmailModalOpen(true); setNewEmail(''); setEmailPass(''); }}>
                      {profile.is_email_verified ? (locale === 'ar' ? 'تغيير' : 'Change') : (locale === 'ar' ? 'توثيق' : 'Verify')}
                    </button>
                  </div>

                  <div className="security-mini-card">
                    <div className="security-mini-icon"><Phone size={16} /></div>
                    <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 4px 0', fontWeight: 500 }}>{locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</h4>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '8px' }} dir="ltr">{profile.phone_number || (locale === 'ar' ? 'غير مضاف' : 'Not added')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginBottom: '16px' }}>
                      {profile.phone_number ? <><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} /> <span style={{ color: 'var(--success)' }}>{locale === 'ar' ? 'موثق' : 'Verified'}</span></> : <><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)' }} /> <span style={{ color: 'var(--warning)' }}>{locale === 'ar' ? 'غير موثق' : 'Unverified'}</span></>}
                    </div>
                    <button className="security-mini-btn" onClick={() => setIsPhoneModalOpen(true)}>
                      {profile.phone_number ? (locale === 'ar' ? 'تغيير الرقم' : 'Change Phone') : (locale === 'ar' ? 'إضافة وتوثيق' : 'Add & Verify')}
                    </button>
                  </div>

                  <div className="security-mini-card">
                    <div className="security-mini-icon"><Smartphone size={16} /></div>
                    <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 4px 0', fontWeight: 500 }}>{locale === 'ar' ? 'الجلسات النشطة (30 يوم)' : 'Active Sessions (30d)'}</h4>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{security.active_sessions > 0 ? security.active_sessions : 0}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{locale === 'ar' ? 'جلسة نشطة' : 'Active sessions'}</div>
                    <button className="security-mini-btn" onClick={() => { setIsSessionsModalOpen(true); loadSessions(); }}>
                      {locale === 'ar' ? 'إدارة الجلسات' : 'Manage Sessions'}
                    </button>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{locale === 'ar' ? 'آخر تسجيل دخول' : 'Last Login'}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span dir="ltr">{formatDate(security.last_login_time)}</span>
                      {/* {security.last_login_ip && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: '4px' }} dir="ltr">IP: {security.last_login_ip}</span>} */}
                    </div>
                  </div>
                  <button onClick={() => { setIsLoginHistoryModalOpen(true); loadLoginHistory(); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                    {locale === 'ar' ? 'عرض التفاصيل ←' : 'View Details →'}
                  </button>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, margin: '0 0 12px 0' }}>{locale === 'ar' ? 'إجراءات الأمان' : 'Security Actions'}</h4>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" style={{ fontSize: '13px' }} onClick={() => setIsPasswordModalOpen(true)}>{locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</button>
                    <button className="btn btn-outline" style={{ fontSize: '13px' }} onClick={() => { setIsSessionsModalOpen(true); loadSessions(); }}>{locale === 'ar' ? 'إدارة الجلسات' : 'Manage Sessions'}</button>
                    <button className="btn btn-outline" style={{ fontSize: '13px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={logoutAll}>{locale === 'ar' ? 'تسجيل الخروج من جميع الأجهزة' : 'Logout all devices'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PremiumCardWrapper>

        {/* RECENT ACTIVITY */}
        <PremiumCardWrapper className="card-section" style={{ zIndex: 1 }}>
          <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--primary)" /> {locale === 'ar' ? 'سجل النشاط المختصر' : 'Recent Activity'}
            </h3>
          </div>
          <div className="card-body">
            {loading.activity ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: '40px', background: 'var(--bg-secondary)', borderRadius: '4px', animation: 'pulse 2s infinite' }} />)}
              </div>
            ) : errors.activity ? (
              <ErrorFallback message={errors.activity} onRetry={() => loadSection('activity', '/api/v1/account-center/activity/')} />
            ) : activity && activity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activity.slice(0, 5).map((act: any) => (
                  <div key={act.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                      {act.type === 'auth' ? <Shield size={12} color="var(--primary)" /> : <Activity size={12} color="var(--success)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 2px 0', color: 'var(--text-primary)' }}>{translateActivity(act.raw_action)}</p>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <span dir="ltr">{formatDate(act.timestamp)}</span>
                        {act.ip && <span dir="ltr">IP: {act.ip}</span>}
                      </div>
                    </div>
                  </div>
                ))}

                <button onClick={() => { setIsFullActivityModalOpen(true); loadFullActivity(); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '16px 0 0 0', textAlign: locale === 'ar' ? 'right' : 'left' }}>
                  {locale === 'ar' ? 'عرض سجل النشاط بالكامل ←' : 'View Full Activity Log →'}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>{locale === 'ar' ? 'لا توجد نشاطات' : 'No activity'}</div>
            )}
          </div>
        </PremiumCardWrapper>

      </div>

      {/* DANGER ZONE */}
      <PremiumCardWrapper className="card-section" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', zIndex: 1 }}>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '16px 24px' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--danger)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} /> {locale === 'ar' ? 'منطقة الخطر: حذف الحساب' : 'Danger Zone: Delete Account'}</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              {profile.deletion_requested ?
                (locale === 'ar' ? 'تم تسجيل طلب حذف حسابك. سيتم التواصل معك قريباً لتأكيد الحذف.' : 'Account deletion requested. We will contact you soon.') :
                (locale === 'ar' ? 'الإجراءات الحساسة المتعلقة بالحساب.' : 'Sensitive account actions.')}
            </p>
          </div>
          {!profile.deletion_requested && (
            <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setIsDeleteModalOpen(true)}>
              {locale === 'ar' ? 'طلب حذف الحساب' : 'Request Deletion'}
            </button>
          )}
        </div>
      </PremiumCardWrapper>

      {/* MODALS */}
      <PremiumModal
        isOpen={isPhoneModalOpen}
        onClose={() => { setIsPhoneModalOpen(false); setOtpSent(false); setPhoneError(null); }}
        title={!otpSent ? (locale === 'ar' ? 'تغيير رقم الهاتف' : 'Change Phone Number') : (locale === 'ar' ? 'تأكيد رقم الهاتف' : 'Verify Phone Number')}
        description={!otpSent ? (locale === 'ar' ? 'سنرسل رمز تحقق إلى الرقم الجديد قبل اعتماده في حسابك.' : 'We will send a verification code to the new number.') : (locale === 'ar' ? `أرسلنا رمزًا مكونًا من 6 أرقام إلى ${newPhone}` : `We sent a 6-digit code to ${newPhone}`)}
        icon={<Phone size={24} />}
      >
        {!otpSent ? (
          <>
            {profile.phone_number && (
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{locale === 'ar' ? 'رقم الهاتف الحالي' : 'Current Phone Number'}</span>
                <span dir="ltr" style={{ fontWeight: 600 }}>{profile.phone_number}</span>
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{locale === 'ar' ? 'رقم الهاتف الجديد' : 'New Phone Number'}</label>
              <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)', background: 'var(--surface)' }} className="phone-input-wrapper">
                <div style={{ padding: '0 16px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', fontWeight: 500 }} dir="ltr">+966</div>
                <input type="text" style={{ flex: 1, padding: '14px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '15px' }} placeholder="5X XXX XXXX" value={newPhone} onChange={e => setNewPhone(e.target.value)} dir="ltr" />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>{locale === 'ar' ? 'يجب إدخال الرقم بصيغة دولية صحيحة.' : 'Enter phone in correct international format.'}</p>
            </div>
            {phoneError && <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}><AlertCircle size={16} /> {phoneError}</div>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsPhoneModalOpen(false)}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button className="btn btn-primary" style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'center' }} onClick={requestOtp} disabled={phoneLoading || !newPhone}>{phoneLoading ? '...' : <>{locale === 'ar' ? 'إرسال رمز التحقق' : 'Send OTP'} {locale === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}</>}</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <OtpInput length={6} value={otp} onChange={setOtp} />
            </div>
            {phoneError && <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}><AlertCircle size={16} /> {phoneError}</div>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setOtpSent(false)}>{locale === 'ar' ? 'رجوع' : 'Back'}</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={verifyOtp} disabled={phoneLoading || otp.length < 6}>{phoneLoading ? '...' : (locale === 'ar' ? 'تأكيد الرقم' : 'Verify Phone')}</button>
            </div>
          </>
        )}
      </PremiumModal>

      <PremiumModal
        isOpen={isPasswordModalOpen}
        onClose={() => { setIsPasswordModalOpen(false); setPassError(null); }}
        title={locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
        description={locale === 'ar' ? 'يرجى استخدام كلمة مرور قوية لتأمين حسابك.' : 'Please use a strong password to secure your account.'}
        icon={<Key size={24} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{locale === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}</label>
            <div style={{ position: 'relative' }}>
              <input type={showPwd1 ? 'text' : 'password'} className="modal-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} dir="ltr" />
              <button onClick={() => setShowPwd1(!showPwd1)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>{showPwd1 ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
            <div style={{ position: 'relative' }}>
              <input type={showPwd2 ? 'text' : 'password'} className="modal-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} dir="ltr" />
              <button onClick={() => setShowPwd2(!showPwd2)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>{showPwd2 ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {newPassword && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                <div style={{ flex: 1, height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${(pwdStrength.score / 3) * 100}%`, height: '100%', background: pwdStrength.color, transition: 'width 0.3s, background 0.3s' }} />
                </div>
                <span style={{ fontSize: '11px', color: pwdStrength.color }}>{pwdStrength.label}</span>
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{locale === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</label>
            <input type="password" className="modal-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} dir="ltr" />
          </div>

          {passError && <div style={{ color: 'var(--danger)', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}><AlertCircle size={16} /> {passError}</div>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsPasswordModalOpen(false)}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={changePassword} disabled={passLoading || !newPassword || newPassword !== confirmPassword}>{passLoading ? '...' : (locale === 'ar' ? 'تحديث كلمة المرور' : 'Update Password')}</button>
          </div>
        </div>
      </PremiumModal>

      <PremiumModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteError(null); }}
        title={locale === 'ar' ? 'طلب حذف الحساب' : 'Request Account Deletion'}
        description={locale === 'ar' ? 'هذا إجراء حساس. سيتم إرسال طلب لحذف الحساب والبيانات المرتبطة به نهائياً.' : 'This is a sensitive action. A request will be sent to permanently delete your account and associated data.'}
        icon={<AlertTriangle size={24} />}
        danger
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px', fontSize: '13px', color: 'var(--text-primary)' }}>
            <strong style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}><AlertCircle size={16} /> {locale === 'ar' ? 'قبل المتابعة' : 'Before you proceed'}</strong>
            <ul style={{ margin: 0, paddingLeft: locale === 'ar' ? 0 : '16px', paddingRight: locale === 'ar' ? '16px' : 0, display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
              <li>{locale === 'ar' ? 'سيتم إيقاف الوصول إلى الحساب' : 'Access to the account will be suspended'}</li>
              <li>{locale === 'ar' ? 'قد يتم حذف الأجهزة والإعدادات المرتبطة' : 'Associated devices and settings may be deleted'}</li>
              <li>{locale === 'ar' ? 'ستتم معالجة الطلب من قبل الإدارة' : 'The request will be processed by administration'}</li>
            </ul>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{locale === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}</label>
            <input type="password" className="modal-input" value={deletePass} onChange={e => setDeletePass(e.target.value)} dir="ltr" />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              {locale === 'ar' ? 'اكتب "حذف حسابي" للتأكيد' : 'Type "delete my account" to confirm'}
            </label>
            <input type="text" className="modal-input" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder={locale === 'ar' ? 'حذف حسابي' : 'delete my account'} />
          </div>

          {deleteError && <div style={{ color: 'var(--danger)', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}><AlertCircle size={16} /> {deleteError}</div>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsDeleteModalOpen(false)}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button className="btn" style={{ flex: 1, background: 'var(--danger)', color: '#fff' }} onClick={requestDeletion} disabled={deleteLoading || !deletePass || deleteConfirmText !== (locale === 'ar' ? 'حذف حسابي' : 'delete my account')}>{deleteLoading ? '...' : (locale === 'ar' ? 'طلب حذف الحساب' : 'Request Deletion')}</button>
          </div>
        </div>
      </PremiumModal>

      {/* NAME MODAL */}
      <PremiumModal
        isOpen={isNameModalOpen}
        onClose={() => { setIsNameModalOpen(false); setNameError(null); }}
        title={locale === 'ar' ? 'تعديل الاسم' : 'Edit Name'}
        description={locale === 'ar' ? 'يرجى إدخال اسمك الحقيقي لتسهيل التواصل.' : 'Please enter your real name for easier communication.'}
        icon={<User size={24} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
            <input type="text" className="modal-input" value={newName} onChange={e => setNewName(e.target.value)} />
          </div>
          {nameError && <div style={{ color: 'var(--danger)', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}><AlertCircle size={16} /> {nameError}</div>}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsNameModalOpen(false)}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={updateName} disabled={nameLoading || !newName}>{nameLoading ? '...' : (locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}</button>
          </div>
        </div>
      </PremiumModal>

      {/* EMAIL MODAL */}
      <PremiumModal
        isOpen={isEmailModalOpen}
        onClose={() => { setIsEmailModalOpen(false); setEmailError(null); }}
        title={locale === 'ar' ? 'تغيير البريد الإلكتروني' : 'Change Email'}
        description={locale === 'ar' ? 'سيتم إرسال رابط تأكيد إلى بريدك الجديد.' : 'A confirmation link will be sent to your new email.'}
        icon={<Mail size={24} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{locale === 'ar' ? 'البريد الإلكتروني الحالي' : 'Current Email'}</label>
            <input type="text" className="modal-input" value={profile.email} disabled dir="ltr" style={{ opacity: 0.6 }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{locale === 'ar' ? 'البريد الإلكتروني الجديد' : 'New Email'}</label>
            <input type="email" className="modal-input" value={newEmail} onChange={e => setNewEmail(e.target.value)} dir="ltr" />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{locale === 'ar' ? 'لتأكيد الهوية، أدخل كلمة المرور' : 'To confirm identity, enter password'}</label>
            <input type="password" className="modal-input" value={emailPass} onChange={e => setEmailPass(e.target.value)} dir="ltr" />
          </div>
          {emailError && <div style={{ color: 'var(--danger)', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}><AlertCircle size={16} /> {emailError}</div>}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsEmailModalOpen(false)}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={updateEmail} disabled={emailLoading || !newEmail || !emailPass}>{emailLoading ? '...' : (locale === 'ar' ? 'إرسال الرابط' : 'Send Link')}</button>
          </div>
        </div>
      </PremiumModal>

      {/* FULL ACTIVITY MODAL */}
      <PremiumModal
        isOpen={isFullActivityModalOpen}
        onClose={() => { setIsFullActivityModalOpen(false); setFullActivityError(null); }}
        title={locale === 'ar' ? 'سجل النشاط بالكامل' : 'Full Activity Log'}
        description={locale === 'ar' ? 'عرض آخر الأنشطة والإجراءات التي تمت على حسابك.' : 'View the latest activities and actions taken on your account.'}
        icon={<Activity size={24} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
          {fullActivityLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>...</div>
          ) : fullActivityError ? (
            <div style={{ color: 'var(--danger)', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}><AlertCircle size={16} /> {fullActivityError}</div>
          ) : fullActivityData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>{locale === 'ar' ? 'لا توجد نشاطات' : 'No activities'}</div>
          ) : (
            fullActivityData.map((act) => (
              <div key={act.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                  {act.type === 'auth' ? <Shield size={12} color="var(--primary)" /> : <Activity size={12} color="var(--success)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 2px 0', color: 'var(--text-primary)' }}>{translateActivity(act.raw_action)}</p>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span dir="ltr">{formatDate(act.timestamp)}</span>
                    {act.ip && <span dir="ltr">IP: {act.ip}</span>}
                  </div>
                </div>
              </div>
            ))
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsFullActivityModalOpen(false)}>{locale === 'ar' ? 'إغلاق' : 'Close'}</button>
          </div>
        </div>
      </PremiumModal>

      {/* LOGIN HISTORY MODAL */}
      <PremiumModal
        isOpen={isLoginHistoryModalOpen}
        onClose={() => { setIsLoginHistoryModalOpen(false); setLoginHistoryError(null); }}
        title={locale === 'ar' ? 'سجل تسجيل الدخول' : 'Login History'}
        description={locale === 'ar' ? 'محاولات وعمليات تسجيل الدخول لحسابك.' : 'Login attempts and authentications for your account.'}
        icon={<Shield size={24} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
          {loginHistoryLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>...</div>
          ) : loginHistoryError ? (
            <div style={{ color: 'var(--danger)', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}><AlertCircle size={16} /> {loginHistoryError}</div>
          ) : loginHistoryData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>{locale === 'ar' ? 'لا يوجد سجلات' : 'No records'}</div>
          ) : (
            loginHistoryData.map((log) => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }} dir="ltr">{log.ip_address}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{translateActivity(log.status)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{formatDate(log.created_at)}</div>
                </div>
                <div style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', background: log.status.includes('fail') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: log.status.includes('fail') ? 'var(--danger)' : 'var(--success)' }}>
                  {log.status.includes('fail') ? (locale === 'ar' ? 'فشل' : 'Failed') : (locale === 'ar' ? 'نجاح' : 'Success')}
                </div>
              </div>
            ))
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsLoginHistoryModalOpen(false)}>{locale === 'ar' ? 'إغلاق' : 'Close'}</button>
          </div>
        </div>
      </PremiumModal>

      {/* SESSIONS MODAL */}
      <PremiumModal
        isOpen={isSessionsModalOpen}
        onClose={() => { setIsSessionsModalOpen(false); setSessionsError(null); }}
        title={locale === 'ar' ? 'إدارة الجلسات' : 'Manage Sessions'}
        description={locale === 'ar' ? 'تظهر هنا جميع الأجهزة المتصلة بحسابك.' : 'All devices connected to your account appear here.'}
        icon={<Smartphone size={24} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
          {sessionsLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>...</div>
          ) : sessionsError ? (
            <div style={{ color: 'var(--danger)', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}><AlertCircle size={16} /> {sessionsError}</div>
          ) : sessionsData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>{locale === 'ar' ? 'لا توجد جلسات نشطة' : 'No active sessions'}</div>
          ) : (
            sessionsData.map((session) => (
              <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }} dir="ltr">{session.ip_address}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{session.browser_agent || 'Unknown'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{formatDate(session.last_activity)}</div>
                </div>
                <button onClick={() => terminateSession(session.id)} className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '6px 12px', fontSize: '12px', height: 'auto' }}>
                  {locale === 'ar' ? 'إنهاء' : 'Terminate'}
                </button>
              </div>
            ))
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsSessionsModalOpen(false)}>{locale === 'ar' ? 'إغلاق' : 'Close'}</button>
          </div>
        </div>
      </PremiumModal>

      <style jsx>{`
        .card-section {
          background: var(--surface);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          overflow: hidden;
        }
        .card-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-body {
          padding: 24px;
        }
        
        .security-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-light);
        }
        .security-row:last-child { border-bottom: none; }
        
        .badge-success { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--success); background: rgba(34, 197, 94, 0.1); padding: 4px 10px; border-radius: 12px; font-weight: 600; }
        .badge-warning { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--warning); background: rgba(245, 158, 11, 0.1); padding: 4px 10px; border-radius: 12px; font-weight: 600; }
        
        .modal-input {
          width: 100%;
          height: 52px;
          padding: 0 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .modal-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
        }
        .phone-input-wrapper:focus-within {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
        }
        
        .security-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .security-mini-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        
        .security-mini-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        
        .security-mini-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .security-mini-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-primary);
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          align-self: flex-start;
          margin-top: auto;
        }
        
        .security-mini-btn:hover {
          background: rgba(var(--primary-rgb), 0.1);
          border-color: var(--primary);
          color: var(--primary);
        }
        
        @media (max-width: 1024px) {
          .security-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }
        
        @media (max-width: 600px) {
          .security-cards-grid { grid-template-columns: 1fr; }
        }

        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, subvalue, icon }: { title: string, value: number, subvalue: string, icon: React.ReactNode }) {
  const displayNum = useCountUp(value, 700);
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)', padding: '16px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      cursor: 'default'
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'rgba(var(--primary-rgb), 0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border-light)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>{title}</h4>
        <div style={{ padding: '6px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex' }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1, marginBottom: '4px' }}>{displayNum.toLocaleString()}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{subvalue}</div>
      </div>
    </div>
  );
}

function SettingRow({ icon, label, value, action, onClick, disabled = false }: any) {
  return (
    <>
      <div className={`setting-row ${disabled ? 'disabled' : ''}`} onClick={!disabled ? onClick : undefined}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
          <div className="setting-icon-container">{icon}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <span className="setting-label">{label}</span>
            <span className="setting-value">{value}</span>
          </div>
        </div>
        {action && !disabled && (
          <button className="setting-action-btn" onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}>
            {action}
          </button>
        )}
      </div>
      <style jsx>{`
        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          min-height: 72px;
          border-bottom: 1px solid var(--border-light);
          transition: background 0.2s ease;
          gap: 16px;
        }
        
        @media (max-width: 400px) {
          .setting-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .setting-action-btn {
            align-self: flex-start;
            margin-top: 8px;
            margin-left: 52px;
          }
        }
        
        .setting-row:last-child { border-bottom: none; }
        .setting-row.disabled { cursor: default; }
        .setting-row:not(.disabled):hover {
          background: rgba(255,255,255,0.018);
        }
        .setting-row:not(.disabled):hover .setting-icon-container {
          color: var(--primary);
        }
        .setting-row:not(.disabled):hover .setting-action-btn {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(var(--primary-rgb), 0.05);
          transform: translateY(-1px);
        }
        
        .setting-icon-container {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--text-secondary);
          flex-shrink: 0;
          transition: color 0.2s ease;
        }
        
        .setting-label {
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        .setting-value {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .setting-action-btn {
          height: 38px;
          padding: 0 16px;
          border-radius: 10px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
      `}</style>
    </>
  );
}

function ErrorFallback({ message, onRetry }: { message: string, onRetry: () => void }) {
  const { locale } = useApp();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 0' }}>
      <AlertCircle size={24} color="var(--danger)" />
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{message}</span>
      <button onClick={onRetry} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
        <RotateCcw size={12} style={{ marginRight: locale === 'ar' ? 0 : '4px', marginLeft: locale === 'ar' ? '4px' : 0 }} /> {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
      </button>
    </div>
  );
}

// --------------------------------------------------
// PREMIUM UI COMPONENTS
// --------------------------------------------------

function PremiumModal({ isOpen, onClose, title, description, icon, children, danger = false }: any) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2, ease: "easeOut" }}
        style={{ position: 'relative', width: '100%', maxWidth: '480px', background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: '28px', boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 40px rgba(var(--primary-rgb), 0.05)', overflow: 'hidden' }}
        role="dialog" aria-modal="true"
      >
        <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: danger ? 'var(--danger)' : 'var(--primary)', opacity: 0.08, filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(var(--primary-rgb), 0.1)', color: danger ? 'var(--danger)' : 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0', color: danger ? 'var(--danger)' : 'inherit' }}>{title}</h2>
              {description && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{description}</p>}
            </div>
          </div>
          <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X size={20} />
          </button>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </motion.div>
    </div>
  );
}

function OtpInput({ length = 6, value, onChange }: { length?: number, value: string, onChange: (val: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) {
      const newVal = value.split('');
      newVal[index] = '';
      onChange(newVal.join(''));
      return;
    }

    if (val.length === 1) {
      const newVal = value.padEnd(length, ' ').split('');
      newVal[index] = val;
      onChange(newVal.join('').trim());
      if (index < length - 1) inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputs.current[focusIndex]?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', direction: 'ltr' }}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          maxLength={1}
          value={value[i] && value[i] !== ' ' ? value[i] : ''}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          onPaste={handlePaste}
          style={{ width: '48px', height: '54px', textAlign: 'center', fontSize: '20px', fontWeight: 600, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(var(--primary-rgb), 0.2)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
      ))}
    </div>
  );
}

function checkPasswordStrength(password: string, locale: string) {
  if (!password) return { score: 0, label: locale === 'ar' ? 'ضعيفة' : 'Weak', color: 'var(--border-light)' };
  let score = 0;
  if (password.length > 7) score += 1;
  if (password.length > 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score < 2) return { score: 1, label: locale === 'ar' ? 'ضعيفة' : 'Weak', color: 'var(--danger)' };
  if (score < 4) return { score: 2, label: locale === 'ar' ? 'متوسطة' : 'Medium', color: 'var(--warning)' };
  return { score: 3, label: locale === 'ar' ? 'قوية' : 'Strong', color: 'var(--success)' };
}
