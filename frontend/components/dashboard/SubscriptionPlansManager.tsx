'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Package, PlusCircle, Search, Users, Coins, TrendingUp,
  FileText, Pencil, Trash2, Power, Star,
  MessageCircle, Smartphone, Phone, Bot, Sparkles, Megaphone,
  Check, X, BarChart2, Activity, Filter, SlidersHorizontal,
  ArrowUpRight, ArrowDownRight, Grid3x3, List,
  Code2, Webhook
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionTemplate, animate } from 'framer-motion';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

// ─────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────
interface SubscriptionPlansManagerProps {
  locale: string;
  adminPlans: any[];
  invoices: any[];
  planSearch: string;
  setPlanSearch: (v: string) => void;
  planFilter: 'all' | 'active' | 'disabled';
  setPlanFilter: (v: 'all' | 'active' | 'disabled') => void;
  planSort: 'default' | 'price_asc' | 'price_desc';
  setPlanSort: (v: 'default' | 'price_asc' | 'price_desc') => void;
  handleEditPlan: (plan: any) => void;
  handleTogglePlan: (id: number, currentActive: boolean) => void;
  handleDeletePlan: (id: number) => void;
  resetPlanForm: () => void;
  setIsPlanModalOpen: (v: boolean) => void;
  renderPlanIcon: (icon: string) => React.ReactNode;
}

// ─────────────────────────────────────────────────────────
//  COUNT-UP HOOK  (runs once, triggered by `enabled` flag)
// ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 650, delay = 0, enabled = true) {
  const [count, setCount] = useState(target); // start at final value to avoid flash
  const rafRef = useRef<number>(0);
  const lastTarget = useRef<number>(target);  // track last animated target

  useEffect(() => {
    if (!enabled) return;
    // Nothing changed — skip
    if (lastTarget.current === target) return;
    lastTarget.current = target;

    // Cancel any in-flight animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // Snap immediately if prefers-reduced-motion or target is 0
    if (target === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return;
    }

    // Animate from current count → new target
    const from = count;
    let timer: ReturnType<typeof setTimeout>;
    const run = () => {
      const startTime = performance.now();
      function tick(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(from + (target - from) * eased));
        if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (delay > 0) { timer = setTimeout(run, delay); } else { run(); }

    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, delay, enabled]);

  return count;
}

