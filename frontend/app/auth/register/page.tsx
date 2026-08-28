'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useT } from '@/lib/i18n';
import styles from '../auth.module.css';
import { apiFetch } from '@/lib/api';

const countries = [
  { code: '+966', iso: 'SA', name: 'السعودية', nameEn: 'Saudi Arabia' },
  { code: '+20', iso: 'EG', name: 'مصر', nameEn: 'Egypt' },
  { code: '+971', iso: 'AE', name: 'الإمارات', nameEn: 'UAE' },
  { code: '+962', iso: 'JO', name: 'الأردن', nameEn: 'Jordan' },
  { code: '+965', iso: 'KW', name: 'الكويت', nameEn: 'Kuwait' },
  { code: '+973', iso: 'BH', name: 'البحرين', nameEn: 'Bahrain' },
  { code: '+968', iso: 'OM', name: 'عمان', nameEn: 'Oman' },
  { code: '+974', iso: 'QA', name: 'قطر', nameEn: 'Qatar' },
  { code: '+964', iso: 'IQ', name: 'العراق', nameEn: 'Iraq' },
  { code: '+970', iso: 'PS', name: 'فلسطين', nameEn: 'Palestine' },
  { code: '+212', iso: 'MA', name: 'المغرب', nameEn: 'Morocco' },
  { code: '+213', iso: 'DZ', name: 'الجزائر', nameEn: 'Algeria' },
  { code: '+216', iso: 'TN', name: 'تونس', nameEn: 'Tunisia' },
  { code: '+218', iso: 'LY', name: 'ليبيا', nameEn: 'Libya' },
  { code: '+967', iso: 'YE', name: 'اليمن', nameEn: 'Yemen' },
];

