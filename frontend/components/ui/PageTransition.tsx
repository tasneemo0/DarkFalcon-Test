'use client';

import React, { useEffect, useRef } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a dashboard section with a smooth fade-up page entry animation.
 * Respects prefers-reduced-motion automatically via CSS.
 */
export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 350ms cubic-bezier(0.22, 1, 0.36, 1), transform 350ms cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
