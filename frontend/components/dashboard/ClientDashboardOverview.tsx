'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { API_BASE_URL } from '@/lib/api';
import styles from '../../app/dashboard/dashboard.module.css';
import {
  Package, MessageCircle, Smartphone, Phone,
  Bot, Brain, Link as LinkIcon, Code, Bell,
  Activity, AlertTriangle, CheckCircle2, XCircle, Clock, Receipt, Crown, Zap,
  TrendingUp, Battery, Wifi, WifiOff, Settings2, KeyRound, Search, ChevronDown, ChevronUp, Download, FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Lazy-load ApexCharts
const DailyMessagesApexChart = dynamic(() => import('./ApexCharts').then(m => m.DailyMessagesApexChart), { ssr: false });
const UsageOverTimeApexChart = dynamic(() => import('./ApexCharts').then(m => m.UsageOverTimeApexChart), { ssr: false });
const DevicesStatusApexChart = dynamic(() => import('./ApexCharts').then(m => m.DevicesStatusApexChart), { ssr: false });
const InvoicesOverviewApexChart = dynamic(() => import('./ApexCharts').then(m => m.InvoicesOverviewApexChart), { ssr: false });

import { motion, Variants } from 'framer-motion';
import { PremiumStatCard, PremiumCardWrapper } from '@/components/dashboard/PremiumCard';
import { PremiumButton } from '@/components/dashboard/PremiumButton';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function ClientDashboardOverview({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { token, logout, user } = useApp();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/client-summary/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('df-token')}`,
        },
      });
      if (res.status === 401) { logout(); router.push('/auth/login'); return; }
      if (!res.ok) throw new Error('فشل تحميل بيانات لوحة التحكم');
      setData(await res.json());
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, [token]);

  if (loading) return <SkeletonLoading />;
  if (error) return <ErrorState message={error} onRetry={fetchSummary} />;

  return (
    <div className={styles.ultraSaaSContainer} dir="rtl">

      {/* 0) Premium Page Header ────────────────────────────────────────── */}
      <motion.div className={styles.saasPageHeader} initial="hidden" animate="show" variants={fadeUpVariant}>
        <div className={styles.saasPageHeaderInfo}>
          <h1 className={styles.saasPageHeaderTitle}>مرحباً بك، {user?.first_name || 'عميلنا العزيز'} 👋</h1>
          <p className={styles.saasPageHeaderSub}>
            <Clock size={16} /> آخر تحديث للبيانات: {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className={styles.saasPageHeaderActions}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: '#94a3b8' }} />
            <input type="text" placeholder="البحث السريع..." className={styles.saasSearchInput} />
          </div>
          <PremiumButton variant="primary" icon={<Zap size={18} />} iconPosition="left" onClick={() => onNavigate?.('billing')}>
            ترقية الباقة
          </PremiumButton>
        </div>
      </motion.div>

      {/* ── Alerts ─────────────────────────────────────────────────────── */}
      {data.alerts?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          {data.alerts.map((alert: any, idx: number) => (
            <div
              key={idx}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '16px 24px', borderRadius: '16px',
                background: alert.type === 'error' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                border: `1px solid ${alert.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'}`,
                color: alert.type === 'error' ? '#f87171' : '#fbbf24'
              }}
            >
              <AlertTriangle size={20} />
              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* 1) Hero Section ─────────────────────────────────────────────────── */}
      <HeroSection sub={data.subscription} plan={data.plan} has_subscription={data.has_subscription} onNavigate={onNavigate} />

      {/* 2) Statistics Cards (KPIs) ─────────────────────────────────────── */}
      {data.has_subscription && (
        <motion.div className={styles.saasGrid12} variants={staggerContainer} initial="hidden" animate="show">
          <div className={styles.colSpan4}>
            <PremiumStatCard title="الرسائل المستهلكة" icon={<MessageCircle size={24} />} value={data.messages?.used ?? 0} subtitle={data.messages?.unlimited ? 'غير محدود' : `الحد: ${data.messages?.limit ?? 0}`} color="primary" />
          </div>
          <div className={styles.colSpan4}>
            <PremiumStatCard title="الأجهزة المرتبطة" icon={<Smartphone size={24} />} value={data.devices?.used ?? 0} subtitle={data.devices?.unlimited ? 'غير محدود' : `الحد: ${data.devices?.limit ?? 0}`} color="info" />
          </div>
          <div className={styles.colSpan4}>
            <PremiumStatCard title="جهات الاتصال" icon={<Phone size={24} />} value={data.numbers?.used ?? 0} subtitle={data.numbers?.unlimited ? 'غير محدود' : `الحد: ${data.numbers?.limit ?? 0}`} color="success" />
          </div>
        </motion.div>
      )}

      {/* 3) Quick Actions ───────────────────────────────────────────────── */}
      <motion.div variants={fadeUpVariant} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className={styles.saasSectionTitle}>
          <Zap size={24} color="var(--color-primary)" /> إجراءات سريعة
        </div>
        <div className={styles.saasGrid12}>
          <div className={styles.colSpan2}>
            <PremiumCardWrapper delay={0.1} className={styles.saasBtnIcon} style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }} onClick={() => onNavigate?.('numbers')} whileTap={{ scale: 0.95 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px' }}>
                <Smartphone size={28} /><span>ربط جهاز</span>
              </div>
            </PremiumCardWrapper>
          </div>
          <div className={styles.colSpan2}>
            <PremiumCardWrapper delay={0.15} className={styles.saasBtnIcon} style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }} onClick={() => onNavigate?.('billing')} whileTap={{ scale: 0.95 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px' }}>
                <Package size={28} /><span>تجديد الباقة</span>
              </div>
            </PremiumCardWrapper>
          </div>
          <div className={styles.colSpan2}>
            <PremiumCardWrapper delay={0.2} className={styles.saasBtnIcon} style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }} onClick={() => onNavigate?.('broadcasts')} whileTap={{ scale: 0.95 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px' }}>
                <Bell size={28} /><span>إشعار جماعي</span>
              </div>
            </PremiumCardWrapper>
          </div>
          <div className={styles.colSpan2}>
            <PremiumCardWrapper delay={0.25} className={styles.saasBtnIcon} style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }} onClick={() => onNavigate?.('apiKeys')} whileTap={{ scale: 0.95 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px' }}>
                <KeyRound size={28} /><span>إنشاء API</span>
              </div>
            </PremiumCardWrapper>
          </div>
          <div className={styles.colSpan2}>
            <PremiumCardWrapper delay={0.3} className={styles.saasBtnIcon} style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }} onClick={() => onNavigate?.('interactive_bot')} whileTap={{ scale: 0.95 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px' }}>
                <Bot size={28} /><span>تعديل البوت</span>
              </div>
            </PremiumCardWrapper>
          </div>
          <div className={styles.colSpan2}>
            <PremiumCardWrapper delay={0.35} className={styles.saasBtnIcon} style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }} onClick={() => window.print()} whileTap={{ scale: 0.95 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px' }}>
                <FileText size={28} /><span>تصدير تقرير</span>
              </div>
            </PremiumCardWrapper>
          </div>
        </div>
      </motion.div>

      {/* 4) Charts (12-Col Layout) ──────────────────────────────────────── */}
      <motion.div variants={fadeUpVariant} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className={styles.saasSectionTitle} style={{ marginTop: '48px' }}>
          <Activity size={24} color="var(--color-primary)" /> تحليل الأداء
        </div>
        <div className={styles.saasGrid12}>
          <div className={styles.colSpan8}>
            <UsageOverTimeApexChart data={data.usage_over_time || []} />
          </div>
          <div className={styles.colSpan4}>
            <DevicesStatusApexChart data={data.devices_status || []} />
          </div>
          <div className={styles.colSpan6}>
            <DailyMessagesApexChart data={data.messages_daily || []} />
          </div>
          <div className={styles.colSpan6}>
            <InvoicesOverviewApexChart data={data.invoices_overview || []} />
          </div>
        </div>
      </motion.div>

      {/* 5) Data Tables & Timeline ──────────────────────────────────────── */}
      <motion.div className={styles.saasGrid12} style={{ marginTop: '48px' }} variants={fadeUpVariant} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className={styles.colSpan8}>
          <div className={styles.saasSectionTitle} style={{ marginBottom: '24px' }}>
            <Receipt size={24} color="var(--color-primary)" /> الفواتير الأخيرة
          </div>
          <InvoicesTable invoices={data.invoices_summary || data.recent_invoices || []} />
        </div>
        <div className={styles.colSpan4}>
          <div className={styles.saasSectionTitle} style={{ marginBottom: '24px' }}>
            <Activity size={24} color="var(--color-primary)" /> النشاطات الأخيرة
          </div>
          <RecentActivity logs={data.recent_activity || []} />
        </div>
      </motion.div>

    </div>
  );
}

