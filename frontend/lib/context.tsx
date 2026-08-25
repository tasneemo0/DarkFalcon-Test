'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, defaultLocale, localeDirection } from './i18n';

interface AppContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  dir: 'rtl' | 'ltr';
  user: any;
  setUser: (user: any) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [user, setUserState] = useState<any>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLocale = localStorage.getItem('df-locale') as Locale;
    const savedTheme = localStorage.getItem('df-theme') as 'light' | 'dark';
    const savedUser = localStorage.getItem('df-user');
    const savedToken = localStorage.getItem('df-token');

    if (savedLocale && (savedLocale === 'ar' || savedLocale === 'en')) {
      setLocaleState(savedLocale);
    }
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setThemeState(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeState('dark');
    }
    if (savedUser) {
      try {
        setUserState(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('df-user');
      }
    }
    if (savedToken) {
      setTokenState(savedToken);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('dir', localeDirection[locale]);
    document.documentElement.setAttribute('lang', locale);
    localStorage.setItem('df-locale', locale);
    localStorage.setItem('df-theme', theme);
  }, [locale, theme, mounted]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setUser = (newUser: any) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('df-user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('df-user');
    }
  };

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('df-token', newToken);
    } else {
      localStorage.removeItem('df-token');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const dir = localeDirection[locale];

  return (
    <AppContext.Provider value={{ 
      locale, setLocale, theme, setTheme, toggleTheme, dir,
      user, setUser, token, setToken, logout
    }}>
      <div style={!mounted ? { visibility: 'hidden' } : undefined}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}