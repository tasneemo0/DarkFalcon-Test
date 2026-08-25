'use client';

import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './PremiumButton.module.css';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'secondary';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children?: React.ReactNode;
}

const variantConfig: Record<Variant, { hover: Record<string, unknown>; active: Record<string, unknown> }> = {
  primary: {
    hover: { y: -4, scale: 1.03 },
    active: { scale: 0.97, y: 0 },
  },
  outline: {
    hover: { y: -3, scale: 1.02 },
    active: { scale: 0.97, y: 0 },
  },
  ghost: {
    hover: { y: -2, scale: 1.02 },
    active: { scale: 0.97, y: 0 },
  },
  danger: {
    hover: { y: -3, scale: 1.02 },
    active: { scale: 0.97, y: 0 },
  },
  secondary: {
    hover: { y: -3, scale: 1.02 },
    active: { scale: 0.97, y: 0 },
  },
};

export function PremiumButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  loading = false,
  children,
  className,
  onClick,
  disabled,
  ...rest
}: PremiumButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const config = variantConfig[variant];

  // Ripple on click
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.className = styles.ripple;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    btn.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);

    onClick?.(e);
  }, [disabled, loading, onClick]);

  const variantClass = styles[`btn${variant.charAt(0).toUpperCase() + variant.slice(1)}`] || '';
  const sizeClass = styles[`btnSize${size.toUpperCase()}`] || '';

  return (
    <motion.button
      ref={btnRef}
      className={`${styles.premiumBtn} ${variantClass} ${sizeClass} ${className || ''}`}
      whileHover={disabled || loading ? {} : config.hover}
      whileTap={disabled || loading ? {} : config.active}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onClick={handleClick}
      disabled={disabled || loading}
      {...(rest as any)}
    >
      {/* Glass reflection overlay */}
      <span className={styles.glassReflect} />

      {/* Shine sweep */}
      <span className={styles.btnShine} />

      {/* Content */}
      {loading ? (
        <span className={styles.spinner} />
      ) : (
        <>
          {icon && iconPosition === 'right' && <span className={styles.icon}>{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'left' && <span className={styles.icon}>{icon}</span>}
        </>
      )}
    </motion.button>
  );
}