// ─── Component: Hero Section ───────────────────────────────────────────────
function HeroSection({ sub: subscription, plan, has_subscription, onNavigate }: any) {
  const [showRenewModal, setShowRenewModal] = useState(false);

  if (!has_subscription) {
    return (
      <PremiumCardWrapper className={styles.saasHero} style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div className={styles.saasHeroContent} style={{ alignItems: 'center' }}>
          <Package size={56} color="#64748b" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>لا يوجد اشتراك نشط</h2>
          <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '1.1rem' }}>الرجاء الاشتراك في أحد الباقات للبدء في استخدام كافة ميزات المنصة</p>
          <PremiumButton variant="primary" onClick={() => onNavigate?.('billing')} style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
            تصفح الباقات الآن
          </PremiumButton>
        </div>
      </PremiumCardWrapper>
    );
  }

  const daysRem = subscription?.days_remaining ?? 0;
  const totalDays = plan?.duration_days ?? 30;
  const usedPerc = Math.min(100, Math.max(0, 100 - (daysRem / totalDays) * 100));
  const expiresAt = subscription?.expires_at
    ? new Date(subscription.expires_at).toLocaleDateString('ar-SA')
    : 'غير متاح';

  return (
    <>
      <PremiumCardWrapper className={styles.saasHero}>
        <div className={styles.saasHeroContent}>
          <div className={styles.saasHeroTitle}>
            <Crown size={20} color="var(--color-primary)" />
            الاشتراك الحالي
            <span className={`${styles.saasBadge} ${subscription?.active ? styles.saasBadgeActive : styles.saasBadgeDanger}`} style={{ marginLeft: 'auto' }}>
              {subscription?.active ? 'نشط' : 'غير نشط'}
            </span>
          </div>
          <div className={styles.saasHeroPlan}>{plan?.name || 'غير معروف'}</div>
          <div style={{ fontSize: '0.95rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} /> ينتهي في: {expiresAt}
          </div>

          <div className={styles.saasProgressWrap}>
            <div className={styles.saasProgressLabel}>
              <span>الاستهلاك ({Math.round(usedPerc)}%)</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>متبقي {daysRem} أيام</span>
            </div>
            <div className={styles.saasProgressBar}>
              <div className={styles.saasProgressFill} style={{ width: `${usedPerc}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.saasHeroActions}>
          <PremiumButton variant="primary" onClick={() => setShowRenewModal(true)} style={{ width: '100%', minWidth: '200px', display: 'flex', justifyContent: 'center' }}>
            تجديد الاشتراك <Zap size={18} />
          </PremiumButton>
        </div>
      </PremiumCardWrapper>

      {showRenewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11, 15, 25, 0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '16px', letterSpacing: '-0.5px' }}>تأكيد التجديد</h3>
            <p style={{ color: '#94a3b8', marginBottom: '40px', fontSize: '1.05rem' }}>هل أنت متأكد من رغبتك في تجديد الباقة الحالية بنفس الخصائص؟</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <PremiumButton variant="primary" style={{ flex: 1 }} onClick={() => { setShowRenewModal(false); onNavigate?.('billing'); }}>متابعة للدفع</PremiumButton>
              <PremiumButton variant="secondary" style={{ flex: 1 }} onClick={() => setShowRenewModal(false)}>إلغاء</PremiumButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Component: KPI Cards ──────────────────────────────────────────────────
function UsageCard({ title, icon, used, limit, unlimited, color = 'primary' }: any) {
  const getGlow = () => {
    if (color === 'success') return 'rgba(34, 197, 94, 0.1)';
    if (color === 'info') return 'rgba(56, 189, 248, 0.1)';
    return 'rgba(99, 102, 241, 0.1)';
  };
  const getAccent = () => {
    if (color === 'success') return '#22C55E';
    if (color === 'info') return '#38BDF8';
    return '#6366F1';
  };

  return (
    <div className={styles.saasCard} style={{ boxShadow: `0 10px 40px ${getGlow()}` }}>
      <div className={styles.saasCardHeader}>
        <div className={styles.saasCardTitle}>{title}</div>
        <div className={styles.saasCardIconWrap} style={{ background: getGlow(), color: getAccent(), borderColor: getGlow() }}>
          {icon}
        </div>
      </div>
      <div className={styles.saasCardValue}>
        {used ?? 0}
        {unlimited ? (
          <span className={styles.saasCardLimit}>/ غير محدود</span>
        ) : (
          <span className={styles.saasCardLimit}>/ {limit ?? 0}</span>
        )}
      </div>
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className={styles.saasTrend} style={{ background: getGlow(), color: getAccent() }}>
          <TrendingUp size={14} /> مستقر
        </span>
      </div>
    </div>
  );
}

// ─── Component: Interactive Table ──────────────────────────────────────────
function InvoicesTable({ invoices }: { invoices: any[] }) {
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const filtered = useMemo(() => {
    return invoices.filter(inv =>
      (inv.plan_name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(inv.amount).includes(search)
    ).sort((a, b) => {
      let v1 = a[sortField];
      let v2 = b[sortField];
      if (sortField === 'created_at') {
        v1 = new Date(v1).getTime();
        v2 = new Date(v2).getTime();
      }
      if (v1 < v2) return sortAsc ? -1 : 1;
      if (v1 > v2) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [invoices, search, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const displayed = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ChevronDown size={14} className={styles.saasTableSortIcon} />;
    return sortAsc ? <ChevronUp size={14} className={styles.saasTableSortIcon} style={{ opacity: 1 }} /> : <ChevronDown size={14} className={styles.saasTableSortIcon} style={{ opacity: 1 }} />;
  };

  if (!invoices || invoices.length === 0) {
    return (
      <PremiumCardWrapper className={styles.saasCard} style={{ padding: 0 }}>
        <div className={styles.saasEmpty} style={{ padding: '64px 20px', border: 'none' }}>
          <Receipt size={48} color="var(--border-light)" style={{ marginBottom: '16px' }} />
          <div className={styles.saasEmptyTitle}>لا توجد فواتير</div>
          <div className={styles.saasEmptyDesc}>لم تقم بإجراء أي عمليات دفع حتى الآن</div>
        </div>
      </PremiumCardWrapper>
    );
  }

  return (
    <PremiumCardWrapper className={styles.saasCard} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)" }}>
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: "350px" }}>
          <Search size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input type="text" placeholder="البحث في الفواتير..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={styles.saasSearchInput} style={{ padding: '12px 16px 12px 44px', width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '14px', fontSize: '14px', color: 'var(--text-primary)', transition: 'all 0.3s ease', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.05)' }} />
        </div>
        <PremiumButton variant="secondary" size="sm" icon={<Download size={16} />} iconPosition="left" className={styles.saasExportBtn}>
          تصدير سجل الفواتير
        </PremiumButton>
      </div>

      <div className={styles.saasTableWrapper}>
        <table className={styles.saasTable}>
          <thead>
            <tr>
              <th onClick={() => toggleSort('id')} style={{ cursor: 'pointer', width: '80px' }}>رقم {getSortIcon('id')}</th>
              <th onClick={() => toggleSort('plan_name')} style={{ cursor: 'pointer' }}>الباقة {getSortIcon('plan_name')}</th>
              <th onClick={() => toggleSort('amount')} style={{ cursor: 'pointer' }}>المبلغ {getSortIcon('amount')}</th>
              <th onClick={() => toggleSort('status')} style={{ cursor: 'pointer' }}>الحالة {getSortIcon('status')}</th>
              <th onClick={() => toggleSort('created_at')} style={{ cursor: 'pointer' }}>التاريخ {getSortIcon('created_at')}</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length > 0 ? displayed.map(inv => (
              <tr key={inv.id}>
                <td style={{ color: '#64748b' }}>#{inv.id}</td>
                <td style={{ fontWeight: 600 }}>{inv.plan_name || 'غير محدد'}</td>
                <td data-label="المبلغ">SAR {Number(inv.amount || 0).toFixed(2)}</td>
                <td>
                  <span className={`${styles.saasBadge} ${inv.status === 'paid' ? styles.saasBadgeSuccess : inv.status === 'pending' ? styles.saasBadgeWarning : styles.saasBadgeDanger}`}>
                    {inv.status === 'paid' ? 'مدفوع' : inv.status === 'pending' ? 'معلق' : 'مرفوض'}
                  </span>
                </td>
                <td style={{ color: '#94a3b8' }}>
                  {inv.created_at && !isNaN(new Date(inv.created_at).getTime()) ? new Date(inv.created_at).toLocaleDateString('ar-SA') : 'غير متاح'}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>لا توجد نتائج مطابقة للبحث</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <span className={styles.saasPaginationInfo} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          صفحة {page} من {totalPages} (إجمالي {filtered.length})
        </span>
        <div className={styles.saasPaginationButtons} style={{ display: "flex", gap: "10px" }}>
          <PremiumButton
            variant="secondary"
            size="sm"
            onClick={() => page > 1 && setPage(p => p - 1)}
            style={{ opacity: page === 1 ? 0.5 : 1 }}
          >
            السابق
          </PremiumButton>
          <PremiumButton
            variant="secondary"
            size="sm"
            onClick={() => page < totalPages && setPage(p => p + 1)}
            style={{ opacity: page === totalPages ? 0.5 : 1 }}
          >
            التالي
          </PremiumButton>
        </div>
      </div>
    </PremiumCardWrapper>
  );
}

// ─── Component: Activity Timeline ──────────────────────────────────────────
function RecentActivity({ logs }: { logs: any[] }) {
  if (!logs || logs.length === 0) {
    return (
      <PremiumCardWrapper className={styles.saasCard}>
        <div className={styles.saasEmpty} style={{ padding: '40px 20px', border: 'none' }}>
          <Clock size={48} color="var(--border-light)" style={{ marginBottom: '16px' }} />
          <div className={styles.saasEmptyTitle}>لا توجد نشاطات</div>
        </div>
      </PremiumCardWrapper>
    );
  }

  return (
    <PremiumCardWrapper className={styles.saasCard} style={{ padding: '24px' }}>
      <div style={{ position: "relative" }}>
        {/* Vertical Line */}
        <div style={{ position: 'absolute', right: '19px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border-light)', zIndex: 0 }} />

        {logs.map((log: any, i: number) => {
          const isError = log.action && log.action.includes('500');
          const isWarning = log.action && (log.action.includes('400') || log.action.includes('404'));
          const dotColor = isError ? '#EF4444' : isWarning ? '#F59E0B' : '#38BDF8';
          const bgGlow = isError ? 'rgba(239, 68, 68, 0.1)' : isWarning ? 'rgba(245, 158, 11, 0.1)' : 'rgba(56, 189, 248, 0.1)';

          return (
            <div key={log.id} className={styles.saasTimelineItem} style={{ borderBottom: 'none', position: 'relative', zIndex: 1 }}>
              <div className={styles.saasTimelineIcon} style={{ background: bgGlow, borderColor: dotColor, color: dotColor, boxShadow: `0 0 10px ${bgGlow}` }}>
                {isError ? <XCircle size={16} /> : isWarning ? <AlertTriangle size={16} /> : <Activity size={16} />}
              </div>
              <div className={styles.saasTimelineContent}>
                <div className={styles.saasTimelineTitle} style={{ fontSize: '0.95rem' }}>{log.action || 'نشاط غير معروف'}</div>
                <div className={styles.saasTimelineDate} style={{ fontSize: '0.8rem' }}>
                  {log.created_at && !isNaN(new Date(log.created_at).getTime())
                    ? new Date(log.created_at).toLocaleString('ar-SA')
                    : 'تاريخ غير متاح'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PremiumCardWrapper>
  );
}

// ─── Skeleton Loading ────────────────────────────────────────────────────────
function SkeletonLoading() {
  return (
    <div className={styles.ultraSaaSContainer} dir="rtl">
      <div className={styles.saasSkeleton} style={{ height: '80px', marginBottom: '32px', borderRadius: '24px' }} />
      <div className={styles.saasSkeleton} style={{ height: '240px', marginBottom: '32px' }} />
      <div className={styles.saasGrid12}>
        {[1, 2, 3].map(i => <div key={i} className={`${styles.colSpan4} ${styles.saasSkeleton}`} style={{ height: '140px' }} />)}
      </div>
      <div className={styles.saasGrid12} style={{ marginTop: '32px' }}>
        {[1, 2].map(i => <div key={i} className={`${styles.colSpan6} ${styles.saasSkeleton}`} style={{ height: '320px' }} />)}
      </div>
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: any) {
  return (
    <div className={styles.ultraSaaSContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className={styles.saasEmpty} style={{ maxWidth: '500px', width: '100%' }}>
        <AlertTriangle size={72} color="#ef4444" style={{ marginBottom: '24px', opacity: 0.8 }} />
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '16px', letterSpacing: '-0.5px' }}>حدث خطأ أثناء تحميل البيانات</h2>
        <p className={styles.saasEmptyDesc} style={{ marginBottom: '32px', maxWidth: '100%' }}>{message}</p>
        <button onClick={onRetry} className={`${styles.saasBtn} ${styles.saasBtnPrimary}`}>
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
