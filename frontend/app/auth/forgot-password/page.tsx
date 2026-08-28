'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { useT } from '@/lib/i18n';
import styles from '../auth.module.css';

function ForgotPasswordContent() {
  const { locale } = useApp();
  const t = useT(locale);

  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [email, setEmail] = useState(searchParams?.get('email') || '');
  const token = searchParams?.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setMessage('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      setError('API URL is not configured');
      return;
    }

    setLoading(true);

    try {
      if (!token) {
        // المرحلة الأولى: إرسال رابط الاستعادة
        const response = await fetch(
          `${apiUrl}/api/v1/auth/forgot-password/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'تعذر إرسال رابط الاستعادة');
        }

        setMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
      } else {
        // المرحلة الثانية: تعيين كلمة المرور الجديدة
        if (newPassword.length < 8) {
          throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        }

        if (newPassword !== confirmPassword) {
          throw new Error('كلمتا المرور غير متطابقتين');
        }

        const response = await fetch(
          `${apiUrl}/api/v1/auth/reset-password/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token,
              new_password: newPassword,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'تعذر تغيير كلمة المرور');
        }

        setMessage('تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authLeft}>
        <div className={styles.authBranding}>
          <Link href="/" className={styles.authLogo}>
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L28 8V24L16 30L4 24V8L16 2Z" fill="url(#fpLogoGrad)" opacity="0.9"/>
              <path d="M16 6L24 10V22L16 26L8 22V10L16 6Z" fill="url(#fpLogoGrad2)"/>
              <path d="M16 10L20 12V20L16 22L12 20V12L16 10Z" fill="white" opacity="0.9"/>
              <defs>
                <linearGradient id="fpLogoGrad" x1="4" y1="2" x2="28" y2="30">
                  <stop stopColor="#E8833A"/>
                  <stop offset="1" stopColor="#8B6F47"/>
                </linearGradient>
                <linearGradient id="fpLogoGrad2" x1="8" y1="6" x2="24" y2="26">
                  <stop stopColor="#E8833A"/>
                  <stop offset="1" stopColor="#D4722E"/>
                </linearGradient>
              </defs>
            </svg>
            <span>TrustChat</span>
          </Link>
          <div className={styles.authBrandingContent}>
            <h2>{locale === 'ar' ? 'لا تقلق، سنساعدك' : "Don't worry, we'll help"}</h2>
            <p>{locale === 'ar' ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.' : "Enter your email and we'll send you a link to reset your password."}</p>
          </div>
        </div>
      </div>

      <div className={styles.authRight}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <div className={styles.forgotIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 className={styles.authTitle}>{t('auth.forgotTitle')}</h1>
            <p className={styles.authSubtitle}>{t('auth.forgotSubtitle')}</p>
          </div>

          <form className={styles.authForm} onSubmit={handleSubmit}>
            {!token && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {t('auth.email')}
                </label>

                <div className={styles.inputWrapper}>
                  <input
                    type="email"
                    className={styles.formInput}
                    placeholder={locale === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                    id="forgot-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {token && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>كلمة المرور الجديدة</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="password"
                      className={styles.formInput}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="كلمة المرور الجديدة"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>تأكيد كلمة المرور</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="password"
                      className={styles.formInput}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="أعد كتابة كلمة المرور"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <p style={{ color: '#ef4444', marginBottom: '14px' }}>
                {error}
              </p>
            )}

            {message && (
              <p style={{ color: '#22c55e', marginBottom: '14px' }}>
                {message}
              </p>
            )}

            <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} id="forgot-submit" disabled={loading}>
              {loading
                ? 'جاري التنفيذ...'
                : token
                  ? 'تغيير كلمة المرور'
                  : 'إرسال رابط الاستعادة'}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>

          <p className={styles.authFooter}>
            <Link href="/auth/login" className={styles.authLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginInlineEnd: '6px' }}>
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              {t('auth.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}