export default function RegisterPage() {
  const { locale, setUser, setToken, token } = useApp();
  const router = useRouter();
  const t = useT(locale);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // New Phone registration states
  const [regType, setRegType] = useState<'email' | 'phone'>('email');
  const [countryCode, setCountryCode] = useState('+966');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const [mockModal, setMockModal] = useState<{ isOpen: boolean; provider: 'google' | 'facebook' } | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
  }, [token, router]);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (typeof window !== 'undefined' && (window as any).google) {
        const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id-placeholder.apps.googleusercontent.com';
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            setLoading(true);
            setError('');
            try {
              const res = await apiFetch('/api/v1/auth/social/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  provider: 'google',
                  token: response.credential
                })
              });
              const data = await res.json();
              if (res.ok) {
                setToken(data.tokens.access);
                setUser(data.user);
                router.push('/dashboard');
              } else {
                setError(data.error || (locale === 'ar' ? 'فشل تسجيل الدخول عبر جوجل.' : 'Google sign-in failed.'));
              }
            } catch (err) {
              setError(locale === 'ar' ? 'حدث خطأ في الاتصال بالخادم.' : 'Unable to connect to the server.');
            } finally {
              setLoading(false);
            }
          }
        });
      }
    };

    const initializeFacebookSignIn = () => {
      if (typeof window !== 'undefined' && (window as any).FB) {
        const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || 'your-facebook-app-id-placeholder';
        (window as any).FB.init({
          appId: facebookAppId,
          cookie: true,
          xfbml: true,
          version: 'v12.0'
        });
      }
    };

    if (typeof window !== 'undefined') {
      if (!(window as any).google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleSignIn;
        document.body.appendChild(script);
      } else {
        initializeGoogleSignIn();
      }

      if (!(window as any).FB) {
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        script.onload = initializeFacebookSignIn;
        document.body.appendChild(script);
      } else {
        initializeFacebookSignIn();
      }
    }
  }, [router, setToken, setUser, locale]);

  const handleSocialClick = (provider: 'google' | 'facebook') => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';

    const isGooglePlaceholder = !googleClientId || googleClientId.includes('placeholder');
    const isFacebookPlaceholder = !facebookAppId || facebookAppId.includes('placeholder');

    if (provider === 'google') {
      if (isGooglePlaceholder) {
        setMockModal({ isOpen: true, provider: 'google' });
        return;
      }
      if (typeof window !== 'undefined' && (window as any).google) {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
            window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=token&scope=openid%20profile%20email&state=google`;
          }
        });
      } else {
        const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=token&scope=openid%20profile%20email&state=google`;
      }
    } else if (provider === 'facebook') {
      if (isFacebookPlaceholder) {
        setMockModal({ isOpen: true, provider: 'facebook' });
        return;
      }
      // Always use the OAuth Redirect Flow for Facebook to avoid modern browser HTTP/HTTPS restrictions on FB.login()
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
      window.location.href = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${redirectUri}&response_type=token&scope=email,public_profile&state=facebook`;
    }
  };

  const handleMockSubmit = async (emailToUse: string, nameToUse: string) => {
    setMockModal(null);
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/v1/auth/social/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'mock',
          email: emailToUse,
          name: nameToUse
        })
      });

      const data = await res.json();

      if (res.ok) {
        setToken(data.tokens.access);
        setUser(data.user);
        router.push('/dashboard');
      } else {
        setError(data.error || (locale === 'ar' ? 'فشل تسجيل الدخول الاجتماعي.' : 'Social login failed.'));
      }
    } catch (e) {
      setError(locale === 'ar' ? 'حدث خطأ في الاتصال بالخادم.' : 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(locale === 'ar' ? 'كلمات المرور غير متطابقة.' : 'Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError(locale === 'ar' ? 'يجب عليك الموافقة على الشروط والأحكام.' : 'You must agree to the terms and conditions.');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        password,
        full_name: fullName,
        company_name: '',
      };

      if (regType === 'email') {
        payload.email = email;
      } else {
        payload.phone_number = phoneNumber;
        payload.country_code = countryCode;
      }

      const res = await apiFetch('/api/v1/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requires_verification) {
          setOtpMode(true);
        } else {
          setToken(data.tokens?.access || null);
          setUser(data.user || { email });
          router.push('/dashboard');
        }
      } else {
        let errorMessage = '';
        if (data.email) {
          errorMessage = locale === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل.' : 'This email is already registered.';
        } else if (data.phone_number) {
          errorMessage = locale === 'ar' ? 'رقم الهاتف هذا مسجل بالفعل.' : 'This phone number is already registered.';
        } else if (data.password) {
          errorMessage = data.password.join(' ');
        } else if (data.error) {
          errorMessage = data.error;
        } else {
          errorMessage = data.message || (locale === 'ar' ? 'فشل التسجيل. يرجى التحقق من المدخلات.' : 'Registration failed. Please check inputs.');
        }
        setError(errorMessage);
      }
    } catch (err) {
      setError(locale === 'ar' ? 'حدث خطأ في الاتصال بالخادم.' : 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpCode.length !== 6) {
      setError(locale === 'ar' ? 'يرجى إدخال الرمز المكون من 6 أرقام.' : 'Please enter the 6-digit code.');
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = phoneNumber.replace(' ', '').replace('-', '').replace('(', '').replace(')', '');
      const tempPhone = cleanPhone.replace(/^0+/, '');
      const cleanCC = countryCode.replace(' ', '').replace('+', '');
      const fullPhone = `+${cleanCC}${tempPhone}`;

      const res = await apiFetch('/api/v1/auth/verify-phone/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: fullPhone,
          otp: otpCode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setToken(data.tokens?.access || null);
        setUser(data.user);
        router.push('/dashboard');
      } else {
        setError(data.error || (locale === 'ar' ? 'فشل التحقق من رمز OTP.' : 'OTP verification failed.'));
      }
    } catch (err) {
      setError(locale === 'ar' ? 'حدث خطأ في الاتصال بالخادم.' : 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpResend = async () => {
    setError('');
    setResendMessage('');
    setResendLoading(true);

    try {
      const cleanPhone = phoneNumber.replace(' ', '').replace('-', '').replace('(', '').replace(')', '');
      const tempPhone = cleanPhone.replace(/^0+/, '');
      const cleanCC = countryCode.replace(' ', '').replace('+', '');
      const fullPhone = `+${cleanCC}${tempPhone}`;

      const res = await apiFetch('/api/v1/auth/resend-phone-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: fullPhone,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResendMessage(locale === 'ar' ? 'تم إعادة إرسال رمز التحقق بنجاح.' : 'Verification code resent successfully.');
      } else {
        setError(data.error || (locale === 'ar' ? 'فشل إعادة إرسال الرمز.' : 'Failed to resend code.'));
      }
    } catch (err) {
      setError(locale === 'ar' ? 'حدث خطأ في الاتصال بالخادم.' : 'Unable to connect to the server.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authLeft}>
        <div className={styles.authBranding}>
          <Link href="/" className={styles.authLogo}>
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L28 8V24L16 30L4 24V8L16 2Z" fill="url(#rLogoGrad)" opacity="0.9"/>
              <path d="M16 6L24 10V22L16 26L8 22V10L16 6Z" fill="url(#rLogoGrad2)"/>
              <path d="M16 10L20 12V20L16 22L12 20V12L16 10Z" fill="white" opacity="0.9"/>
              <defs>
                <linearGradient id="rLogoGrad" x1="4" y1="2" x2="28" y2="30">
                  <stop stopColor="#E8833A"/>
                  <stop offset="1" stopColor="#8B6F47"/>
                </linearGradient>
                <linearGradient id="rLogoGrad2" x1="8" y1="6" x2="24" y2="26">
                  <stop stopColor="#E8833A"/>
                  <stop offset="1" stopColor="#D4722E"/>
                </linearGradient>
              </defs>
            </svg>
            <span>TrustChat</span>
          </Link>
          <div className={styles.authBrandingContent}>
            <h2>{locale === 'ar' ? 'انضم لآلاف الشركات التي تثق بنا' : 'Join thousands of companies that trust us'}</h2>
            <p>{locale === 'ar' ? 'أنشئ حسابك واحصل على API Key خاص بك لإرسال واستقبال رسائل واتساب في دقائق.' : 'Create your account and get your own API Key to send and receive WhatsApp messages in minutes.'}</p>
          </div>
          <div className={styles.authStats}>
            <div className={styles.authStat}>
              <span className={styles.authStatNum}>50M+</span>
              <span className={styles.authStatLabel}>{locale === 'ar' ? 'رسالة' : 'Messages'}</span>
            </div>
            <div className={styles.authStat}>
              <span className={styles.authStatNum}>99.9%</span>
              <span className={styles.authStatLabel}>{locale === 'ar' ? 'وقت التشغيل' : 'Uptime'}</span>
            </div>
            <div className={styles.authStat}>
              <span className={styles.authStatNum}>2.5K+</span>
              <span className={styles.authStatLabel}>{locale === 'ar' ? 'عميل' : 'Clients'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.authRight}>
        <div className={styles.authCard}>
          {otpMode ? (
            <>
              <div className={styles.authHeader}>
                <h1 className={styles.authTitle}>{t('auth.verifyPhoneTitle')}</h1>
                <p className={styles.authSubtitle}>{t('auth.verifyPhoneSubtitle')}</p>
              </div>

              <form className={styles.authForm} onSubmit={handleOtpSubmit}>
              {error && (
                  <div className={styles.errorAlert}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{error}</span>
                  </div>
                )}

                {resendMessage && (
                  <div style={{
                    background: 'rgba(52, 168, 83, 0.1)',
                    color: '#34A853',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '14px',
                    marginBottom: '16px',
                    border: '1px solid #34A853',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    {resendMessage}
                  </div>
                )}

                <div className={styles.otpWrapper}>
                  <div className={styles.otpInputContainer}>
                    <input 
                      type="text" 
                      maxLength={6} 
                      className={styles.formInput} 
                      style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px', fontWeight: 'bold' }}
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>



                  <div className={styles.otpActions}>
                    <button 
                      type="submit" 
                      className={`btn btn-primary btn-lg ${styles.submitBtn}`} 
                      disabled={loading}
                    >
                      {loading ? (locale === 'ar' ? 'جاري التحقق...' : 'Verifying...') : t('auth.verifyButton')}
                    </button>

                    <button 
                      type="button" 
                      className={styles.resendBtn} 
                      onClick={handleOtpResend} 
                      disabled={resendLoading}
                    >
                      {resendLoading ? (locale === 'ar' ? 'جاري الإرسال...' : 'Sending...') : t('auth.resendCode')}
                    </button>
                    
                    <button
                      type="button"
                      className={styles.resendBtn}
                      style={{ color: 'var(--text-secondary)' }}
                      onClick={() => { setOtpMode(false); setOtpCode(''); }}
                    >
                      {locale === 'ar' ? 'الرجوع للتعديل' : 'Go back to edit'}
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className={styles.authHeader}>
                <h1 className={styles.authTitle}>{t('auth.registerTitle')}</h1>
                <p className={styles.authSubtitle}>{t('auth.registerSubtitle')}</p>
              </div>

              {/* Toggle Tabs */}
              <div className={styles.regTabs}>
                <button 
                  type="button" 
                  className={`${styles.regTab} ${regType === 'email' ? styles.regTabActive : ''}`}
                  onClick={() => { setRegType('email'); setError(''); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  {t('auth.registerWithEmail')}
                </button>
                <button 
                  type="button" 
                  className={`${styles.regTab} ${regType === 'phone' ? styles.regTabActive : ''}`}
                  onClick={() => { setRegType('phone'); setError(''); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {t('auth.registerWithPhone')}
                </button>
              </div>

              <form className={styles.authForm} onSubmit={handleSubmit}>
                {error && (
                  <div className={styles.errorAlert}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Full Name */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('auth.fullName')}</label>
                  <div className={styles.inputWrapper}>
                    <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <input 
                      type="text" 
                      className={styles.formInput}
                      placeholder={locale === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                      id="register-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Conditional Fields based on regType */}
                {regType === 'email' ? (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('auth.email')}</label>
                    <div className={styles.inputWrapper}>
                      <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <input 
                        type="email" 
                        className={styles.formInput}
                        placeholder={locale === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                        id="register-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('auth.countryCode')}</label>
                    <div className={styles.phoneInputWrapper}>
                      <select
                        className={styles.countrySelect}
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                      >
                        {countries.map((c) => (
                          <option key={c.code} value={c.code}>
                            {`${c.iso} ${c.code}`}
                          </option>
                        ))}
                      </select>
                      
                      <div className={styles.inputWrapper} style={{ flex: 1 }}>
                        <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        <input 
                          type="tel" 
                          className={`${styles.formInput} ${styles.centerInput}`}
                          placeholder={locale === 'ar' ? 'رقم الهاتف ' : 'Phone number '}
                          id="register-phone"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('auth.password')}</label>
                  <div className={styles.inputWrapper}>
                    <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      className={styles.formInput}
                      placeholder={locale === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                      id="register-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('auth.confirmPassword')}</label>
                  <div className={styles.inputWrapper}>
                    <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={styles.formInput}
                      placeholder={locale === 'ar' ? 'أعد إدخال كلمة المرور' : 'Confirm your password'}
                      id="register-confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className={styles.rememberRow}>
                  <label className={styles.checkbox}>
                    <input 
                      type="checkbox" 
                      id="agree-terms" 
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                    <span className={styles.checkmark} />
                    <span>
                      {t('auth.termsAgree')}{' '}
                      <a href="#" className={styles.authLink}>{t('auth.termsLink')}</a>
                      {' '}{t('auth.and')}{' '}
                      <a href="#" className={styles.authLink}>{t('auth.privacyLink')}</a>
                    </span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  className={`btn btn-primary btn-lg ${styles.submitBtn}`} 
                  id="register-submit"
                  disabled={loading}
                >
                  {loading ? (locale === 'ar' ? 'جاري التسجيل...' : 'Signing up...') : t('auth.registerButton')}
                  {!loading && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className={styles.divider}>
                <span>{t('auth.orContinueWith')}</span>
              </div>

              {/* Social Logins */}
              <div className={styles.socialBtns}>
                <button className={styles.socialBtn} type="button" onClick={() => handleSocialClick('google')}>
                  <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </button>
                <button className={styles.socialBtn} type="button" onClick={() => handleSocialClick('facebook')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </button>
              </div>

              {/* Footer */}
              <p className={styles.authFooter}>
                {t('auth.hasAccount')}{' '}
                <Link href="/auth/login" className={styles.authLink}>{t('nav.login')}</Link>
              </p>
            </>
          )}
        </div>
      </div>

      {}
      {mockModal?.isOpen && (
        <div className={styles.socialModalOverlay}>
          <div className={styles.socialModalCard}>
            <button 
              className={styles.socialModalClose} 
              onClick={() => setMockModal(null)}
              aria-label="Close modal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {mockModal.provider === 'google' ? (
              <>
                <div className={styles.socialModalHeader}>
                  <div className={styles.socialModalLogo}>
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <h2 className={styles.socialModalTitle}>
                    {locale === 'ar' ? 'تسجيل الدخول باستخدام Google' : 'Sign in with Google'}
                  </h2>
                  <p className={styles.socialModalSubtitle}>
                    {locale === 'ar' ? 'للمتابعة إلى TrustChat (بيئة تجريبية)' : 'To continue to TrustChat (Developer Demo)'}
                  </p>
                </div>

                <div className={styles.socialAccountsList}>
                  {}
                  <button 
                    className={styles.socialAccountItem}
                    onClick={() => handleMockSubmit('yousef@trustchat.com', 'Yousef Abdallah')}
                  >
                    <div className={styles.socialAccountAvatar} style={{ background: '#E8833A' }}>Y</div>
                    <div className={styles.socialAccountInfo}>
                      <span className={styles.socialAccountName}>Yousef Abdallah</span>
                      <span className={styles.socialAccountEmail}>yousef@trustchat.com</span>
                    </div>
                  </button>

                  {}
                  <button 
                    className={styles.socialAccountItem}
                    onClick={() => handleMockSubmit('admin@trustchat.com', 'Admin User')}
                  >
                    <div className={styles.socialAccountAvatar} style={{ background: '#8B6F47' }}>A</div>
                    <div className={styles.socialAccountInfo}>
                      <span className={styles.socialAccountName}>Admin User</span>
                      <span className={styles.socialAccountEmail}>admin@trustchat.com</span>
                    </div>
                  </button>
                </div>

                <div className={styles.socialSeparator}>
                  <span>{locale === 'ar' ? 'أو استخدم حساباً مخصصاً' : 'Or use a custom account'}</span>
                </div>

                {}
                <form 
                  className={styles.socialCustomForm}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customEmail) {
                      handleMockSubmit(customEmail, customName || 'Custom Google User');
                    }
                  }}
                >
                  <div className={styles.formGroup}>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      style={{ padding: '10px 14px' }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input 
                      type="email" 
                      className={styles.formInput} 
                      placeholder={locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      style={{ padding: '10px 14px' }}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                    {locale === 'ar' ? 'تسجيل دخول مخصص' : 'Custom Sign In'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className={styles.socialModalHeader}>
                  <div className={styles.socialModalLogo} style={{ background: '#1877F2', borderColor: '#1877F2' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <h2 className={styles.socialModalTitle}>
                    {locale === 'ar' ? 'تسجيل الدخول باستخدام Facebook' : 'Log in with Facebook'}
                  </h2>
                  <p className={styles.socialModalSubtitle}>
                    {locale === 'ar' ? 'يطلب TrustChat الوصول إلى اسمك وبريدك الإلكتروني.' : 'TrustChat is requesting access to your name and email.'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    className={styles.socialFacebookBtn}
                    onClick={() => handleMockSubmit('yousef@trustchat.com', 'Yousef Abdallah')}
                  >
                    {locale === 'ar' ? 'متابعة باسم Yousef Abdallah' : 'Continue as Yousef Abdallah'}
                  </button>
                  <button 
                    className={styles.socialFacebookBtn}
                    style={{ background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
                    onClick={() => handleMockSubmit('fb-test-user@trustchat.com', 'Facebook Test User')}
                  >
                    {locale === 'ar' ? 'متابعة كـ Facebook Test User' : 'Continue as Facebook Test User'}
                  </button>
                </div>

                <div className={styles.socialSeparator}>
                  <span>{locale === 'ar' ? 'أو استخدم حساباً مخصصاً' : 'Or use a custom account'}</span>
                </div>

                <form 
                  className={styles.socialCustomForm}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customEmail) {
                      handleMockSubmit(customEmail, customName || 'Facebook User');
                    }
                  }}
                >
                  <div className={styles.formGroup}>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      style={{ padding: '10px 14px' }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input 
                      type="email" 
                      className={styles.formInput} 
                      placeholder={locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      style={{ padding: '10px 14px' }}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                    {locale === 'ar' ? 'تسجيل دخول مخصص' : 'Custom Sign In'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
