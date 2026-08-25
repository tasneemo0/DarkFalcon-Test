'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Star, Check, X, CheckCircle } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

interface UserPlanCardProps {
  plan: any;
  index: number;
  locale: string;
  isCurrentPlan: boolean;
  hasPendingInvoice: boolean;
  renderPlanIcon: (iconName: string) => React.ReactNode;
  onSubscribe: (plan: any) => void;
}

export function UserPlanCard({
  plan: p,
  index,
  locale,
  isCurrentPlan,
  hasPendingInvoice,
  renderPlanIcon,
  onSubscribe
}: UserPlanCardProps) {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const targetPrice = parseFloat(p.price || 0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate tilt (max 6 degrees)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((centerY - y) / centerY) * 6;
    const tiltY = ((x - centerX) / centerX) * 6;

    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleBtnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newRipple = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 600);
    onSubscribe(p);
  };

  const isAr = locale === 'ar';
  let btnText = isAr ? 'اختيار الباقة' : 'Choose Plan';
  if (isCurrentPlan) btnText = isAr ? 'باقتك الحالية' : 'Current Plan';
  else if (hasPendingInvoice) btnText = isAr ? 'الطلب قيد المراجعة' : 'Pending Review';
  else if (p.is_popular) btnText = isAr ? 'ابدأ بهذه الباقة' : 'Start with this plan';

  const isDisabled = isCurrentPlan || hasPendingInvoice;
  const isPopular = p.is_popular;

  const baseColor = p.color_gradient || '#6366F1';
  const accentColor = p.icon === 'basic' ? '#38BDF8' : p.icon === 'pro' ? '#F97316' : p.icon === 'advanced' ? '#8B5CF6' : p.icon === 'enterprise' ? '#10B981' : baseColor;

  const features = [
    { label: isAr ? 'البوت التفاعلي' : 'Interactive Bot', active: p.interactive_bot },
    { label: isAr ? 'الردود التلقائية' : 'AI Auto-Replies', active: p.ai_reply },
    { label: isAr ? 'واجهة API البرمجية' : 'API Access', active: p.api_access },
    { label: isAr ? 'الإشعارات الجماعية' : 'Broadcasts', active: p.broadcasts },
    { label: 'Webhooks', active: p.webhooks },
  ];

  return (
    <>
      <style>{`
        
        
        @keyframes upcEntrance {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes upcFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes upcLightSweep {
          0% { left: -100%; opacity: 0; }
          15% { opacity: 1; }
          30% { left: 200%; opacity: 0; }
          100% { left: 200%; opacity: 0; }
        }
        @keyframes bestSellerGlowPulse {
          0%, 100% { box-shadow: 0 0 10px ${accentColor}40; transform: translateY(0) scale(1); }
          50% { box-shadow: 0 0 25px ${accentColor}90; transform: translateY(-4px) scale(1.05); }
        }
        @keyframes currentPlanPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(39,194,129,0.5); }
          50% { box-shadow: 0 0 0 12px rgba(39,194,129,0); }
        }
        @keyframes btnRipple {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }
        
        .user-plan-card {
          animation: upcEntrance 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 0.1}s both;
          will-change: transform, opacity;
          position: relative;
          perspective: 1000px;
        }

        .user-plan-card-inner {
          position: relative;
          border-radius: 24px;
          background: linear-gradient(160deg, rgba(20,20,30,0.8) 0%, rgba(12,12,18,0.95) 100%);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 40px 28px;
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0,0,0,0.4);
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.4s ease;
          transform-style: preserve-3d;
        }

        .user-plan-card:hover .user-plan-card-inner {
          border-color: ${accentColor}90;
          box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 45px ${accentColor}40, inset 0 2px 20px rgba(255,255,255,0.05);
        }

        .upc-floating-wrapper {
          animation: upcFloat 6s ease-in-out infinite;
        }

        .upc-sweep {
          position: absolute;
          top: 0; bottom: 0; width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          transform: skewX(-25deg);
          animation: upcLightSweep 8s infinite linear;
          pointer-events: none;
        }
        
        .upc-btn {
          position: relative;
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: #ffffff;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        :global([data-theme="light"]) .upc-btn,
        :root:not([data-theme="dark"]) .upc-btn {
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(15,23,42,0.15);
          color: #0f172a;
          box-shadow: 0 4px 14px rgba(15,23,42,0.06);
        }

        .upc-btn:hover:not(:disabled) {
          border-color: var(--hover-border);
          background: var(--hover-bg);
          box-shadow: var(--hover-shadow);
          transform: translateY(-2px);
          color: #ffffff;
        }

        .upc-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .upc-btn-arrow {
          transition: transform 0.3s ease;
        }
        .upc-btn:hover:not(:disabled) .upc-btn-arrow {
          transform: translateX(${isAr ? '-4px' : '4px'});
        }

      `}</style>

      <div
        className="user-plan-card upc-floating-wrapper"
        ref={cardRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <div
          className={`user-plan-card-inner ${isCurrentPlan ? 'upc-current-plan' : ''}`}
          style={{
            transform: hovered
              ? `scale(1.03) translateY(-10px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
              : 'scale(1) translateY(0) rotateX(0deg) rotateY(0deg)',
          }}
        >
          {/* Ambient Background Gradient */}
          <div style={{
            position: 'absolute', top: '-30%', left: '-20%', width: '140%', height: '140%',
            background: `radial-gradient(circle at 50% 0%, ${accentColor}25, transparent 65%)`,
            pointerEvents: 'none', zIndex: 0,
            transition: 'transform 0.4s ease',
            transform: hovered ? 'translateY(5%)' : 'translateY(0)'
          }} />

          <div className="upc-sweep" />

          {/* Header Row: Icon + Title vs Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', zIndex: 2 }}>

            {/* Icon + Plan Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: accentColor,
                transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
                transform: hovered ? 'scale(1.1) rotate(6deg)' : 'scale(1) rotate(0deg)'
              }}>
                {/* @ts-ignore */}
                {React.cloneElement(renderPlanIcon(p.icon) as React.ReactElement<any>, { size: 38 })}
              </div>
              <h3 style={{
                fontSize: '30px', fontWeight: 800, margin: 0,
                color: '#ffffff',
                lineHeight: 1.1,
                letterSpacing: '-0.5px',
                whiteSpace: 'nowrap'
              }}>
                {p.name}
              </h3>
            </div>

            {/* Badge */}
            <div>
              {isCurrentPlan ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: 'rgba(39,194,129,0.15)', border: '1px solid rgba(39,194,129,0.4)',
                  padding: '4px 10px', borderRadius: '12px', color: '#27C281', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase'
                }}>
                  <CheckCircle size={14} />
                  {isAr ? 'حالية' : 'Current'}
                </span>
              ) : isPopular ? (
                <span className="upc-best-badge" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: `rgba(255,255,255,0.08)`,
                  border: `1px solid rgba(255,255,255,0.15)`,
                  padding: '4px 10px', borderRadius: '20px', color: '#fff', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {isAr ? 'الأكثر مبيعاً' : 'BEST SELLER'}
                </span>
              ) : (
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '4px 10px', borderRadius: '20px', color: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px'
                }}>
                  {p.icon ? p.icon : 'STANDARD'}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 24px 0', zIndex: 2, lineHeight: 1.5 }}>
            {p.description || (isAr ? 'توفر لك هذه الباقة كل ما تحتاجه للنمو.' : 'This plan provides everything you need to grow.')}
          </p>

          {/* Price Block */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '32px', zIndex: 2 }}>
            <span style={{
              fontSize: '52px', fontWeight: 900, color: '#fff', lineHeight: 0.9, letterSpacing: '-1px',
              textShadow: `0 8px 30px ${accentColor}60`,
              transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transformOrigin: isAr ? 'right bottom' : 'left bottom'
            }}>
              <AnimatedNumber value={targetPrice} />
            </span>
            <div style={{ paddingBottom: '6px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: accentColor }}>{isAr ? 'ر.س' : 'SAR'}</span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                {p.duration_days === 30 ? (isAr ? '/ شهرياً' : '/ mo') : (isAr ? `/ كل ${p.duration_days} يوم` : `/ ${p.duration_days} days`)}
              </span>
            </div>
          </div>

          {/* Modern Mini Cards Limits */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '36px', zIndex: 2 }}>
            {[
              { limit: p.message_limit, unlim: p.is_messages_unlimited, label: isAr ? 'رسالة' : 'Messages' },
              { limit: p.device_limit, unlim: p.is_devices_unlimited, label: isAr ? 'جهاز' : 'Devices' },
              { limit: p.number_limit, unlim: p.is_numbers_unlimited, label: isAr ? 'أرقام' : 'Numbers' },
            ].map((item, i) => (
              <div
                key={i}
                className="upc-limit-box"
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', padding: '16px 8px', textAlign: 'center',
                }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                  <AnimatedNumber value={item.unlim ? '∞' : item.limit} />
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontWeight: 600 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginBottom: '40px', zIndex: 2 }}>
            {features.map((feat, i) => (
              <div
                key={i}
                className="upc-feature-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '10px 8px', opacity: feat.active ? 1 : 0.4
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: feat.active ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` : 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: feat.active ? `0 4px 12px ${accentColor}60` : 'none',
                }}>
                  {feat.active ? <Check size={16} color="#fff" strokeWidth={3} /> : <X size={16} color="#fff" />}
                </div>
                <span style={{ fontSize: '15px', color: feat.active ? '#fff' : '#94A3B8', fontWeight: feat.active ? 600 : 500 }}>
                  {feat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <button
            disabled={isDisabled}
            onClick={handleBtnClick}
            className="upc-btn"
            style={{
              zIndex: 2, position: 'relative',
              '--hover-bg': `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
              '--hover-border': accentColor,
              '--hover-shadow': `0 10px 25px ${accentColor}50, inset 0 1px 1px rgba(255,255,255,0.2)`
            } as React.CSSProperties}
          >
            <div className="upc-btn-shine" />

            {ripples.map(r => (
              <div key={r.id} style={{
                position: 'absolute', left: r.x - 20, top: r.y - 20, width: 40, height: 40,
                borderRadius: '50%', background: 'rgba(255,255,255,0.4)',
                pointerEvents: 'none', animation: 'btnRipple 0.6s cubic-bezier(0.22,1,0.36,1) forwards'
              }} />
            ))}

            {isCurrentPlan && <CheckCircle size={20} />}
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {btnText}
              {!isDisabled && <span className="upc-btn-arrow">{isAr ? '←' : '→'}</span>}
            </span>
          </button>
        </div>
      </div >
    </>
  );
}
