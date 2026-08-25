'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { useT } from '@/lib/i18n';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const { locale } = useApp();
  const t = useT(locale);

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

          <form className={styles.authForm} onSubmit={(e) => e.preventDefault()}>
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
                  id="forgot-email"
                />
              </div>
            </div>

            <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} id="forgot-submit">
              {t('auth.resetButton')}
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