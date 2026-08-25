'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { useT, localeNames, Locale } from '@/lib/i18n';
import { Sun, Moon } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { locale, setLocale, theme, toggleTheme, token, logout } = useApp();
  const t = useT(locale);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggleLocale = () => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  };

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 2L28 8V24L16 30L4 24V8L16 2Z" fill="url(#logoGrad)" opacity="0.9"/>
                <path d="M16 6L24 10V22L16 26L8 22V10L16 6Z" fill="url(#logoGrad2)"/>
                <path d="M16 10L20 12V20L16 22L12 20V12L16 10Z" fill="white" opacity="0.9"/>
                <defs>
                  <linearGradient id="logoGrad" x1="4" y1="2" x2="28" y2="30">
                    <stop stopColor="#E8833A"/>
                    <stop offset="1" stopColor="#8B6F47"/>
                  </linearGradient>
                  <linearGradient id="logoGrad2" x1="8" y1="6" x2="24" y2="26">
                    <stop stopColor="#E8833A"/>
                    <stop offset="1" stopColor="#D4722E"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className={styles.logoText}>{t('brand')}</span>
          </Link>

          <nav className={styles.nav}>
            <a href="#features" className={styles.navLink}>{t('nav.features')}</a>
            <a href="#pricing" className={styles.navLink}>{t('nav.pricing')}</a>
            <a href="#how-it-works" className={styles.navLink}>{t('nav.docs')}</a>
            <Link href="/status" className={styles.navLink}>{t('nav.status')}</Link>
          </nav>

          <div className={styles.actions}>
            <button 
              className={styles.iconBtn} 
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>

            <button 
              className={styles.langBtn} 
              onClick={toggleLocale}
              aria-label="Toggle language"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>{localeNames[locale === 'ar' ? 'en' : 'ar']}</span>
            </button>

            {token ? (
              <>
                <Link href="/dashboard" className={styles.loginBtn}>{locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</Link>
                <button onClick={logout} className={`btn btn-outline btn-sm ${styles.registerBtn}`} style={{ padding: '8px 16px', fontSize: '13px' }}>{locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className={styles.loginBtn}>{t('nav.login')}</Link>
                <Link href="/auth/register" className={`btn btn-primary btn-sm ${styles.registerBtn}`}>{t('nav.register')}</Link>
              </>
            )}
          </div>

          <button 
            className={`${styles.burger} ${mobileOpen ? styles.burgerOpen : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span/>
            <span/>
            <span/>
          </button>
        </div>
      </header>

      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ''}`}>
        <nav className={styles.mobileNav}>
          <a href="#features" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>{t('nav.features')}</a>
          <a href="#pricing" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>{t('nav.pricing')}</a>
          <a href="#how-it-works" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>{t('nav.docs')}</a>
          <Link href="/status" className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>{t('nav.status')}</Link>
        </nav>
        <div className={styles.mobileActions}>
          <div className={styles.mobileToggles}>
            <button className={styles.iconBtn} onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
            <button className={styles.langBtn} onClick={toggleLocale}>
              <span>{localeNames[locale === 'ar' ? 'en' : 'ar']}</span>
            </button>
          </div>
          {token ? (
            <>
              <Link href="/dashboard" className={`btn btn-outline ${styles.mobileLoginBtn}`} onClick={() => setMobileOpen(false)}>
                {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </Link>
              <button className={`btn btn-primary ${styles.mobileRegisterBtn}`} onClick={() => { logout(); setMobileOpen(false); }}>
                {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={`btn btn-outline ${styles.mobileLoginBtn}`} onClick={() => setMobileOpen(false)}>
                {t('nav.login')}
              </Link>
              <Link href="/auth/register" className={`btn btn-primary ${styles.mobileRegisterBtn}`} onClick={() => setMobileOpen(false)}>
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}