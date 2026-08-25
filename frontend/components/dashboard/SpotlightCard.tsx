'use client';
import React, { useRef, useCallback } from 'react';
import s from './SpotlightCard.module.css';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SpotlightCard
 * Wraps any card element and adds three interactive hover effects:
 *  1. Spotlight  — a radial light that follows the cursor inside the card
 *  2. 3D Tilt    — subtle perspective rotation tracking the cursor
 *  3. Glow Border— an orange gradient border that illuminates near the cursor
 *
 * Drop-in replacement for a plain <div>. Pass className to forward card styles.
 */
export default function SpotlightCard({ children, className = '', style }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    const { left, top, width, height } = el.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    // Update CSS vars for spotlight & glow gradient position
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);

    // 3D tilt — max ±5 degrees
    const tiltX = ((y - height / 2) / (height / 2)) * -5;
    const tiltY = ((x - width / 2) / (width / 2)) * 5;
    el.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Smoothly reset tilt
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  }, []);

  return (
    <div
      ref={ref}
      className={`${s.root} ${className}`}
      style={style}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
