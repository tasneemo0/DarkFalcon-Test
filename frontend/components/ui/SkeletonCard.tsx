'use client';

import React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';

interface SkeletonRowProps {
  height?: number;
  width?: string;
}

interface SkeletonCardProps {
  /** Number of row skeletons to render */
  rows?: number;
  /** Show a header skeleton at the top */
  showHeader?: boolean;
  /** Show an icon skeleton in the header */
  showIcon?: boolean;
}

function SkeletonRow({ height = 14, width = '100%' }: SkeletonRowProps) {
  return (
    <div
      className={styles.saasSkeleton}
      style={{ height, width, borderRadius: 8 }}
    />
  );
}

/**
 * Premium skeleton card with shimmer wave effect.
 * Drop-in replacement for loading states.
 */
export default function SkeletonCard({ rows = 3, showHeader = true, showIcon = true }: SkeletonCardProps) {
  return (
    <div className={styles.saasCard} style={{ gap: 16, pointerEvents: 'none' }}>
      {showHeader && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <SkeletonRow height={12} width="40%" />
            <SkeletonRow height={28} width="60%" />
          </div>
          {showIcon && (
            <div
              className={styles.saasSkeleton}
              style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0 }}
            />
          )}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow
            key={i}
            height={12}
            width={i === rows - 1 ? '55%' : '100%'}
          />
        ))}
      </div>
    </div>
  );
}

/** Grid of skeleton cards for stat card loading states */
export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20,
        marginBottom: 24,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} rows={2} showIcon />
      ))}
    </div>
  );
}