// ─────────────────────────────────────────────────────────
//  INTERSECTION OBSERVER HOOK  (fires once)
// ─────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─────────────────────────────────────────────────────────
//  KPI CARD
// ─────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: number | string;
  numericValue: number;
  icon: React.ReactNode;
  accent: string;
  pct: number;
  trend?: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
}
function KpiCard({ label, numericValue, icon, accent, pct, trend = 0, prefix = '', suffix = '', delay = 0 }: KpiCardProps) {
  const [hovered, setHovered] = useState(false);
  const displayValue = numericValue > 9999 ? `${(numericValue / 1000).toFixed(1)}K` : numericValue.toString();

  return (
    <div
      className="spm-kpi-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(145deg, rgba(${hexToRgb(accent)}, 0.07), rgba(30,30,38,0.95))`
          : 'linear-gradient(145deg, rgba(30,30,38,0.95), rgba(26,26,34,0.98))',
        border: hovered ? `1px solid rgba(${hexToRgb(accent)}, 0.3)` : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(${hexToRgb(accent)}, 0.15)`
          : '0 4px 16px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -60, right: -60, width: 140, height: 140,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${hexToRgb(accent)}, 0.12) 0%, transparent 70%)`,
        pointerEvents: 'none', transition: 'opacity 0.3s',
        opacity: hovered ? 1 : 0.5,
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '14px',
          background: `rgba(${hexToRgb(accent)}, 0.15)`,
          border: `1px solid rgba(${hexToRgb(accent)}, 0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 4px 12px rgba(${hexToRgb(accent)}, 0.2)`,
          transition: 'transform 0.3s',
          transform: hovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
        }}>
          {icon}
        </div>
        {trend !== 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            padding: '4px 10px', borderRadius: '20px',
            background: trend > 0 ? 'rgba(39,194,129,0.1)' : 'rgba(239,83,80,0.1)',
            border: `1px solid ${trend > 0 ? 'rgba(39,194,129,0.2)' : 'rgba(239,83,80,0.2)'}`,
            fontSize: '11px', fontWeight: 700,
            color: trend > 0 ? '#27C281' : '#EF5350',
          }}>
            {trend > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
          {label}
        </div>
        <div style={{
          fontSize: numericValue > 999 ? '28px' : '32px',
          fontWeight: 900, lineHeight: 1.1,
          color: '#F0EDE8',
          letterSpacing: '-1px',
          fontFamily: "'Cairo', sans-serif",
        }}>
          <AnimatedNumber value={`${prefix}${displayValue}${suffix}`} delay={delay / 1000} />
        </div>
      </div>

      {/* Progress line */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          height: '3px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: '10px',
            background: `linear-gradient(90deg, ${accent}, ${lightenColor(accent)})`,
            width: `${pct}%`,
            transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 8px ${accent}80`,
          }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  LIMIT BOX  (usage limit tile with count-up)
// ─────────────────────────────────────────────────────────
interface LimitBoxItem {
  label: string;
  rawNum: number;
  value: string | number;
  icon: React.ReactNode;
  unlimited: boolean;
}
function LimitBox({
  item, i, accentColor, inView, hoveredLimit, setHoveredLimit,
}: {
  item: LimitBoxItem;
  i: number;
  accentColor: string;
  inView: boolean;
  hoveredLimit: number | null;
  setHoveredLimit: (v: number | null) => void;
}) {
  const limHovered = hoveredLimit === i;
  // Count-up only for finite numbers; triggered once when inView flips true
  const displayNum = useCountUp(item.unlimited ? 0 : item.rawNum, 650, i * 80, !item.unlimited && inView);

  const displayValue = item.unlimited
    ? '∞'
    : typeof item.rawNum === 'number' && item.rawNum > 0
      ? displayNum.toLocaleString()
      : item.value;

  return (
    <div
      onMouseEnter={() => setHoveredLimit(i)}
      onMouseLeave={() => setHoveredLimit(null)}
      style={{
        background: limHovered
          ? `rgba(${hexToRgb(accentColor)}, 0.08)`
          : 'rgba(255,255,255,0.03)',
        border: limHovered
          ? `1px solid rgba(${hexToRgb(accentColor)}, 0.3)`
          : '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px', padding: '12px', textAlign: 'center',
        transition: 'background 0.22s cubic-bezier(0.22,1,0.36,1), border-color 0.22s cubic-bezier(0.22,1,0.36,1), transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s cubic-bezier(0.22,1,0.36,1)',
        transform: limHovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: limHovered ? `0 6px 18px rgba(${hexToRgb(accentColor)}, 0.18)` : 'none',
        cursor: 'default',
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'center', marginBottom: '6px',
        transition: 'transform 0.22s ease, filter 0.22s ease',
        transform: limHovered ? 'scale(1.12)' : 'scale(1)',
        filter: limHovered ? 'brightness(1.35)' : 'brightness(1)',
      }}>{item.icon}</div>
      <div style={{
        fontSize: item.unlimited ? '18px' : '16px', fontWeight: 900,
        color: item.unlimited ? accentColor : '#F0EDE8', lineHeight: 1,
        transition: 'transform 0.22s cubic-bezier(0.22,1,0.36,1)',
        transform: limHovered ? 'scale(1.05)' : 'scale(1)',
        display: 'block',
      }}>
        {displayValue}
      </div>
      <div style={{
        fontSize: '9.5px',
        color: limHovered ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)',
        marginTop: '4px', fontWeight: 600, textTransform: 'uppercase' as const,
        letterSpacing: '0.3px', transition: 'color 0.2s ease',
      }}>
        {item.label}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  PLAN CARD
// ─────────────────────────────────────────────────────────
interface PlanCardProps {
  plan: any;
  locale: string;
  isBestSeller: boolean;
  planAccent: (icon: string) => { color: string; color2: string; label: string; badge: string };
  badgeColor: Record<string, string>;
  featureDef: { key: string; label: string; icon: React.ReactNode; group: string }[];
  renderPlanIcon: (icon: string) => React.ReactNode;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  animationDelay: number;
  invoiceCount: number;
  revenue: number;
}

// ─────────────────────────────────────────────────────────
//  PREMIUM PLAN CARD (Stripe/Vercel Aesthetic)
// ─────────────────────────────────────────────────────────
function PremiumPlanCard({
  plan, locale, isBestSeller, planAccent, badgeColor, featureDef,
  renderPlanIcon, onEdit, onToggle, onDelete, animationDelay,
  invoiceCount, revenue
}: PlanCardProps) {
  const accent = planAccent(plan.icon);
  const isAr = locale === 'ar';

  // framer-motion values for 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth transforms to limit max rotation to 6 degrees
  const rotateX = useTransform(mouseY, [-300, 300], [6, -6]);
  const rotateY = useTransform(mouseX, [-300, 300], [-6, 6]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Price Count Up replaced by AnimatedNumber
  const finalPrice = parseFloat(plan.price);

  const features = featureDef.map(f => ({ ...f, enabled: !!(plan as any)[f.key] })).filter(f => f.enabled);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: [0, -4, 0], opacity: 1 }}
      transition={{
        y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        opacity: { duration: 0.4, delay: animationDelay * 0.1 }
      }}
      whileHover={{ scale: 1.03, y: -10 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        position: 'relative',
        borderRadius: '24px',
        background: 'linear-gradient(145deg, rgba(20,20,28,0.7), rgba(12,12,18,0.9))',
        border: `1px solid rgba(255,255,255,0.08)`,
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        minHeight: '480px'
      }}
      className="premium-plan-card"
    >
      {/* Background Noise & Beam Lights */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '-30%', left: '-20%', width: '140%', height: '140%', background: `radial-gradient(circle at 50% 0%, rgba(${hexToRgb(accent.color)}, 0.12), transparent 60%)`, pointerEvents: 'none', zIndex: 0 }} />

      {/* Hover Glow using framer-motion template */}
      <motion.div style={{
        position: 'absolute', inset: 0, borderRadius: '24px',
        boxShadow: useMotionTemplate`0 0 40px 0 rgba(${hexToRgb(accent.color)}, 0.25) inset`,
        opacity: 0, pointerEvents: 'none', zIndex: 1
      }} whileHover={{ opacity: 1, background: 'rgba(255,255,255,0.02)' }} />

      {/* Animated Scanner */}
      <motion.div
        animate={{ left: ['-100%', '200%'] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5.5, ease: 'linear' }}
        style={{
          position: 'absolute', top: 0, bottom: 0, width: '40%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
          transform: 'skewX(-25deg)', pointerEvents: 'none', zIndex: 10
        }}
      />

      {/* TOP AREA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 2 }}>
        {/* Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {isBestSeller && plan.is_active ? (
            <motion.div
              animate={{ boxShadow: ['0 0 0 rgba(232,131,58,0)', '0 0 15px rgba(232,131,58,0.4)', '0 0 0 rgba(232,131,58,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                background: 'linear-gradient(135deg, rgba(232,131,58,0.2), rgba(212,113,46,0.1))',
                border: '1px solid rgba(232,131,58,0.35)',
                padding: '6px 14px', borderRadius: '20px',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                backdropFilter: 'blur(8px)'
              }}
            >
              <Star size={12} color="#E8833A" fill="#E8833A" />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#E8833A', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {isAr ? 'الأكثر مبيعاً' : 'Best Seller'}
              </span>
            </motion.div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.6)'
            }}>
              {accent.badge}
            </div>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: plan.is_active ? 'rgba(39,194,129,0.1)' : 'rgba(255,255,255,0.05)',
            padding: '6px 14px', borderRadius: '20px',
            border: `1px solid ${plan.is_active ? 'rgba(39,194,129,0.25)' : 'rgba(255,255,255,0.1)'}`
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: plan.is_active ? '#27C281' : 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: plan.is_active ? '#27C281' : 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>
              {plan.is_active ? (isAr ? 'نشطة' : 'ACTIVE') : (isAr ? 'معطّلة' : 'DISABLED')}
            </span>
          </div>
        </div>

        {/* Plan Name & Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <motion.div
            whileHover={{ rotate: 8, scale: 1.1 }}
            style={{
              width: 48, height: 48, borderRadius: '14px',
              background: `linear-gradient(135deg, rgba(${hexToRgb(accent.color)}, 0.2), transparent)`,
              border: `1px solid rgba(${hexToRgb(accent.color)}, 0.4)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px rgba(${hexToRgb(accent.color)}, 0.2)`
            }}
          >
            {React.cloneElement(renderPlanIcon(plan.icon) as React.ReactElement<any>, { size: 24, color: accent.color })}
          </motion.div>
          <h3 style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: '#F0EDE8', fontFamily: "'Cairo', sans-serif", letterSpacing: '-1px' }}>
            {plan.name}
          </h3>
        </div>
        {plan.description && (
          <p style={{ margin: 0, fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '90%' }}>
            {plan.description}
          </p>
        )}
      </div>

      {/* PRICE BLOCK */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', zIndex: 2 }}>
        <motion.span
          whileHover={{ scale: 1.05 }}
          style={{ fontSize: '64px', fontWeight: 900, color: accent.color, lineHeight: 1, letterSpacing: '-2px', fontFamily: "'Cairo', sans-serif", originX: isAr ? 1 : 0 }}
        >
          <AnimatedNumber value={finalPrice} />
        </motion.span>
        <div style={{ paddingBottom: '10px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>SAR</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>/ {plan.duration_days} {isAr ? 'يوم' : 'days'}</div>
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, zIndex: 2 }}>
        <AnimatePresence>
          {features.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, x: isAr ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <motion.div
                whileHover={{ scale: 1.2, rotate: 15 }}
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${accent.color}, ${accent.color2})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, boxShadow: `0 2px 8px rgba(${hexToRgb(accent.color)}, 0.4)`
                }}
              >
                <Check size={14} color="#fff" />
              </motion.div>
              <span style={{ fontSize: '15px', color: '#E0E0E0', fontWeight: 600 }}>{f.label}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ACTIONS */}
      <div style={{ display: 'flex', gap: '12px', zIndex: 2, marginTop: '16px' }}>
        <PremiumButton label={isAr ? 'تعديل' : 'Edit'} icon={<Pencil size={15} />} onClick={onEdit} accent={accent.color} />
        <PremiumButton label={plan.is_active ? (isAr ? 'تعطيل' : 'Disable') : (isAr ? 'تفعيل' : 'Enable')} icon={<Power size={15} />} onClick={onToggle} accent={plan.is_active ? '#F4B740' : '#27C281'} />
        <PremiumButton label="" icon={<Trash2 size={15} />} onClick={onDelete} accent="#EF5350" compact />
      </div>
    </motion.div>
  );
}

function PremiumButton({ label, icon, onClick, accent, compact = false }: any) {
  return (
    <motion.button
      whileHover="hover"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        flex: compact ? 'none' : 1,
        padding: compact ? '14px' : '14px 20px',
        borderRadius: '16px',
        border: `1px solid rgba(${hexToRgb(accent)}, 0.3)`,
        background: `linear-gradient(135deg, rgba(${hexToRgb(accent)}, 0.1), rgba(${hexToRgb(accent)}, 0.05))`,
        color: accent,
        fontSize: '14px', fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
        fontFamily: "'Cairo', sans-serif"
      }}
    >
      {/* Scroll glow sweep effect */}
      <motion.div
        variants={{ hover: { left: '150%' } }}
        initial={{ left: '-100%', top: 0, bottom: 0, width: '50%', position: 'absolute', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', transform: 'skewX(-20deg)', pointerEvents: 'none' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {/* Full button hover highlight */}
      <motion.div
        variants={{ hover: { opacity: 0.15 } }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: accent, pointerEvents: 'none'
        }}
      />
      {icon}
      {!compact && label && <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>}
    </motion.button>
  );
}

function PlanCard({
  plan, locale, isBestSeller, planAccent, badgeColor, featureDef,
  renderPlanIcon, onEdit, onToggle, onDelete, animationDelay,
  invoiceCount, revenue
}: PlanCardProps) {
  const [hovered, setHovered] = useState(false);
  const [spotPos, setSpotPos] = useState({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [pressed, setPressed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // per-feature row hover
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  // per-limit box hover
  const [hoveredLimit, setHoveredLimit] = useState<number | null>(null);

  // Intersection observer — triggers count-up once on entrance
  const { ref: inViewRef, inView } = useInView(0.1);

  // Detect touch device once
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none)').matches);
  }, []);

  const accent = planAccent(plan.icon);
  const topGrad = `linear-gradient(90deg, ${accent.color}, ${accent.color2})`;
  const features = featureDef.map(f => ({ ...f, enabled: !!(plan as any)[f.key] }));
  const enabledFeatures = features.filter(f => f.enabled);
  const disabledFeatures = features.filter(f => !f.enabled);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current || isTouchDevice) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpotPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const yearlyPrice = parseFloat(plan.price) * (365 / (plan.duration_days || 30));

  // stagger class — animationDelay is the card index (0-based)
  const staggerClass = `spm-stagger-${Math.min(animationDelay, 5)}`;

  // Combine refs
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    (inViewRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [inViewRef]);

  return (
    <div
      ref={setRefs}
      className={`spm-plan-card ${staggerClass}${pressed ? ' spm-card-pressed' : ''}`}
      onMouseEnter={() => { if (!isTouchDevice) setHovered(true); }}
      onMouseLeave={() => { setHovered(false); setSpotPos({ x: -999, y: -999 }); setPressed(false); }}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        background: '#13131a',
        border: isBestSeller && plan.is_active
          ? hovered
            ? `1px solid rgba(232,131,58,0.5)`
            : `1px solid rgba(232,131,58,0.22)`
          : hovered
            ? `1px solid rgba(${hexToRgb(accent.color)}, 0.4)`
            : `1px solid rgba(255,255,255,0.07)`,
        borderRadius: '24px',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'default',
        transition: 'border-color 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s cubic-bezier(0.22,1,0.36,1), transform 0.26s cubic-bezier(0.22,1,0.36,1)',
        transform: pressed
          ? 'scale(0.985)'
          : hovered
            ? 'translateY(-8px) scale(1.012)'
            : 'translateY(0) scale(1)',
        boxShadow: isBestSeller && plan.is_active
          ? hovered
            ? `0 28px 56px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,131,58,0.38), 0 0 40px rgba(232,131,58,0.10), inset 0 1px 0 rgba(255,255,255,0.05)`
            : `0 12px 40px rgba(232,131,58,0.16), 0 4px 16px rgba(0,0,0,0.3)`
          : hovered
            ? `0 28px 56px rgba(0,0,0,0.48), 0 0 0 1px rgba(${hexToRgb(accent.color)}, 0.22), 0 0 32px rgba(${hexToRgb(accent.color)}, 0.07), inset 0 1px 0 rgba(255,255,255,0.04)`
            : `0 8px 32px rgba(0,0,0,0.28)`,
        opacity: plan.is_active ? 1 : 0.55,
      }}
    >
      {/* ── Inner clipping wrapper (spotlight + card bg stay inside radius) */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '24px',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
      }}>
        {/* Mouse Spotlight — disabled on touch devices */}
        {!isTouchDevice && (
          <div style={{
            position: 'absolute',
            left: spotPos.x - 140, top: spotPos.y - 140,
            width: 280, height: 280,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${hexToRgb(accent.color)}, 0.065) 0%, transparent 68%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.45s ease',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Top gradient border — persistent glow for best-seller, brighter on hover */}
      <div style={{
        height: isBestSeller && plan.is_active ? '3px' : '2px',
        background: isBestSeller && plan.is_active
          ? 'linear-gradient(90deg, #E8833A 0%, #F4B740 45%, #FFD97D 60%, #F4B740 75%, transparent 100%)'
          : topGrad,
        flexShrink: 0,
        borderRadius: '24px 24px 0 0',
        boxShadow: isBestSeller && plan.is_active
          ? hovered
            ? '0 0 22px rgba(244,183,64,0.75), 0 0 8px rgba(232,131,58,0.5)'
            : '0 0 14px rgba(244,183,64,0.55)'
          : hovered
            ? `0 0 12px rgba(${hexToRgb(accent.color)}, 0.45)`
            : 'none',
        transition: 'box-shadow 0.25s ease, height 0.25s ease',
        willChange: 'box-shadow',
      }} />
      {/* Persistent subtle top-edge highlight for best-seller */}
      {isBestSeller && plan.is_active && (
        <div className="spm-featured-glow" style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(244,183,64,0.6), transparent)',
          borderRadius: '50%',
          filter: 'blur(2px)',
          pointerEvents: 'none',
          zIndex: 3,
        }} />
      )}

      {/* ── PREMIUM BEST SELLER BADGE ────────────────────────────── */}
      {isBestSeller && plan.is_active && (
        <div
          className="spm-best-badge"
          style={{
            position: 'absolute',
            top: '-13px',
            right: locale === 'ar' ? 'auto' : '20px',
            left: locale === 'ar' ? '20px' : 'auto',
            zIndex: 10,
            animationName: locale === 'ar'
              ? 'spmBadgeInRtl, bestSellerFloat'
              : 'spmBadgeIn,    bestSellerFloat',
            animationDuration: '0.35s,        3s',
            animationTimingFunction: 'cubic-bezier(0.22,1,0.36,1), ease-in-out',
            animationDelay: '0.15s,        0.5s',
            animationFillMode: 'both,         none',
            animationIterationCount: '1,            infinite',
          }}
        >
          <div className="spm-glow-breath" style={{
            position: 'absolute', inset: '-5px', borderRadius: '26px',
            background: 'radial-gradient(ellipse at center, rgba(244,183,64,0.38) 0%, transparent 68%)',
            pointerEvents: 'none',
            animation: 'bestSellerGlow 3s ease-in-out 0.6s infinite',
            willChange: 'opacity, transform',
          }} />
          <div style={{
            position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 13px 5px 10px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #F0A832 0%, #E8833A 55%, #D4712E 100%)',
            border: '1px solid rgba(255,220,130,0.35)',
            boxShadow: '0 4px 18px rgba(232,131,58,0.38), 0 1px 4px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.22)',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
              borderRadius: '20px 20px 0 0',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)',
              pointerEvents: 'none',
            }} />
            <div className="spm-badge-shine" style={{
              position: 'absolute', top: 0, bottom: 0, width: '40%',
              background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%)',
              pointerEvents: 'none',
              animation: 'spmBadgeShine 5s ease-in-out 1s infinite',
              willChange: 'left, opacity',
            }} />
            <span className="spm-badge-star">
              <Star size={10} fill="rgba(255,255,255,0.95)" color="rgba(255,255,255,0.95)" />
            </span>
            <span style={{
              fontSize: '10.5px', fontWeight: 800, color: 'rgba(255,255,255,0.97)',
              letterSpacing: '0.4px', fontFamily: "'Cairo', sans-serif",
              lineHeight: 1, position: 'relative', zIndex: 1,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}>
              {locale === 'ar' ? 'الأكثر مبيعاً' : 'Best Seller'}
            </span>
          </div>
        </div>
      )}

      {/* Card Body */}
      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, position: 'relative', zIndex: 2 }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>

          {/* Left: icon + identity */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>

            {/* Icon */}
            <div style={{
              width: 48, height: 48, borderRadius: '16px', flexShrink: 0,
              background: `linear-gradient(145deg, rgba(${hexToRgb(accent.color)}, 0.18), rgba(${hexToRgb(accent.color2)}, 0.06))`,
              border: `1px solid rgba(${hexToRgb(accent.color)}, ${hovered ? '0.5' : '0.28'})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.32s cubic-bezier(0.22,1,0.36,1), box-shadow 0.32s ease, border-color 0.25s ease',
              transform: hovered ? 'scale(1.06) translateY(-1px)' : 'scale(1) translateY(0)',
              boxShadow: hovered
                ? `0 6px 20px rgba(${hexToRgb(accent.color)}, 0.28), inset 0 1px 0 rgba(255,255,255,0.1)`
                : `inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}>
              {React.cloneElement(renderPlanIcon(plan.icon) as React.ReactElement<any>, { size: 24, color: accent.color })}
            </div>

            {/* Plan identity: name + tier badge + description */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Name row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '4px' }}>
                {/* Plan name */}
                <div
                  className="spm-plan-name"
                  style={{
                    fontSize: '30px',
                    fontWeight: 800,
                    lineHeight: 1.05,
                    letterSpacing: '-0.6px',
                    color: isBestSeller && plan.is_active
                      ? accent.color
                      : '#F0EDE8',
                    fontFamily: "'Cairo', sans-serif",
                    textTransform: /^[a-zA-Z]/.test(plan.name) ? 'uppercase' as const : 'none' as const,
                    filter: hovered
                      ? isBestSeller && plan.is_active
                        ? `brightness(1.15) drop-shadow(0 0 8px rgba(${hexToRgb(accent.color)}, 0.35))`
                        : 'brightness(1.06)'
                      : 'brightness(1)',
                    transition: 'filter 0.28s ease, transform 0.28s cubic-bezier(0.22,1,0.36,1)',
                    transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
                    whiteSpace: 'nowrap' as const,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {plan.name}
                </div>

                {/* Tier badge pill */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '3px 9px', borderRadius: '20px',
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
                  textTransform: 'uppercase' as const,
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid rgba(${hexToRgb(accent.color)}, 0.28)`,
                  color: accent.color,
                  backdropFilter: 'blur(8px)',
                  flexShrink: 0,
                  boxShadow: `0 0 8px rgba(${hexToRgb(accent.color)}, 0.10)`,
                }}>
                  {accent.label}
                </span>
              </div>

              {/* Accent underline — expands on hover */}
              <div style={{
                height: '2px',
                borderRadius: '2px',
                background: `linear-gradient(90deg, ${accent.color}, ${accent.color2}, transparent)`,
                transition: 'width 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
                width: hovered ? '72px' : '40px',
                opacity: hovered ? 0.9 : 0.55,
                marginBottom: '8px',
              }} />

              {/* Description — muted, below title */}
              {plan.description && (
                <div style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.38)',
                  lineHeight: 1.5,
                  fontWeight: 400,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                  maxWidth: '240px',
                }}>
                  {plan.description}
                </div>
              )}
            </div>
          </div>

          {/* Right: status + badge pills (unchanged) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
            <span style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 800,
              letterSpacing: '0.5px', textTransform: 'uppercase' as const,
              background: plan.is_active ? 'rgba(39,194,129,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${plan.is_active ? 'rgba(39,194,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: plan.is_active ? '#27C281' : 'rgba(255,255,255,0.35)',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: plan.is_active ? '#27C281' : 'rgba(255,255,255,0.3)' }} />
              {plan.is_active ? (locale === 'ar' ? 'نشطة' : 'ACTIVE') : (locale === 'ar' ? 'معطّلة' : 'DISABLED')}
            </span>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: 800,
              letterSpacing: '0.6px', textTransform: 'uppercase' as const,
              background: badgeColor[accent.badge] || 'rgba(154,154,154,0.12)',
              color: '#fff', opacity: 0.85,
            }}>
              {accent.badge}
            </span>
          </div>
        </div>

        {/* ── PRICE BLOCK ── */}
        <div style={{
          background: hovered
            ? `linear-gradient(135deg, rgba(${hexToRgb(accent.color)}, 0.10), rgba(${hexToRgb(accent.color2)}, 0.04))`
            : `linear-gradient(135deg, rgba(${hexToRgb(accent.color)}, 0.06), rgba(${hexToRgb(accent.color2)}, 0.02))`,
          border: hovered
            ? `1px solid rgba(${hexToRgb(accent.color)}, 0.22)`
            : `1px solid rgba(${hexToRgb(accent.color)}, 0.14)`,
          borderRadius: '20px',
          padding: '24px',
          position: 'relative', overflow: 'hidden',
          transition: 'background 0.28s ease, border-color 0.28s ease',
        }}>
          <div style={{
            position: 'absolute', right: -20, top: -20,
            fontSize: '72px', opacity: hovered ? 0.08 : 0.05, lineHeight: 1,
            userSelect: 'none', pointerEvents: 'none',
            transition: 'opacity 0.3s ease',
          }}>
            {React.cloneElement(renderPlanIcon(plan.icon) as React.ReactElement<any>, { size: 72, color: accent.color })}
          </div>

          {/* Main price — slightly reduced to balance with prominent plan name */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '12px' }}>
            <span style={{
              fontSize: '46px', fontWeight: 900, lineHeight: 1,
              color: accent.color, letterSpacing: '-2.5px',
              fontFamily: "'Cairo', sans-serif",
              display: 'inline-block',
              transition: 'transform 0.28s cubic-bezier(0.22,1,0.36,1), filter 0.28s ease',
              transform: hovered ? 'scale(1.025)' : 'scale(1)',
              filter: hovered ? 'brightness(1.12)' : 'brightness(1)',
              transformOrigin: locale === 'ar' ? 'right bottom' : 'left bottom',
            }}>
              {parseFloat(plan.price).toFixed(0)}
            </span>
            <div style={{ paddingBottom: '5px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>SAR</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
                / {plan.duration_days} {locale === 'ar' ? 'يوم' : 'days'}
              </div>
            </div>
          </div>

          {/* Yearly equivalent */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            width: 'fit-content',
          }}>
            <TrendingUp size={11} color="rgba(255,255,255,0.3)" />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              {locale === 'ar' ? 'ما يعادل سنوياً:' : 'Annual equiv:'} {yearlyPrice.toFixed(0)} SAR
            </span>
          </div>

          {plan.description && (
            <div style={{ display: 'none' }} />
          )}
        </div>

        {/* ── USAGE LIMITS ── */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '12px' }}>
            {locale === 'ar' ? 'حدود الاستخدام' : 'Usage Limits'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { label: locale === 'ar' ? 'رسائل' : 'Messages', rawNum: plan.message_limit ?? 0, value: plan.is_messages_unlimited ? '∞' : (plan.message_limit?.toLocaleString() ?? '—'), icon: <MessageCircle size={14} color={accent.color} />, unlimited: plan.is_messages_unlimited },
              { label: locale === 'ar' ? 'أجهزة' : 'Devices', rawNum: plan.device_limit ?? 0, value: plan.is_devices_unlimited ? '∞' : (plan.device_limit ?? '—'), icon: <Smartphone size={14} color={accent.color} />, unlimited: plan.is_devices_unlimited },
              { label: locale === 'ar' ? 'أرقام' : 'Numbers', rawNum: plan.number_limit ?? 0, value: plan.is_numbers_unlimited ? '∞' : (plan.number_limit ?? '—'), icon: <Phone size={14} color={accent.color} />, unlimited: plan.is_numbers_unlimited },
            ].map((item, i) => (
              <LimitBox
                key={i}
                item={item}
                i={i}
                accentColor={accent.color}
                inView={inView}
                hoveredLimit={hoveredLimit}
                setHoveredLimit={setHoveredLimit}
              />
            ))}
          </div>
        </div>

        {/* ── FEATURES (grouped) ── */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '12px' }}>
            {locale === 'ar' ? 'المميزات' : 'Features'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {enabledFeatures.map((f, fIdx) => {
              const fHov = hoveredFeature === f.key;
              return (
                <div
                  key={f.key}
                  onMouseEnter={() => setHoveredFeature(f.key)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className="spm-feature-row"
                  style={{
                    '--feature-delay': `${fIdx * 35}ms`,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', borderRadius: '12px',
                    background: fHov
                      ? `rgba(${hexToRgb(accent.color)}, 0.11)`
                      : `rgba(${hexToRgb(accent.color)}, 0.06)`,
                    border: fHov
                      ? `1px solid rgba(${hexToRgb(accent.color)}, 0.28)`
                      : `1px solid rgba(${hexToRgb(accent.color)}, 0.15)`,
                    transition: 'background 0.18s ease, border-color 0.18s ease, transform 0.18s ease',
                    transform: fHov ? (locale === 'ar' ? 'translateX(-2px)' : 'translateX(2px)') : 'translateX(0)',
                    cursor: 'default',
                    opacity: fHov ? 1 : 0.92,
                  } as React.CSSProperties}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: accent.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease',
                    transform: fHov ? 'scale(1.15)' : 'scale(1)',
                    filter: fHov ? 'brightness(1.25)' : 'brightness(1)',
                    boxShadow: fHov ? `0 0 8px rgba(${hexToRgb(accent.color)}, 0.5)` : 'none',
                  }}>
                    <Check size={10} color="#fff" />
                  </div>
                  <span style={{ fontSize: '12px', color: fHov ? '#fff' : '#F0EDE8', fontWeight: 600, transition: 'color 0.18s ease', lineHeight: 1 }}>{f.icon}</span>
                  <span style={{ fontSize: '12.5px', color: fHov ? '#fff' : '#F0EDE8', fontWeight: 600, transition: 'color 0.18s ease' }}>{f.label}</span>
                </div>
              );
            })}
            {disabledFeatures.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {disabledFeatures.map(f => (
                  <div
                    key={f.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '5px 10px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      opacity: 0.5,
                      transition: 'opacity 0.18s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.65'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.5'; }}
                  >
                    <X size={9} color="rgba(255,255,255,0.2)" />
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>{f.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── METRICS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px', padding: '14px',
            transition: 'border-color 0.2s ease, background 0.2s ease',
            ...(hovered ? { border: '1px solid rgba(255,255,255,0.11)', background: 'rgba(255,255,255,0.05)' } : {}),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Users size={12} color="rgba(255,255,255,0.35)" />
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                {locale === 'ar' ? 'مشتركون' : 'Subscribers'}
              </span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#F0EDE8', lineHeight: 1 }}>{invoiceCount}</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px', padding: '14px',
            transition: 'border-color 0.2s ease, background 0.2s ease',
            ...(hovered ? { border: '1px solid rgba(255,255,255,0.11)', background: 'rgba(255,255,255,0.05)' } : {}),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Coins size={12} color="rgba(255,255,255,0.35)" />
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                {locale === 'ar' ? 'إيرادات' : 'Revenue'}
              </span>
            </div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#F0EDE8', lineHeight: 1 }}>
              {revenue.toFixed(0)} <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>SAR</span>
            </div>
          </div>
        </div>

        {/* ── ACTION BAR ── */}
        <div style={{
          display: 'flex', gap: '8px', marginTop: 'auto',
          paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <ActionButton variant="edit" label={locale === 'ar' ? 'تعديل' : 'Edit'} icon={<Pencil size={13} />} onClick={onEdit} accent={accent.color} />
          <ActionButton
            variant={plan.is_active ? 'warn' : 'success'}
            label={plan.is_active ? (locale === 'ar' ? 'تعطيل' : 'Disable') : (locale === 'ar' ? 'تفعيل' : 'Enable')}
            icon={<Power size={13} />}
            onClick={onToggle}
            accent={plan.is_active ? '#F4B740' : '#27C281'}
          />
          <ActionButton variant="danger" label="" icon={<Trash2 size={13} />} onClick={onDelete} accent="#EF5350" compact />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  ACTION BUTTON
// ─────────────────────────────────────────────────────────
interface ActionButtonProps {
  variant: 'edit' | 'warn' | 'success' | 'danger';
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  accent: string;
  compact?: boolean;
}
function ActionButton({ label, icon, onClick, accent, compact = false }: ActionButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  // Track shine: each hover gets one unique key, shine runs exactly once
  const [shineKey, setShineKey] = useState<number | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const newRipple = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 600);
    onClick();
  };

  const handleEnter = () => {
    setHovered(true);
    setShineKey(Date.now()); // new key = new shine animation, runs once
  };
  const handleLeave = () => {
    setHovered(false);
    setPressed(false);
    setShineKey(null);
  };

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        flex: compact ? 'none' : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        padding: compact ? '10px 14px' : '10px 14px',
        borderRadius: '14px',
        border: `1px solid rgba(${hexToRgb(accent)}, ${hovered ? '0.4' : '0.15'})`,
        background: hovered ? `rgba(${hexToRgb(accent)}, 0.12)` : `rgba(${hexToRgb(accent)}, 0.06)`,
        color: accent,
        fontSize: '12px', fontWeight: 700,
        cursor: 'pointer',
        transition: 'border-color 0.18s ease, background 0.18s ease, transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s ease',
        transform: pressed ? 'scale(0.98)' : hovered ? 'translateY(-2px) scale(1.015)' : 'none',
        boxShadow: hovered ? `0 6px 20px rgba(${hexToRgb(accent)}, 0.22)` : 'none',
        position: 'relative', overflow: 'hidden',
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      {ripples.map(r => (
        <div key={r.id} style={{
          position: 'absolute',
          left: r.x - 15, top: r.y - 15, width: 30, height: 30,
          borderRadius: '50%',
          background: `rgba(${hexToRgb(accent)}, 0.3)`,
          pointerEvents: 'none',
          animation: 'spmRipple 0.6s ease-out forwards',
        }} />
      ))}
      {/* One-shot shine per hover — keyed so it restarts on each new hover */}
      {shineKey !== null && (
        <div key={shineKey} style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.10) 50%, transparent 80%)',
          backgroundSize: '200% 100%',
          animation: 'spmShineOnce 0.55s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}
      {icon}
      {!compact && label && <span>{label}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
//  UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255,255,255';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}
function lightenColor(hex: string): string {
  const map: Record<string, string> = {
    '#E8833A': '#F4B740', '#27C281': '#4ADE80', '#F4B740': '#FDE68A',
    '#A68B5B': '#D4A46A', '#EF5350': '#F87171', '#3B82F6': '#60A5FA',
  };
  return map[hex] || hex;
}

// ─────────────────────────────────────────────────────────
//  DELETE CONFIRM MODAL
// ─────────────────────────────────────────────────────────
interface DeleteConfirmModalProps {
  open: boolean;
  locale: string;
  planName: string;
  subscriberCount: number;
  onConfirm: () => void;
  onDisable: () => void;
  onCancel: () => void;
}
function DeleteConfirmModal({ open, locale, planName, subscriberCount, onConfirm, onDisable, onCancel }: DeleteConfirmModalProps) {
  const isAr = locale === 'ar';
  const hasSubscribers = subscriberCount > 0;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        animation: 'spmFadeIn 0.18s ease',
        direction: isAr ? 'rtl' : 'ltr',
      }}
    >
      <div style={{
        background: 'linear-gradient(160deg, #1a1a26 0%, #141420 100%)',
        border: hasSubscribers
          ? '1px solid rgba(251,191,36,0.25)'
          : '1px solid rgba(239,83,80,0.25)',
        borderRadius: '24px',
        padding: '36px 32px 28px',
        maxWidth: '420px',
        width: '90vw',
        boxShadow: hasSubscribers
          ? '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(251,191,36,0.1)'
          : '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(239,83,80,0.1)',
        animation: 'spmSlideUp 0.22s cubic-bezier(0.22,1,0.36,1)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle top glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: hasSubscribers
            ? 'linear-gradient(90deg, transparent, rgba(251,191,36,0.7), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(239,83,80,0.7), transparent)',
          borderRadius: '24px 24px 0 0',
        }} />

        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: '18px',
          background: hasSubscribers ? 'rgba(251,191,36,0.1)' : 'rgba(239,83,80,0.1)',
          border: hasSubscribers ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(239,83,80,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px',
        }}>
          {hasSubscribers
            ? <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            : <Trash2 size={24} color="#EF5350" />
          }
        </div>

        {/* Title */}
        <div style={{
          fontSize: '18px', fontWeight: 800, color: '#F0EDE8',
          marginBottom: '10px', lineHeight: 1.25,
          fontFamily: "'Cairo', sans-serif",
        }}>
          {hasSubscribers
            ? (isAr ? 'لا يمكن حذف الباقة' : 'Cannot Delete Plan')
            : (isAr ? 'حذف الباقة' : 'Delete Plan')
          }
        </div>

        {/* Plan name chip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px', padding: '4px 12px',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
            {planName}
          </span>
        </div>

        {/* Body text */}
        <div style={{
          fontSize: '14px', color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.7, marginBottom: '24px',
          fontFamily: "'Cairo', sans-serif",
        }}>
          {hasSubscribers ? (
            <>
              {isAr ? (
                <>
                  هذه الباقة لديها <strong style={{ color: '#FBBF24' }}>{subscriberCount} مشترك</strong> نشط.
                  <br />لا يمكن حذف الباقة أثناء وجود مشتركين.
                  <br /><br />يمكنك <strong style={{ color: '#F0EDE8' }}>تعطيل الباقة</strong> بدلاً من ذلك لمنع الاشتراكات الجديدة.
                </>
              ) : (
                <>
                  This plan has <strong style={{ color: '#FBBF24' }}>{subscriberCount} active subscriber{subscriberCount > 1 ? 's' : ''}</strong>.
                  <br />Plans with active subscribers cannot be deleted.
                  <br /><br />You can <strong style={{ color: '#F0EDE8' }}>disable the plan</strong> instead to prevent new subscriptions.
                </>
              )}
            </>
          ) : (
            isAr
              ? 'هل أنت متأكد من حذف هذه الباقة؟ لا يمكن التراجع عن هذا الإجراء.'
              : 'Are you sure you want to delete this plan? This action cannot be undone.'
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: isAr ? 'flex-start' : 'flex-end' }}>
          {/* Cancel always shown */}
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Cairo', sans-serif",
              transition: 'background 0.18s ease, color 0.18s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)'; }}
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          {hasSubscribers ? (
            /* Disable instead */
            <button
              onClick={onDisable}
              style={{
                padding: '10px 22px', borderRadius: '12px', border: '1px solid rgba(251,191,36,0.3)',
                background: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(251,191,36,0.08))',
                color: '#FBBF24',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Cairo', sans-serif",
                transition: 'all 0.18s ease',
                display: 'flex', alignItems: 'center', gap: '7px',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,191,36,0.22)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(251,191,36,0.08))'; }}
            >
              <Power size={14} />
              {isAr ? 'تعطيل الباقة' : 'Disable Plan'}
            </button>
          ) : (
            /* Confirm delete */
            <button
              onClick={onConfirm}
              style={{
                padding: '10px 22px', borderRadius: '12px', border: '1px solid rgba(239,83,80,0.35)',
                background: 'linear-gradient(135deg, rgba(239,83,80,0.22), rgba(239,83,80,0.10))',
                color: '#EF5350',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Cairo', sans-serif",
                transition: 'all 0.18s ease',
                display: 'flex', alignItems: 'center', gap: '7px',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,83,80,0.28)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(239,83,80,0.22), rgba(239,83,80,0.10))'; }}
            >
              <Trash2 size={14} />
              {isAr ? 'حذف الباقة' : 'Delete Plan'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────
export default function SubscriptionPlansManager({
  locale, adminPlans, invoices,
  planSearch, setPlanSearch,
  planFilter, setPlanFilter,
  planSort, setPlanSort,
  handleEditPlan, handleTogglePlan, handleDeletePlan,
  resetPlanForm, setIsPlanModalOpen,
  renderPlanIcon,
}: SubscriptionPlansManagerProps) {

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ── Delete confirmation modal state ────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; subscribers: number } | null>(null);
  const openDeleteModal = (plan: any, subscribers: number) => {
    setDeleteTarget({ id: plan.id, name: plan.name, subscribers });
  };
  const closeDeleteModal = () => setDeleteTarget(null);
  const confirmDelete = () => {
    if (deleteTarget) handleDeletePlan(deleteTarget.id);
    closeDeleteModal();
  };
  const confirmDisable = () => {
    if (deleteTarget) handleTogglePlan(deleteTarget.id, true); // true = currently active → disable
    closeDeleteModal();
  };

  // ── derived stats ──────────────────────────────────────
  const activePlansCount = adminPlans.filter(p => p.is_active).length;
  const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
  const totalRevenue = paidInvoices.reduce((s: number, i: any) => s + parseFloat(i.amount || 0), 0);
  const annualRevenue = totalRevenue * (365 / 30);
  const uniqueSubscribers = new Set(paidInvoices.map((i: any) => i.user)).size;
  const pendingInvoices = invoices.filter((i: any) => i.status === 'pending').length;

  // ── filter & sort ──────────────────────────────────────
  const filtered = adminPlans
    .filter(p => {
      if (planFilter === 'active' && !p.is_active) return false;
      if (planFilter === 'disabled' && p.is_active) return false;
      if (planSearch) {
        const q = planSearch.toLowerCase();
        return p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a: any, b: any) => {
      if (planSort === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
      if (planSort === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
      return (a.order ?? 0) - (b.order ?? 0);
    });

  const bestSellingPlan = adminPlans.reduce((best: any, p: any) => {
    const pSubs = invoices.filter((i: any) => i.plan === p.id && i.status === 'paid').length;
    const bSubs = best ? invoices.filter((i: any) => i.plan === best.id && i.status === 'paid').length : 0;
    return pSubs > bSubs ? p : best;
  }, null as any);

  // ── plan accent map ────────────────────────────────────
  const planAccent = (icon: string) => {
    switch (icon) {
      case 'vip': return { color: '#E8833A', color2: '#D4712E', label: locale === 'ar' ? 'ماسية' : 'Diamond', badge: 'BEST VALUE' };
      case 'gold': return { color: '#F4B740', color2: '#D4972E', label: locale === 'ar' ? 'ذهبية' : 'Gold', badge: 'POPULAR' };
      case 'silver': return { color: '#A68B5B', color2: '#8B7248', label: locale === 'ar' ? 'فضية' : 'Silver', badge: 'STARTER' };
      case 'diamond': return { color: '#E8833A', color2: '#A68B5B', label: locale === 'ar' ? 'بلاتينية' : 'Platinum', badge: 'POPULAR' };
      case 'max': return { color: '#27C281', color2: '#1DA66D', label: 'Max', badge: 'ENTERPRISE' };
      case 'plus': return { color: '#27C281', color2: '#1A8F5C', label: 'Enterprise', badge: 'ENTERPRISE' };
      default: return { color: '#9A9A9A', color2: '#7A7A7A', label: locale === 'ar' ? 'أساسية' : 'Basic', badge: 'BASIC' };
    }
  };

  const badgeColor: Record<string, string> = {
    'BEST VALUE': 'linear-gradient(135deg,#E8833A,#D4712E)',
    'POPULAR': 'linear-gradient(135deg,#F4B740,#D4972E)',
    'ENTERPRISE': 'linear-gradient(135deg,#27C281,#1DA66D)',
    'STARTER': 'linear-gradient(135deg,#A68B5B,#8B7248)',
    'BASIC': 'rgba(154,154,154,0.25)',
  };

  const featureDef = [
    { key: 'interactive_bot', label: locale === 'ar' ? 'بوت تفاعلي' : 'Interactive Bot', icon: <Bot size={12} />, group: 'automation' },
    { key: 'ai_reply', label: locale === 'ar' ? 'ردود AI' : 'AI Replies', icon: <Sparkles size={12} />, group: 'automation' },
    { key: 'broadcasts', label: locale === 'ar' ? 'إشعارات جماعية' : 'Broadcasts', icon: <Megaphone size={12} />, group: 'messaging' },
    { key: 'api_access', label: 'API Access', icon: <Code2 size={12} />, group: 'api' },
    { key: 'webhooks', label: 'Webhooks', icon: <Webhook size={12} />, group: 'api' },
  ];

  const kpiData = [
    { label: locale === 'ar' ? 'إجمالي الباقات' : 'Total Plans', numeric: adminPlans.length, icon: <Package size={19} color="#E8833A" />, accent: '#E8833A', pct: 100, trend: 0 },
    { label: locale === 'ar' ? 'الباقات النشطة' : 'Active Plans', numeric: activePlansCount, icon: <Activity size={19} color="#27C281" />, accent: '#27C281', pct: adminPlans.length ? (activePlansCount / adminPlans.length) * 100 : 0, trend: 5 },
    { label: locale === 'ar' ? 'المشتركون' : 'Subscribers', numeric: uniqueSubscribers, icon: <Users size={19} color="#3B82F6" />, accent: '#3B82F6', pct: 72, trend: 12 },
    { label: locale === 'ar' ? 'الفواتير' : 'Invoices', numeric: invoices.length, icon: <FileText size={19} color="#F4B740" />, accent: '#F4B740', pct: 85, trend: 8 },
    { label: locale === 'ar' ? 'الإيرادات (SAR)' : 'Revenue (SAR)', numeric: Math.round(totalRevenue), icon: <Coins size={19} color="#E8833A" />, accent: '#E8833A', pct: 76, trend: 15, suffix: '' },
    { label: locale === 'ar' ? 'إسقاط سنوي' : 'Annual Proj.', numeric: Math.round(annualRevenue), icon: <TrendingUp size={19} color="#27C281" />, accent: '#27C281', pct: 90, trend: 20, suffix: '' },
  ];

  return (
    <>
      {/* ── GLOBAL STYLES ─────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

        .spm-root {
          font-family: 'Cairo', 'IBM Plex Sans Arabic', -apple-system, sans-serif;
          display: flex; flex-direction: column; gap: 0;
        }

        /* ── KPI Card ── */
        .spm-kpi-card { animation: spmFadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both; }
        @keyframes spmFadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Plan Card ─ staggered entrance ─────────────────── */
        .spm-plan-card {
          animation: spmSlideIn 0.36s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        /* stagger per-card delays (0–5) */
        .spm-stagger-0 { animation-delay: 0ms;   }
        .spm-stagger-1 { animation-delay: 65ms;  }
        .spm-stagger-2 { animation-delay: 130ms; }
        .spm-stagger-3 { animation-delay: 195ms; }
        .spm-stagger-4 { animation-delay: 260ms; }
        .spm-stagger-5 { animation-delay: 325ms; }
        @keyframes spmSlideIn {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }

        /* ── Mobile tap feedback ─────────────────────────── */
        .spm-card-pressed {
          transform: scale(0.985) !important;
          transition: transform 0.12s ease !important;
        }

        /* ── Featured top-edge persistent pulse ──────────── */
        .spm-featured-glow {
          animation: spmFeaturedPulse 4s ease-in-out infinite;
          will-change: opacity;
        }
        @keyframes spmFeaturedPulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1.0; }
        }

        /* ── Feature rows ─ stagger on card entrance ─────── */
        .spm-feature-row {
          animation: spmFeatureIn 0.28s cubic-bezier(0.22,1,0.36,1) both;
          animation-delay: var(--feature-delay, 0ms);
        }
        @keyframes spmFeatureIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Best Seller Badge ─ entrance ─────────────────────────── */
        @keyframes spmBadgeIn {
          from { opacity: 0; transform: translateX(14px) scale(0.88); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
        @keyframes spmBadgeInRtl {
          from { opacity: 0; transform: translateX(-14px) scale(0.88); }
          to   { opacity: 1; transform: translateX(0)    scale(1); }
        }

        /* ── Best Seller Badge ─ continuous float + breathe ──────── */
        @keyframes bestSellerFloat {
          0%   { transform: translateY(0px)  scale(1);     }
          45%  { transform: translateY(-3px) scale(1.025); }
          100% { transform: translateY(0px)  scale(1);     }
        }

        /* ── Best Seller Badge ─ ambient glow breathe ─────────── */
        @keyframes bestSellerGlow {
          0%   { opacity: 0.15; transform: scale(1);    }
          50%  { opacity: 0.30; transform: scale(1.08); }
          100% { opacity: 0.15; transform: scale(1);    }
        }

        /* ── Best Seller Badge ─ star rock ──────────────────── */
        @keyframes bestSellerStar {
          0%   { transform: rotate(-4deg) scale(1);    }
          50%  { transform: rotate( 5deg) scale(1.08); }
          100% { transform: rotate(-4deg) scale(1);    }
        }

        /* ── Best Seller Badge ─ periodic shine sweep ────────── */
        @keyframes spmBadgeShine {
          0%        { left: -90%; opacity: 0;   }
          8%        { opacity: 1;               }
          55%       { left: 140%; opacity: 0.5; }
          100%      { left: 140%; opacity: 0;   }
        }

        /* ── Badge wrapper ─ continuous float ──────────────── */
        .spm-best-badge {
          animation: bestSellerFloat 3s ease-in-out infinite;
          will-change: transform;
        }

        /* ── Hover ─ enhances but NOT required for motion ──────── */
        .spm-plan-card:hover .spm-best-badge {
          filter:
            drop-shadow(0 10px 28px rgba(232,131,58,0.5))
            drop-shadow(0 2px 6px rgba(0,0,0,0.35));
        }

        /* ── Star ─ continuous rock ───────────────────────── */
        .spm-badge-star {
          display: inline-flex;
          flex-shrink: 0;
          animation: bestSellerStar 2.5s ease-in-out infinite;
          will-change: transform;
        }
        /* Hover adds a glow on top of the existing rock */
        .spm-plan-card:hover .spm-badge-star {
          filter: drop-shadow(0 0 5px rgba(255,210,100,0.75));
        }

        /* ── Ripple ── */
        @keyframes spmRipple {
          0%   { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(6); opacity: 0; }
        }

        /* ── One-shot shine (button) ── */
        @keyframes spmShineOnce {
          0%   { background-position: -200% 0; opacity: 0; }
          15%  { opacity: 1; }
          100% { background-position: 200% 0; opacity: 0; }
        }

        /* ── Legacy shine (kept for safety) ── */
        @keyframes spmShine {
          from { background-position: -200% 0; }
          to   { background-position: 200% 0; }
        }

        /* ── Pulse dot ── */
        @keyframes spmPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.4); }
        }

        /* ── Toolbar inputs ── */
        .spm-search {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 11px 16px 11px 44px;
          color: #F0EDE8; font-size: 14px;
          outline: none; width: 100%;
          font-family: 'Cairo', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .spm-search:focus {
          border-color: rgba(232,131,58,0.5);
          box-shadow: 0 0 0 4px rgba(232,131,58,0.08);
        }
        .spm-search::placeholder { color: rgba(255,255,255,0.25); }
        .spm-select {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 11px 16px;
          color: #F0EDE8; font-size: 13px;
          outline: none; cursor: pointer;
          font-family: 'Cairo', sans-serif;
          transition: border-color 0.2s;
          appearance: none;
          min-width: 140px;
        }
        .spm-select:focus { border-color: rgba(232,131,58,0.5); }

        /* ── Plan name \u2014 responsive type scale ──────────── */
        .spm-plan-name {
          will-change: filter, transform;
        }
        @media (max-width: 600px) {
          .spm-plan-name { font-size: 26px !important; }
        }
        @media (max-width: 400px) {
          .spm-plan-name { font-size: 24px !important; letter-spacing: -0.4px !important; }
        }

        /* ── Mobile: reduce card lift, no spotlight ──────── */
        @media (hover: none) {
          .spm-plan-card:hover {
            transform: none !important;
          }
          .spm-plan-card:active {
            transform: scale(0.985) !important;
            transition: transform 0.12s ease !important;
          }
        }

        /* ── Responsive ── */
        @media (max-width: 1280px) {
          .spm-kpi-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .spm-plans-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .spm-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .spm-plans-grid { grid-template-columns: 1fr !important; }
          .spm-hero-actions { flex-direction: column !important; align-items: stretch !important; }
          .spm-toolbar { flex-wrap: wrap !important; }
          .spm-hero-stats { flex-wrap: wrap !important; }
        }
        @media (max-width: 600px) {
          .spm-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .spm-hero-inner { flex-direction: column !important; }
          .spm-toolbar { gap: 8px !important; }
        }
        @media (max-width: 400px) {
          .spm-kpi-grid { grid-template-columns: 1fr !important; }
        }

        /* ── prefers-reduced-motion ─ kill all movement gracefully ─── */
        @media (prefers-reduced-motion: reduce) {
          .spm-plan-card   { animation: none !important; opacity: 1 !important; transform: none !important; }
          .spm-kpi-card    { animation: none !important; opacity: 1 !important; }
          .spm-feature-row { animation: none !important; opacity: 1 !important; }
          .spm-best-badge  { animation: none !important; }
          .spm-badge-star  { animation: none !important; }
          .spm-glow-breath { animation: none !important; }
          .spm-badge-shine { animation: none !important; }
          .spm-featured-glow { animation: none !important; }
        }
      `}</style>

      <div className="spm-root">

        {/* ═══════════════════════════════════════════════════
             SECTION 1 — PREMIUM HERO HEADER
        ═══════════════════════════════════════════════════ */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(20,20,28,0.98), rgba(16,16,24,0.99))',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '28px',
          padding: '40px 44px',
          position: 'relative', overflow: 'hidden',
          marginBottom: '24px',
        }}>
          {/* Ambient orbs */}
          <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,131,58,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, left: '30%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(39,194,129,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div className="spm-hero-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '32px', position: 'relative', zIndex: 1 }}>
            {/* Left: title + description + stat chips */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                {/* Icon */}
                <div style={{
                  width: 60, height: 60, borderRadius: '20px', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(232,131,58,0.2), rgba(232,131,58,0.06))',
                  border: '1px solid rgba(232,131,58,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(232,131,58,0.2)',
                }}>
                  <Package size={28} color="#E8833A" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 900, color: '#F0EDE8', letterSpacing: '-0.8px', lineHeight: 1.1 }}>
                    {locale === 'ar' ? 'إدارة الباقات' : 'Plans Management'}
                  </h2>
                  <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, maxWidth: '440px' }}>
                    {locale === 'ar'
                      ? 'أنشئ وأدر باقات الاشتراك بمرونة كاملة — تحكم في الأسعار والمميزات وحدود الاستخدام'
                      : 'Create and manage subscription plans with full control over pricing, features, and usage limits'}
                  </p>
                </div>
              </div>

              {/* Stat chips */}
              <div className="spm-hero-stats" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Active plans chip */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(39,194,129,0.08)', border: '1px solid rgba(39,194,129,0.2)',
                  borderRadius: '20px', padding: '7px 16px',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#27C281', animation: 'spmPulse 2s ease-in-out infinite' }} />
                  <span style={{ fontSize: '12.5px', color: '#27C281', fontWeight: 700 }}>
                    {activePlansCount} {locale === 'ar' ? 'باقة نشطة' : 'Active Plans'}
                  </span>
                </div>
                {/* Total plans */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(232,131,58,0.07)', border: '1px solid rgba(232,131,58,0.18)',
                  borderRadius: '20px', padding: '7px 16px',
                }}>
                  <BarChart2 size={12} color="#E8833A" />
                  <span style={{ fontSize: '12.5px', color: '#E8833A', fontWeight: 700 }}>
                    {adminPlans.length} {locale === 'ar' ? 'إجمالي' : 'Total'}
                  </span>
                </div>
                {/* Subscribers */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)',
                  borderRadius: '20px', padding: '7px 16px',
                }}>
                  <Users size={12} color="#3B82F6" />
                  <span style={{ fontSize: '12.5px', color: '#3B82F6', fontWeight: 700 }}>
                    {uniqueSubscribers} {locale === 'ar' ? 'مشترك' : 'Subscribers'}
                  </span>
                </div>
                {/* Pending */}
                {pendingInvoices > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(244,183,64,0.07)', border: '1px solid rgba(244,183,64,0.2)',
                    borderRadius: '20px', padding: '7px 16px',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F4B740' }} />
                    <span style={{ fontSize: '12.5px', color: '#F4B740', fontWeight: 700 }}>
                      {pendingInvoices} {locale === 'ar' ? 'طلب معلق' : 'Pending'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="spm-hero-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              {/* Secondary — export / import placeholder */}
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 22px', borderRadius: '14px', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)', fontSize: '13.5px', fontWeight: 700,
                  fontFamily: "'Cairo', sans-serif",
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; (e.currentTarget as HTMLElement).style.color = '#F0EDE8'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              >
                <SlidersHorizontal size={15} />
                {locale === 'ar' ? 'تخصيص' : 'Customize'}
              </button>

              {/* Primary — Create plan */}
              <button
                onClick={() => { resetPlanForm(); setIsPlanModalOpen(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 24px', borderRadius: '14px', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #E8833A, #D4712E)',
                  border: 'none',
                  color: '#fff', fontSize: '13.5px', fontWeight: 800,
                  fontFamily: "'Cairo', sans-serif",
                  boxShadow: '0 8px 28px rgba(232,131,58,0.35)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-3px) scale(1.02)'; el.style.boxShadow = '0 14px 36px rgba(232,131,58,0.5)'; el.style.background = 'linear-gradient(135deg, #F0923F, #E8833A)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = '0 8px 28px rgba(232,131,58,0.35)'; el.style.background = 'linear-gradient(135deg, #E8833A, #D4712E)'; }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.02)'; }}
              >
                <PlusCircle size={17} />
                {locale === 'ar' ? 'إنشاء باقة جديدة' : 'Create New Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
             SECTION 2 — KPI CARDS
        ═══════════════════════════════════════════════════ */}
        <div className="spm-kpi-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '14px',
          marginBottom: '24px',
        }}>
          {kpiData.map((kpi, idx) => (
            <KpiCard
              key={idx}
              label={kpi.label}
              value={kpi.numeric}
              numericValue={kpi.numeric}
              icon={kpi.icon}
              accent={kpi.accent}
              pct={kpi.pct}
              trend={kpi.trend}
              delay={idx * 80}
            />
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════
             SECTION 3 — FLOATING TOOLBAR
        ═══════════════════════════════════════════════════ */}
        <div className="spm-toolbar" style={{
          background: 'rgba(16,16,24,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          position: 'sticky', top: '12px', zIndex: 50,
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', zIndex: 1 }} />
            <input
              type="text"
              className="spm-search"
              placeholder={locale === 'ar' ? 'البحث باسم الباقة أو الوصف...' : 'Search plans...'}
              value={planSearch}
              onChange={e => setPlanSearch(e.target.value)}
              style={{ paddingLeft: locale === 'ar' ? '16px' : '44px', paddingRight: locale === 'ar' ? '44px' : '16px' }}
            />
            {locale === 'ar' && <Search size={15} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

          {/* Status filter */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Filter size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
            <select
              className="spm-select"
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value as any)}
              style={{ paddingLeft: '34px' }}
            >
              <option value="all">{locale === 'ar' ? 'كل الحالات' : 'All Status'}</option>
              <option value="active">{locale === 'ar' ? 'نشطة فقط' : 'Active Only'}</option>
              <option value="disabled">{locale === 'ar' ? 'معطّلة فقط' : 'Disabled Only'}</option>
            </select>
          </div>

          {/* Sort */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <SlidersHorizontal size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
            <select
              className="spm-select"
              value={planSort}
              onChange={e => setPlanSort(e.target.value as any)}
              style={{ paddingLeft: '34px' }}
            >
              <option value="default">{locale === 'ar' ? 'الترتيب الافتراضي' : 'Default Order'}</option>
              <option value="price_asc">{locale === 'ar' ? 'السعر: الأقل أولاً' : 'Price ↑'}</option>
              <option value="price_desc">{locale === 'ar' ? 'السعر: الأعلى أولاً' : 'Price ↓'}</option>
            </select>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '3px' }}>
            {(['grid', 'list'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  width: 34, height: 30, borderRadius: '9px', border: 'none', cursor: 'pointer',
                  background: viewMode === mode ? 'rgba(232,131,58,0.15)' : 'transparent',
                  color: viewMode === mode ? '#E8833A' : 'rgba(255,255,255,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.18s',
                }}
              >
                {mode === 'grid' ? <Grid3x3 size={14} /> : <List size={14} />}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8833A' }} />
            <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              {filtered.length} {locale === 'ar' ? 'باقة' : 'plans'}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
             SECTION 4 — PLANS GRID
        ═══════════════════════════════════════════════════ */}
        {filtered.length === 0 ? (
          /* Empty state */
          <div style={{
            textAlign: 'center', padding: '100px 40px',
            background: 'rgba(16,16,24,0.8)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '24px',
          }}>
            <div style={{ fontSize: '56px', marginBottom: '20px' }}>📦</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#F0EDE8', marginBottom: '10px' }}>
              {locale === 'ar' ? 'لا توجد باقات مطابقة' : 'No plans found'}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
              {locale === 'ar' ? 'عدّل معايير البحث أو أنشئ باقة جديدة' : 'Adjust your filters or create a new plan'}
            </div>
            <button
              onClick={() => { resetPlanForm(); setIsPlanModalOpen(true); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '14px', cursor: 'pointer',
                background: 'linear-gradient(135deg, #E8833A, #D4712E)',
                border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700,
                boxShadow: '0 8px 24px rgba(232,131,58,0.3)',
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              <PlusCircle size={16} />
              {locale === 'ar' ? 'إنشاء باقة الآن' : 'Create Your First Plan'}
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="spm-plans-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '20px',
          }}>
            {filtered.map((p: any, cardIdx: number) => (
              <PremiumPlanCard
                key={p.id}
                plan={p}
                locale={locale}
                isBestSeller={!!(bestSellingPlan && bestSellingPlan.id === p.id)}
                planAccent={planAccent}
                badgeColor={badgeColor}
                featureDef={featureDef}
                renderPlanIcon={renderPlanIcon}
                onEdit={() => handleEditPlan(p)}
                onToggle={() => handleTogglePlan(p.id, p.is_active)}
                onDelete={() => openDeleteModal(p, invoices.filter((i: any) => i.plan === p.id && i.status === 'paid').length)}
                animationDelay={cardIdx}  /* pass index, not ms */
                invoiceCount={invoices.filter((i: any) => i.plan === p.id && i.status === 'paid').length}
                revenue={invoices.filter((i: any) => i.plan === p.id && i.status === 'paid').reduce((s: number, i: any) => s + parseFloat(i.amount || 0), 0)}
              />
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((p: any, cardIdx: number) => {
              const accent = planAccent(p.icon);
              const isBestSeller = bestSellingPlan && bestSellingPlan.id === p.id;
              const invCount = invoices.filter((i: any) => i.plan === p.id && i.status === 'paid').length;
              const rev = invoices.filter((i: any) => i.plan === p.id && i.status === 'paid').reduce((s: number, i: any) => s + parseFloat(i.amount || 0), 0);

              return (
                <ListPlanRow
                  key={p.id}
                  plan={p} locale={locale} accent={accent} isBestSeller={!!isBestSeller}
                  renderPlanIcon={renderPlanIcon}
                  invCount={invCount} rev={rev}
                  onEdit={() => handleEditPlan(p)}
                  onToggle={() => handleTogglePlan(p.id, p.is_active)}
                  onDelete={() => openDeleteModal(p, invCount)}
                  animIdx={cardIdx}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <DeleteConfirmModal
        open={deleteTarget !== null}
        locale={locale}
        planName={deleteTarget?.name ?? ''}
        subscriberCount={deleteTarget?.subscribers ?? 0}
        onConfirm={confirmDelete}
        onDisable={confirmDisable}
        onCancel={closeDeleteModal}
      />
    </>
  );
}


// ─────────────────────────────────────────────────────────
//  LIST ROW VIEW
// ─────────────────────────────────────────────────────────
function ListPlanRow({
  plan, locale, accent, isBestSeller, renderPlanIcon,
  invCount, rev, onEdit, onToggle, onDelete, animIdx
}: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `rgba(${hexToRgb(accent.color)}, 0.04)` : 'rgba(16,16,24,0.8)',
        border: hovered ? `1px solid rgba(${hexToRgb(accent.color)}, 0.25)` : '1px solid rgba(255,255,255,0.07)',
        borderRadius: '18px',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: '20px',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateX(4px)' : 'none',
        animation: `spmFadeInUp 0.4s cubic-bezier(0.4,0,0.2,1) ${animIdx * 50}ms both`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent left bar */}
      <div style={{
        position: 'absolute', left: 0, top: 12, bottom: 12, width: 3,
        background: `linear-gradient(180deg, ${accent.color}, ${accent.color2})`,
        borderRadius: '0 4px 4px 0',
        transition: 'opacity 0.2s',
        opacity: hovered ? 1 : 0.4,
      }} />

      {/* Icon */}
      <div style={{
        width: 46, height: 46, borderRadius: '14px', flexShrink: 0,
        background: `rgba(${hexToRgb(accent.color)}, 0.1)`,
        border: `1px solid rgba(${hexToRgb(accent.color)}, 0.2)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {React.cloneElement(renderPlanIcon(plan.icon) as React.ReactElement<any>, { size: 22, color: accent.color })}
      </div>

      {/* Name + status */}
      <div style={{ flex: '0 0 200px' }}>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#F0EDE8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {plan.name}
          {isBestSeller && <Star size={12} color="#F4B740" fill="#F4B740" />}
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, marginTop: '4px',
          background: plan.is_active ? 'rgba(39,194,129,0.1)' : 'rgba(255,255,255,0.05)',
          color: plan.is_active ? '#27C281' : 'rgba(255,255,255,0.3)',
          border: `1px solid ${plan.is_active ? 'rgba(39,194,129,0.2)' : 'rgba(255,255,255,0.07)'}`,
        }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: plan.is_active ? '#27C281' : 'rgba(255,255,255,0.3)' }} />
          {plan.is_active ? (locale === 'ar' ? 'نشطة' : 'Active') : (locale === 'ar' ? 'معطّلة' : 'Disabled')}
        </span>
      </div>

      {/* Price */}
      <div style={{ flex: '0 0 120px' }}>
        <div style={{ fontSize: '22px', fontWeight: 900, color: accent.color, lineHeight: 1 }}>
          {parseFloat(plan.price).toFixed(0)}
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginLeft: '4px' }}>SAR</span>
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>
          / {plan.duration_days} {locale === 'ar' ? 'يوم' : 'days'}
        </div>
      </div>

      {/* Usage */}
      <div style={{ flex: '0 0 160px', display: 'flex', gap: '8px' }}>
        {[
          { label: locale === 'ar' ? 'رسائل' : 'Msgs', val: plan.is_messages_unlimited ? '∞' : plan.message_limit },
          { label: locale === 'ar' ? 'أجهزة' : 'Dev', val: plan.is_devices_unlimited ? '∞' : plan.device_limit },
          { label: locale === 'ar' ? 'أرقام' : 'Nums', val: plan.is_numbers_unlimited ? '∞' : plan.number_limit },
        ].map((u, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#F0EDE8' }}>{u.val}</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{u.label}</div>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div style={{ flex: '0 0 160px', display: 'flex', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#F0EDE8' }}>{invCount}</div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{locale === 'ar' ? 'مشتركون' : 'Subs'}</div>
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#F0EDE8' }}>{rev.toFixed(0)}</div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>SAR</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexShrink: 0 }}>
        <ActionButton variant="edit" label={locale === 'ar' ? 'تعديل' : 'Edit'} icon={<Pencil size={13} />} onClick={onEdit} accent={accent.color} />
        <ActionButton variant={plan.is_active ? 'warn' : 'success'} label={plan.is_active ? (locale === 'ar' ? 'تعطيل' : 'Disable') : (locale === 'ar' ? 'تفعيل' : 'Enable')} icon={<Power size={13} />} onClick={onToggle} accent={plan.is_active ? '#F4B740' : '#27C281'} />
        <ActionButton variant="danger" label="" icon={<Trash2 size={13} />} onClick={onDelete} accent="#EF5350" compact />
      </div>
    </div>
  );
}
