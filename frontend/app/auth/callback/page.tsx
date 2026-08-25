'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { apiFetch } from '@/lib/api';

export default function CallbackPage() {
  const { setToken, setUser, locale } = useApp();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {

    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);

    let token = '';
    let provider = '';

    const state = searchParams.get('state');
    provider = state || '';

    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      token = params.get('access_token') || params.get('id_token') || '';
      if (!provider) {
        provider = params.get('state') || '';
      }
    } else {
      token = searchParams.get('access_token') || searchParams.get('id_token') || searchParams.get('code') || '';
    }

    if (!provider && typeof window !== 'undefined') {
      provider = localStorage.getItem('df-social-provider') || '';
    }

    if (!token) {
      setError(locale === 'ar' ? 'فشل تسجيل الدخول: لم يتم العثور على التوكن.' : 'Login failed: Token not found.');
      return;
    }

    apiFetch('/api/v1/auth/social/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider, token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setToken(data.tokens.access);
          setUser(data.user);
          router.push('/dashboard');
        } else {
          setError(data.error || (locale === 'ar' ? 'حدث خطأ أثناء الاتصال بالخادم.' : 'An error occurred.'));
        }
      })
      .catch(() => {
        setError(locale === 'ar' ? 'حدث خطأ في الاتصال بالخادم.' : 'Unable to connect to the server.');
      });
  }, [router, setToken, setUser, locale]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#121212', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        {error ? (
          <div>
            <h2 style={{ color: '#ff4d4d', marginBottom: '10px' }}>{locale === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login Error'}</h2>
            <p>{error}</p>
            <button onClick={() => router.push('/auth/login')} style={{ marginTop: '20px', padding: '10px 20px', background: '#E8833A', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer' }}>
              {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #E8833A', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <h2>{locale === 'ar' ? 'جاري تسجيل الدخول...' : 'Logging you in...'}</h2>
            <p>{locale === 'ar' ? 'يرجى الانتظار بينما نقوم بالتحقق من حسابك.' : 'Please wait while we verify your account.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}