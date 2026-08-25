'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider } from '@/lib/context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname ? pathname.startsWith('/dashboard') : false;
  const isAuth = pathname ? pathname.startsWith('/auth') : false;

  return (
    <AppProvider>
      {!isDashboard && !isAuth && <Navbar />}
      {children}
      {!isDashboard && !isAuth && <Footer />}
    </AppProvider>
  );
}