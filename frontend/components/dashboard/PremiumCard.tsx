'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionTemplate } from 'framer-motion';
import { usePremiumCard } from '@/lib/hooks/usePremiumCard';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import styles from './PremiumCard.module.css';

interface PremiumStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'info' | 'warning' | 'danger';
  subtitle?: string;
  trend?: number;
  prefix?: string;
}

const colorMap: Record<string, { glow: string; icon: string; border: string }> = {
  primary: {
    glow: 'rgba(249, 115, 22, 0.18)',
    icon: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.35)',
  },
  success: {
    glow: 'rgba(16, 185, 129, 0.18)',
    icon: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.35)',
  },
  info: {
    glow: 'rgba(56, 189, 248, 0.18)',
    icon: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.35)',
  },
  warning: {
    glow: 'rgba(251, 191, 36, 0.18)',
    icon: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.35)',
  },
  danger: {
    glow: 'rgba(248, 113, 113, 0.18)',
    icon: 'rgba(248, 113, 113, 0.15)',
    border: 'rgba(248, 113, 113, 0.35)',
  },
};

export function PremiumStatCard({ title, value, icon, color = 'primary', subtitle, trend, prefix }: PremiumStatCardProps) {
  const {
    cardRef,
    rotateX,
    rotateY,
    glowX,
    glowY,
    isHovered,
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
  } = usePremiumCard(6);

  const colors = colorMap[color] || colorMap.primary;

  const spotlightBg = useMotionTemplate`radial-gradient(300px circle at ${glowX} ${glowY}, ${colors.glow}, transparent 70%)`;


  const cardVariants = {
    initial: { opacity: 0, y: 24, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <motion.div
      ref={cardRef}
      className={styles.premiumCard}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ y: -10, scale: 1.03 }}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >

      {/* Mouse-follow spotlight */}
      <motion.div
        className={styles.spotlight}
        style={{ background: spotlightBg }}
      />

      {/* Shine sweep — once on hover */}
      {isHovered && <div className={styles.shineSweep} />}

      {/* Content */}
      <div className={styles.cardContent}>
        <div className={styles.cardTop}>
          {/* Icon */}
          <motion.div
            className={styles.iconWrap}
            style={{ background: colors.icon }}
            animate={isHovered ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            {icon}
          </motion.div>

          {/* Trend badge */}
          {trend !== undefined && (
            <motion.div
              className={`${styles.trendBadge} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}
              animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </motion.div>
          )}
        </div>

        <div className={styles.cardBottom}>
          <motion.div
            className={styles.cardValue}
            animate={isHovered ? { scale: 1.06 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            {prefix && <span style={{ fontSize: '0.7em', marginRight: '4px' }}>{prefix}</span>}<AnimatedNumber value={value} />
          </motion.div>
          <div className={styles.cardTitle}>{title}</div>
          {subtitle && <div className={styles.cardSubtitle}>{subtitle}</div>}
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Generic PremiumCard wrapper (for non-stat cards)
// ──────────────────────────────────────────────────────────────────────────────

interface PremiumCardWrapperProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  onClick?: () => void;
  whileTap?: any;
}

export function PremiumCardWrapper({ children, className, style, delay = 0, onClick, whileTap }: PremiumCardWrapperProps) {
  const {
    cardRef,
    rotateX,
    rotateY,
    glowX,
    glowY,
    isHovered,
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
  } = usePremiumCard(4);

  const spotlightBg = useMotionTemplate`radial-gradient(250px circle at ${glowX} ${glowY}, rgba(249,115,22,0.08), transparent 70%)`;

  return (
    <motion.div
      ref={cardRef}
      className={`${styles.premiumWrapper} ${className || ''}`}
      style={{ ...style, rotateX, rotateY, transformPerspective: 1000 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={whileTap}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <motion.div className={styles.spotlight} style={{ background: spotlightBg }} />
      {isHovered && <div className={styles.shineSweep} />}
      {children}
    </motion.div>
  );
}
