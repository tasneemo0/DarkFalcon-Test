'use client';

import React, { useEffect, useState } from 'react';
import { Crown, MessageCircle, Smartphone, Phone, CheckCircle2, ArrowUpRight, Check } from 'lucide-react';

interface UserCurrentPlanOverviewProps {
  subscription: any;
  locale: string;
  renderPlanIcon: (iconName: string) => React.ReactNode;
}

export function UserCurrentPlanOverview({ subscription, locale, renderPlanIcon }: UserCurrentPlanOverviewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!subscription) return null;

  const plan = subscription.plan_details;
  const usage = subscription.usage || {};

  const msgsUsed = usage.messages_used || 0;
  const msgsLimit = plan?.is_messages_unlimited ? Infinity : (usage.messages_limit || 0);
  const msgsPct = plan?.is_messages_unlimited ? 0 : Math.min(100, (msgsUsed / Math.max(1, msgsLimit)) * 100);

  const devsUsed = usage.devices_used || 0;
  const devsLimit = plan?.is_devices_unlimited ? Infinity : (usage.devices_limit || 0);
  const devsPct = plan?.is_devices_unlimited ? 0 : Math.min(100, (devsUsed / Math.max(1, devsLimit)) * 100);

  const numsUsed = usage.numbers_used || 0;
  const numsLimit = plan?.is_numbers_unlimited ? Infinity : (usage.numbers_limit || 0);
  const numsPct = plan?.is_numbers_unlimited ? 0 : Math.min(100, (numsUsed / Math.max(1, numsLimit)) * 100);

  return (
    <>
      <style>{`
        .ucpo-container {
          /* Light Mode / Default Tokens */
          --ucpo-bg: #F6F7F9;
          --ucpo-surface: #FFFFFF;
          --ucpo-card-bg: #FFFFFF;
          --ucpo-surface-sec: #F8F9FB;
          --ucpo-inner: #F3F4F6;
          --ucpo-border: rgba(15, 23, 42, 0.08);
          --ucpo-border-hover: rgba(245, 130, 50, 0.30);
          --ucpo-text-primary: #18181B;
          --ucpo-text-secondary: #667085;
          --ucpo-text-muted: #98A2B3;
          --ucpo-brand: #E86F20;
          --ucpo-brand-hover: #F58A3A;
          --ucpo-brand-soft: rgba(232, 111, 32, 0.12);
          --ucpo-brand-border: rgba(232, 111, 32, 0.28);
          --ucpo-brand-glow: rgba(232, 111, 32, 0.15);
          --ucpo-success: #10B981;
          --ucpo-success-soft: rgba(16, 185, 129, 0.1);
          --ucpo-track: #EAECF0;
          --ucpo-shadow-subtle: 0 4px 20px rgba(15, 23, 42, 0.05);
          --ucpo-shadow-hover: 0 8px 24px rgba(245, 130, 50, 0.20);
          /* Button Tokens */
          --ucpo-btn-bg: #FFFFFF;
          --ucpo-btn-border: rgba(15, 23, 42, 0.12);
          --ucpo-btn-text: #18181B;
          --ucpo-btn-hover-border: rgba(232, 111, 32, 0.40);
          --ucpo-btn-hover-bg: rgba(232, 111, 32, 0.04);
          --ucpo-btn-hover-shadow: none;
        }

        :root[data-theme="dark"] .ucpo-container, 
        [data-theme="dark"] .ucpo-container, 
        .dark .ucpo-container {
          /* Dark Mode Tokens */
          --ucpo-bg: #0B0C10;
          --ucpo-surface: #101218;
          --ucpo-card-bg: #14171D;
          --ucpo-surface-sec: #171A21;
          --ucpo-inner: #0F1217;
          --ucpo-border: rgba(255, 255, 255, 0.07);
          --ucpo-border-hover: rgba(245, 130, 50, 0.20);
          --ucpo-text-primary: #F5F7FA;
          --ucpo-text-secondary: #9CA3AF;
          --ucpo-text-muted: #6B7280;
          --ucpo-brand: #F58232;
          --ucpo-brand-hover: #FF9345;
          --ucpo-brand-soft: rgba(245, 130, 50, 0.12);
          --ucpo-brand-border: rgba(245, 130, 50, 0.28);
          --ucpo-brand-glow: rgba(245, 130, 50, 0.15);
          --ucpo-success: #10B981;
          --ucpo-success-soft: rgba(16, 185, 129, 0.1);
          --ucpo-track: rgba(255, 255, 255, 0.07);
          --ucpo-shadow-subtle: 0 4px 20px rgba(0, 0, 0, 0.2);
          --ucpo-shadow-hover: 0 8px 24px rgba(245, 130, 50, 0.20);
          /* Button Tokens */
          --ucpo-btn-bg: transparent;
          --ucpo-btn-border: rgba(255, 255, 255, 0.12);
          --ucpo-btn-text: #F5F7FA;
          --ucpo-btn-hover-border: rgba(245, 130, 50, 0.45);
          --ucpo-btn-hover-bg: rgba(245, 130, 50, 0.05);
          --ucpo-btn-hover-shadow: 0 6px 20px rgba(245, 130, 50, 0.08);
        }

        /* Core Animations */
        @keyframes ucpoFadeInUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ucpoPulseBadge {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { opacity: 0.8; box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        }
        @keyframes ucpoRotateGlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ucpoBgGlowFloat {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          33% { transform: translate(30px, -20px) scale(1.05); opacity: 0.5; }
          66% { transform: translate(-20px, 30px) scale(0.95); opacity: 0.2; }
        }
        @keyframes ucpoShineSweep {
          0% { left: -100%; opacity: 0; }
          20% { opacity: 0.3; }
          100% { left: 200%; opacity: 0; }
        }

        /* Container Layout */
        .ucpo-container {
          background: var(--ucpo-surface);
          border: 1px solid var(--ucpo-border);
          border-radius: 24px;
          padding: 40px;
          box-shadow: var(--ucpo-shadow-subtle);
          display: flex;
          flex-direction: column;
          gap: 32px;
          position: relative;
          overflow: hidden;
          transition: background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }
        
        .ucpo-header {
          display: flex;
          align-items: center;
          gap: 16px;
          animation: ucpoFadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          position: relative;
          z-index: 2;
        }

        .ucpo-header-icon {
          width: 48px; height: 48px;
          border-radius: 14px;
          background: var(--ucpo-brand-soft);
          border: 1px solid var(--ucpo-brand-border);
          display: flex; alignItems: center; justify-content: center;
          color: var(--ucpo-brand);
          box-shadow: 0 8px 24px var(--ucpo-brand-glow);
        }

        .ucpo-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          position: relative;
          z-index: 2;
        }
        @media (min-width: 1024px) {
          .ucpo-grid {
            grid-template-columns: 380px 1fr;
            direction: ${locale === 'ar' ? 'rtl' : 'ltr'};
            align-items: stretch;
          }
        }

        /* --- Hero Plan Card --- */
        .ucpo-hero-wrapper {
          position: relative;
          animation: ucpoFadeInUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards;
          opacity: 0;
        }

        /* Blurred animated background behind hero card */
        .ucpo-hero-bg-glow {
          position: absolute;
          top: -20%; left: -10%; right: -10%; bottom: -20%;
          background: radial-gradient(circle at 50% 50%, var(--ucpo-brand-glow), transparent 60%);
          filter: blur(40px);
          animation: ucpoBgGlowFloat 10s ease-in-out infinite;
          z-index: 0;
          pointer-events: none;
        }

        /* Rotating Border Highlight */
        .ucpo-hero-wrapper::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 22px;
          background: conic-gradient(from 0deg, transparent 60%, var(--ucpo-brand-border) 80%, var(--ucpo-brand) 100%);
          animation: ucpoRotateGlow 4s linear infinite;
          z-index: 0;
          opacity: 0.6;
          transition: opacity 0.4s ease;
        }
        .ucpo-hero-wrapper::after {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: 21px;
          background: var(--ucpo-card-bg);
          z-index: 0;
        }

        .ucpo-hero-card {
          position: relative;
          height: 100%;
          background: var(--ucpo-card-bg);
          border: 1px solid var(--ucpo-border);
          border-radius: 20px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          z-index: 1;
          transition: border-color 180ms ease, background-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
          box-shadow: var(--ucpo-shadow-subtle);
          overflow: hidden;
        }

        /* Moving light reflection inside the card */
        .ucpo-hero-card::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0; width: 60%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent);
          transform: skewX(-20deg);
          animation: ucpoShineSweep 6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          pointer-events: none;
        }

        .ucpo-hero-wrapper:hover .ucpo-hero-card {
          transform: translateY(-2px);
          border-color: var(--ucpo-border-hover);
          box-shadow: var(--ucpo-shadow-hover);
        }

        .ucpo-status-badge {
          background: var(--ucpo-success-soft);
          color: var(--ucpo-success);
          padding: 6px 14px;
          border-radius: 100px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          animation: ucpoPulseBadge 3s infinite;
        }

        .ucpo-upgrade-btn {
          margin-top: auto;
          width: 100%;
          background: var(--ucpo-btn-bg);
          border: 1px solid var(--ucpo-btn-border);
          color: var(--ucpo-btn-text);
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 180ms ease;
          position: relative;
          z-index: 2;
        }
        .ucpo-upgrade-btn svg {
          transition: transform 180ms ease;
        }
        .ucpo-upgrade-btn:hover {
          background: var(--ucpo-btn-hover-bg);
          border-color: var(--ucpo-btn-hover-border);
          box-shadow: var(--ucpo-btn-hover-shadow);
          transform: translateY(-1px);
        }
        .ucpo-upgrade-btn:hover svg {
          transform: translate(2px, -2px);
        }
        .ucpo-upgrade-btn:active {
          transform: scale(0.98);
        }

        /* --- Usage Cards --- */
        .ucpo-usage-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          align-content: start;
        }
        .ucpo-usage-card {
          background: var(--ucpo-card-bg);
          border: 1px solid var(--ucpo-border);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: border-color 180ms ease, background-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
          box-shadow: var(--ucpo-shadow-subtle);
          opacity: 0;
        }
        .ucpo-usage-card.delay-1 { animation: ucpoFadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards; }
        .ucpo-usage-card.delay-2 { animation: ucpoFadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards; }
        .ucpo-usage-card.delay-3 { animation: ucpoFadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.4s forwards; }

        .ucpo-usage-card:hover {
          transform: translateY(-2px);
          border-color: var(--ucpo-border-hover);
          box-shadow: var(--ucpo-shadow-hover);
        }
        .ucpo-usage-card:hover .ucpo-icon-wrapper {
          transform: scale(1.05) rotate(-3deg);
        }
        
        .ucpo-icon-wrapper {
          color: var(--ucpo-brand);
          background: var(--ucpo-brand-soft);
          padding: 10px;
          border-radius: 12px;
          display: flex;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          border: 1px solid var(--ucpo-brand-border);
        }

        .ucpo-progress-track {
          width: 100%;
          height: 8px;
          background: var(--ucpo-track);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }

        .ucpo-progress-fill {
          height: 100%;
          border-radius: 4px;
          position: relative;
          transition: width 1s cubic-bezier(0.22, 1, 0.36, 1);
          background: linear-gradient(90deg, #E86F20, #FF9A50);
        }

        .ucpo-progress-unlimited {
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(245,130,50,0.08), transparent 65%);
        }

        /* --- Features --- */
        .ucpo-feature-pill {
          background: var(--ucpo-inner);
          border: 1px solid var(--ucpo-border);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          color: var(--ucpo-text-secondary);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>

      <div className="ucpo-container">
        {/* Header */}
        <div className="ucpo-header">
          <div className="ucpo-header-icon">
            <Crown size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: 'var(--ucpo-text-primary)', letterSpacing: '-0.02em' }}>
              {locale === 'ar' ? 'باقتك الحالية واستهلاكك' : 'Current Plan & Usage'}
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: '15px', color: 'var(--ucpo-text-secondary)' }}>
              {locale === 'ar' ? 'تابع حدود استخدام باقتك الحالية وقم بإدارتها' : 'Monitor and manage your current plan limits'}
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="ucpo-grid">

          {/* Hero Plan Card (Right on RTL) */}
          <div className="ucpo-hero-wrapper">
            <div className="ucpo-hero-bg-glow" />
            <div className="ucpo-hero-card">

              {/* Top Row: Icon + Title + Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ucpo-brand)', background: 'var(--ucpo-brand-soft)', borderRadius: '16px', border: '1px solid var(--ucpo-brand-border)' }}>
                    {renderPlanIcon(plan?.icon)}
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: 'var(--ucpo-brand)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {locale === 'ar' ? 'الباقة الحالية' : 'Current Plan'}
                    </span>
                    <h4 style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 900, color: 'var(--ucpo-text-primary)', letterSpacing: '-0.02em' }}>
                      {subscription.plan_name}
                    </h4>
                  </div>
                </div>
                <div className="ucpo-status-badge">
                  <CheckCircle2 size={16} />
                  {locale === 'ar' ? 'نشطة ✓' : 'Active ✓'}
                </div>
              </div>

              {/* Expiry & Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 1, marginTop: '12px' }}>
                <div style={{ background: 'var(--ucpo-surface-sec)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--ucpo-border)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--ucpo-text-secondary)', marginBottom: '4px', fontWeight: 500 }}>
                    {locale === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}
                  </div>
                  <div style={{ fontSize: '18px', color: 'var(--ucpo-text-primary)', fontWeight: 700 }}>
                    {new Date(subscription.end_date).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {plan?.support_type && (
                    <span className="ucpo-feature-pill">
                      <Check size={14} style={{ color: 'var(--ucpo-success)' }} />
                      {locale === 'ar' ? 'الدعم الفني' : `${plan.support_type.toUpperCase()} Support`}
                    </span>
                  )}
                  {plan?.interactive_bot && (
                    <span className="ucpo-feature-pill">
                      <Check size={14} style={{ color: 'var(--ucpo-success)' }} />
                      {locale === 'ar' ? 'دعم البوت' : 'Bot Access'}
                    </span>
                  )}
                  {plan?.ai_reply && (
                    <span className="ucpo-feature-pill">
                      <Check size={14} style={{ color: 'var(--ucpo-success)' }} />
                      {locale === 'ar' ? 'ميزات الذكاء الاصطناعي' : 'AI Features'}
                    </span>
                  )}
                </div>
              </div>

              {/* Upgrade Button */}
              <button className="ucpo-upgrade-btn">
                {locale === 'ar' ? 'ترقية الباقة' : 'Upgrade Plan'}
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          {/* Usage Cards (Left on RTL) */}
          <div className="ucpo-usage-list">

            <UsageCard
              delayClass="delay-1"
              icon={<MessageCircle size={20} />}
              title={locale === 'ar' ? 'الرسائل' : 'Messages'}
              used={msgsUsed}
              limit={msgsLimit}
              pct={msgsPct}
              locale={locale}
              mounted={mounted}
            />

            <UsageCard
              delayClass="delay-2"
              icon={<Smartphone size={20} />}
              title={locale === 'ar' ? 'الأجهزة' : 'Devices'}
              used={devsUsed}
              limit={devsLimit}
              pct={devsPct}
              locale={locale}
              mounted={mounted}
            />

            <UsageCard
              delayClass="delay-3"
              icon={<Phone size={20} />}
              title={locale === 'ar' ? 'الأرقام' : 'Numbers'}
              used={numsUsed}
              limit={numsLimit}
              pct={numsPct}
              locale={locale}
              mounted={mounted}
            />

          </div>
        </div>
      </div>
    </>
  );
}

// Helper Sub-component for Animated Number & Card
function UsageCard({ delayClass, icon, title, used, limit, pct, locale, mounted }: any) {
  const isUnlim = limit === Infinity;
  const [displayUsed, setDisplayUsed] = useState(0);

  useEffect(() => {
    if (!mounted) return;
    if (isUnlim) {
      setDisplayUsed(used);
      return;
    }
    let start = 0;
    const duration = 1200; // smoother, longer luxury animation
    const startTime = performance.now();
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // quart ease out
      setDisplayUsed(used * ease);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [mounted, used, isUnlim]);

  return (
    <div className={`ucpo-usage-card ${delayClass}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="ucpo-icon-wrapper">
          {icon}
        </div>
        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ucpo-text-primary)' }}>{title}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px' }}>
        <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--ucpo-text-primary)', letterSpacing: '-0.02em' }}>
          {isUnlim ? (used || 0) : Math.round(displayUsed)}
          {isUnlim ? (
            <span style={{ fontSize: '18px', color: 'var(--ucpo-text-secondary)', fontWeight: 700, margin: '0 6px' }}>
              {locale === 'ar' ? 'مستخدم' : 'used'}
            </span>
          ) : (
            <>
              <span style={{ fontSize: '15px', color: 'var(--ucpo-text-muted)', fontWeight: 600, margin: '0 6px' }}>/</span>
              <span style={{ fontSize: '18px', color: 'var(--ucpo-text-secondary)', fontWeight: 700 }}>{limit}</span>
            </>
          )}
        </div>
        {!isUnlim && (
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ucpo-brand)' }}>
            {Math.round(pct)}%
          </div>
        )}
        {isUnlim && (
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ucpo-text-secondary)', background: 'var(--ucpo-inner)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--ucpo-border)' }}>
            {locale === 'ar' ? 'غير محدود' : 'Unlimited'}
          </div>
        )}
      </div>

      <div className="ucpo-progress-track">
        {isUnlim ? (
          <div className="ucpo-progress-unlimited" />
        ) : (
          <div
            className="ucpo-progress-fill"
            style={{ width: mounted ? `${pct}%` : '0%' }}
          />
        )}
      </div>
    </div>
  );
}

