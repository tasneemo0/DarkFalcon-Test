'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { API_BASE_URL } from '@/lib/api';
import styles from './dashboard.module.css';
import {
  Users, UserCheck, Package, Receipt, CreditCard,
  DollarSign, MessageCircle, Smartphone, Server,
  Activity, Shield, Link as LinkIcon, CheckCircle2,
  XCircle, Clock, AlertTriangle, Eye, Code,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import bottomStyles from './AdminBottomSection.module.css';
import SpotlightCard from './SpotlightCard';
import { PremiumStatCard } from '@/components/dashboard/PremiumCard';
import { PremiumButton } from '@/components/dashboard/PremiumButton';

// Dynamic imports to avoid SSR issues with Recharts
const DailyOrdersChart = dynamic(() => import('./ApexCharts').then(m => m.DailyOrdersApexChart), { ssr: false });
const DailyActiveUsersChart = dynamic(() => import('./ApexCharts').then(m => m.DailyActiveUsersApexChart), { ssr: false });
const DailyRevenueChart = dynamic(() => import('./ApexCharts').then(m => m.DailyRevenueApexChart), { ssr: false });
const AdminInvoicesStatusChart = dynamic(() => import('./ApexCharts').then(m => m.AdminInvoicesStatusApexChart), { ssr: false });
const CustomersGrowthChart = dynamic(() => import('./ApexCharts').then(m => m.CustomersGrowthApexChart), { ssr: false });
const PlatformDailyMessagesChart = dynamic(() => import('./ApexCharts').then(m => m.PlatformDailyMessagesApexChart), { ssr: false });

export default function AdminDashboardOverview({ onNavigateToCustomers }: { onNavigateToCustomers?: () => void }) {
  const { token, logout } = useApp();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/admin-summary/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('df-token')}`,
        },
      });
      if (res.status === 401 || res.status === 403) { logout(); router.push('/auth/login'); return; }
      if (!res.ok) throw new Error('فشل تحميل بيانات لوحة الأدمن');
      setData(await res.json());
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, [token]);

  const handleInvoiceAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      setActionLoading(id);
      const res = await fetch(`${API_BASE_URL}/api/v1/billing/invoices/${id}/${action}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('df-token')}`,
        },
      });
      if (res.ok) {
        fetchSummary(); // Refetch on success
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error || errJson.detail || 'حدث خطأ أثناء العملية');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <SkeletonLoading />;
  if (error) return <ErrorState message={error} onRetry={fetchSummary} />;

  return (
    <div className={styles.dashboardContainer} dir="rtl">

      {/* -- Page Header -- */}
      <div className={styles.saasPageHeader} style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className={styles.saasPageHeaderInfo} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 className={styles.saasPageHeaderTitle} style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>لوحة الإدارة المركزية 👑</h1>
          <p className={styles.saasPageHeaderSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            <Clock size={16} /> آخر تحديث: {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className={styles.saasPageHeaderActions}>
          <PremiumButton onClick={onNavigateToCustomers} icon={<Users size={18} />}>
            إدارة العملاء
          </PremiumButton>
        </div>
      </div>

      {/* -- Row 1: 8 Stat Cards -- */}
      <div className={`${styles.grid} ${styles.grid4}`}>
        <PremiumStatCard title="إجمالي الإيرادات" value={`${data.revenue} ر.س`} icon={<DollarSign size={24} />} color="warning" />
        <PremiumStatCard title="الاشتراكات النشطة" value={data.active_subscriptions} icon={<Package size={24} />} color="info" />
        <PremiumStatCard title="العملاء النشطين" value={data.active_customers} icon={<UserCheck size={24} />} color="success" />
        <PremiumStatCard title="إجمالي العملاء" value={data.customers_count} icon={<Users size={24} />} color="danger" />

        <PremiumStatCard title="فواتير مدفوعة" value={data.paid_invoices} icon={<CreditCard size={24} />} color="success" />
        <PremiumStatCard title="فواتير معلقة" value={data.pending_invoices} icon={<Receipt size={24} />} color="danger" />
        <PremiumStatCard title="رسائل المنصة" value={data.messages_count} icon={<MessageCircle size={24} />} color="primary" />
        <PremiumStatCard title="أجهزة متصلة" value={data.connected_devices} icon={<Smartphone size={24} />} color="info" />
      </div>

      {/* -- Row 2: Daily Orders + Daily Active Users -- */}
      <div className={`${styles.grid} ${styles.grid2}`}>
        <DailyOrdersChart data={data.daily_orders || []} />
        <DailyActiveUsersChart data={data.daily_active_users || []} />
      </div>

      {/* -- Row 3: Revenue + Messages -- */}
      <div className={`${styles.grid} ${styles.grid2}`}>
        <DailyRevenueChart data={data.daily_revenue || []} />
        <PlatformDailyMessagesChart data={data.messages_daily || []} />
      </div>

      {/* -- Row 4: Invoices Pie + Customers Growth -- */}
      <div className={`${styles.grid} ${styles.grid2}`}>
        <AdminInvoicesStatusChart data={data.invoices_by_status || []} />
        <CustomersGrowthChart data={data.customers_growth || []} />
      </div>

      {/* -- Row 5: Improved Bottom Layout -- */}
      <div className={bottomStyles.bottomGrid}>

        {/* Left Column: Invoices + Recent Customers */}
        <div className={bottomStyles.bottomGridLeft}>

          {/* -- أحدث الفواتير -- */}
          <SpotlightCard>
            <div className={bottomStyles.card}>
              <div className={bottomStyles.cardHeader}>
                <div className={bottomStyles.cardTitle}>
                  <Receipt className={bottomStyles.cardIcon} size={18} />
                  أحدث الفواتير
                </div>
              </div>
              <div className={bottomStyles.scrollableBody}>
                {data.recent_invoices?.length > 0 ? (
                  <table className={bottomStyles.table}>
                    <thead>
                      <tr>
                        <th>العميل</th>
                        <th>الخطة</th>
                        <th>المبلغ</th>
                        <th>الحالة</th>
                        <th>التاريخ</th>
                        <th style={{ textAlign: 'left' }}>إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_invoices.map((inv: any) => (
                        <tr key={inv.id}>
                          <td data-label="العميل" title={inv.user_email}>
                            <span className={bottomStyles.emailCell} dir="ltr">
                              {inv.user_email}
                            </span>
                          </td>
                          <td data-label="الخطة" className={bottomStyles.dateCell}>
                            {inv.plan_name || '—'}
                          </td>
                          <td data-label="المبلغ" dir="ltr" style={{ textAlign: 'right' }}>
                            ${inv.amount}
                          </td>
                          <td data-label="الحالة">
                            <span className={`${bottomStyles.statusBadge} ${inv.status === 'paid' ? bottomStyles.statusPaid :
                                inv.status === 'under_review' ? bottomStyles.statusPending :
                                  inv.status === 'rejected' ? bottomStyles.statusRejected :
                                    bottomStyles.statusUnpaid
                              }`}>
                              {inv.status === 'paid' ? 'مدفوعة' :
                                inv.status === 'under_review' ? 'معلقة' :
                                  inv.status === 'rejected' ? 'مرفوضة' : 'غير مدفوعة'}
                            </span>
                          </td>
                          <td data-label="التاريخ" className={bottomStyles.dateCell}>
                            {inv.created_at
                              ? new Date(inv.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
                              : '—'}
                          </td>
                          <td data-label="إجراء" style={{ textAlign: 'left' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              {inv.status === 'under_review' ? (
                                <>
                                  <button
                                    onClick={() => handleInvoiceAction(inv.id, 'approve')}
                                    disabled={actionLoading === inv.id}
                                    className={bottomStyles.viewBtn}
                                    style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.15)' }}
                                    title="قبول"
                                  >
                                    <CheckCircle2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleInvoiceAction(inv.id, 'reject')}
                                    disabled={actionLoading === inv.id}
                                    className={bottomStyles.viewBtn}
                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', borderColor: 'rgba(239,68,68,0.15)' }}
                                    title="رفض"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </>
                              ) : (
                                <button className={bottomStyles.viewBtn} title="عرض">
                                  <Eye size={14} /> عرض
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className={bottomStyles.emptyState}>
                    <Receipt size={32} style={{ opacity: 0.4 }} />
                    لا توجد فواتير حديثة
                  </div>
                )}
              </div>
              <div className={bottomStyles.sectionFooter}>
                <button
                  className={bottomStyles.viewAllBtn}
                  onClick={() => {
                    // Navigate to payments page in sidebar
                    const e = new CustomEvent('df-navigate', { detail: 'admin_payments' });
                    window.dispatchEvent(e);
                  }}
                >
                  عرض جميع الفواتير ←
                </button>
              </div>
            </div>
          </SpotlightCard>

          {/* -- أحدث العملاء -- */}
          {data.recent_customers?.length > 0 && (
            <SpotlightCard>
              <div className={bottomStyles.card}>
                <div className={bottomStyles.cardHeader}>
                  <div className={bottomStyles.cardTitle}>
                    <Users className={bottomStyles.cardIcon} size={18} />
                    أحدث العملاء
                  </div>
                </div>
                <div className={bottomStyles.customerList}>
                  {data.recent_customers.slice(0, 5).map((cu: any) => {
                    const initial = (cu.full_name || cu.email || '?')[0].toUpperCase();
                    const statusClass =
                      cu.account_status === 'active' ? bottomStyles.accountActive :
                        cu.account_status === 'suspended' ? bottomStyles.accountSuspended :
                          cu.account_status === 'banned' ? bottomStyles.accountBanned :
                            bottomStyles.accountPending;
                    const statusLabel =
                      cu.account_status === 'active' ? 'نشط' :
                        cu.account_status === 'suspended' ? 'موقوف' :
                          cu.account_status === 'banned' ? 'محظور' : 'معلق';
                    const joinDate = cu.date_joined
                      ? new Date(cu.date_joined).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
                      : '—';
                    return (
                      <div
                        key={cu.id}
                        className={bottomStyles.customerItem}
                        onClick={() => {
                          const e = new CustomEvent('df-navigate', { detail: 'admin_clients' });
                          window.dispatchEvent(e);
                        }}
                      >
                        <div className={bottomStyles.customerAvatar}>{initial}</div>
                        <div className={bottomStyles.customerInfo}>
                          <span className={bottomStyles.customerName}>
                            {cu.full_name || cu.email}
                          </span>
                          {cu.full_name && (
                            <span className={bottomStyles.customerEmail} dir="ltr" title={cu.email}>
                              {cu.email}
                            </span>
                          )}
                        </div>
                        <div className={bottomStyles.customerMeta}>
                          <span className={bottomStyles.customerDate}>{joinDate}</span>
                          <span className={`${bottomStyles.accountStatusBadge} ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className={bottomStyles.sectionFooter}>
                  <button
                    className={bottomStyles.viewAllBtn}
                    onClick={() => {
                      const e = new CustomEvent('df-navigate', { detail: 'admin_clients' });
                      window.dispatchEvent(e);
                    }}
                  >
                    عرض جميع العملاء ←
                  </button>
                </div>
              </div>
            </SpotlightCard>
          )}

        </div>

        {/* Right Column: System Status + Today Summary + Audit Logs */}
        <div className={bottomStyles.bottomGridRight}>

          {/* -- حالة النظام -- */}
          <SpotlightCard>
            <div className={bottomStyles.card}>
              <div className={bottomStyles.cardHeader}>
                <div className={bottomStyles.cardTitle}>
                  <Server className={bottomStyles.cardIcon} size={18} />
                  حالة النظام
                </div>
              </div>
              <div className={bottomStyles.statusContainer}>
                {[
                  { key: 'api', icon: <Code size={16} />, name: 'API Core', val: data.system_status?.api },
                  { key: 'gateway', icon: <Smartphone size={16} />, name: 'WhatsApp Gateway', val: data.system_status?.gateway },
                  { key: 'webhook', icon: <LinkIcon size={16} />, name: 'Webhooks', val: data.system_status?.webhook },
                ].map(({ key, icon, name, val }) => {
                  const isOnline = val === 'online';
                  const isOffline = val === 'offline';
                  const dotClass = isOnline ? bottomStyles.online : isOffline ? bottomStyles.offline : bottomStyles.unknown;
                  const label = isOnline ? 'متصل' : isOffline ? 'مفصول' : 'غير معروف';
                  return (
                    <div key={key} className={bottomStyles.statusItem}>
                      <div className={bottomStyles.statusItemLeft}>
                        <div className={bottomStyles.statusIconBox}>{icon}</div>
                        <span className={bottomStyles.statusName}>{name}</span>
                      </div>
                      <span className={`${bottomStyles.statusDotBadge} ${dotClass}`}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </SpotlightCard>

          {/* -- ملخص اليوم -- */}
          {data.today_summary && (
            <SpotlightCard>
              <div className={bottomStyles.card}>
                <div className={bottomStyles.cardHeader}>
                  <div className={bottomStyles.cardTitle}>
                    <Activity className={bottomStyles.cardIcon} size={18} />
                    ملخص اليوم
                  </div>
                </div>
                <div className={bottomStyles.todayStatList}>
                  <div className={bottomStyles.todayStatRow}>
                    <div className={bottomStyles.todayStatLeft}>
                      <Code size={15} className={bottomStyles.todayStatIcon} />
                      طلبات API
                    </div>
                    <span className={bottomStyles.todayStatValue}>
                      {(data.today_summary.api_requests ?? 0).toLocaleString('en-US')}
                    </span>
                  </div>
                  <div className={bottomStyles.todayStatRow}>
                    <div className={bottomStyles.todayStatLeft}>
                      <MessageCircle size={15} className={bottomStyles.todayStatIcon} />
                      الرسائل المرسلة
                    </div>
                    <span className={bottomStyles.todayStatValue}>
                      {(data.today_summary.messages_sent ?? 0).toLocaleString('en-US')}
                    </span>
                  </div>
                  <div className={bottomStyles.todayStatRow}>
                    <div className={bottomStyles.todayStatLeft}>
                      <CreditCard size={15} className={bottomStyles.todayStatIcon} />
                      مدفوعات اليوم
                    </div>
                    <span className={bottomStyles.todayStatValue}>
                      {data.today_summary.paid_invoices ?? 0}
                    </span>
                  </div>
                  <div className={bottomStyles.todayStatRow}>
                    <div className={bottomStyles.todayStatLeft}>
                      <Users size={15} className={bottomStyles.todayStatIcon} />
                      عملاء جدد
                    </div>
                    <span className={bottomStyles.todayStatValue}>
                      {data.today_summary.new_customers ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          )}

          {/* -- سجل العمليات -- */}
          <SpotlightCard>
            <div className={bottomStyles.card}>
              <div className={bottomStyles.cardHeader}>
                <div className={bottomStyles.cardTitle}>
                  <Shield className={bottomStyles.cardIcon} size={18} />
                  سجل العمليات
                </div>
              </div>
              <div className={bottomStyles.scrollableBody}>
                {data.audit_logs?.length > 0 ? (
                  <div className={bottomStyles.feedList}>
                    {data.audit_logs.map((log: any) => {
                      const method = (log.method || '').toUpperCase();
                      const methodClass =
                        method === 'POST' ? bottomStyles.methodPost :
                          method === 'GET' ? bottomStyles.methodGet :
                            method === 'DELETE' ? bottomStyles.methodDelete :
                              method === 'PUT' ? bottomStyles.methodPut :
                                method === 'PATCH' ? bottomStyles.methodPatch :
                                  bottomStyles.methodOther;
                      const sc = log.status_code || 0;
                      const scClass =
                        sc >= 200 && sc < 300 ? bottomStyles.statusCode2xx :
                          sc >= 400 && sc < 500 ? bottomStyles.statusCode4xx :
                            sc >= 500 ? bottomStyles.statusCode5xx : '';
                      const timeAgo = log.created_at
                        ? (() => {
                          const diff = Math.floor((Date.now() - new Date(log.created_at).getTime()) / 1000);
                          if (diff < 60) return `منذ ${diff} ث`;
                          if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
                          if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
                          return `منذ ${Math.floor(diff / 86400)} ي`;
                        })()
                        : '';
                      return (
                        <div key={log.id} className={bottomStyles.feedItem}>
                          <span className={`${bottomStyles.methodBadge} ${methodClass}`}>{method || '?'}</span>
                          <div className={bottomStyles.feedContent}>
                            <div className={bottomStyles.feedEndpoint} dir="ltr">{log.endpoint}</div>
                            <div className={bottomStyles.feedMeta}>
                              <span dir="ltr">{log.user_email}</span>
                              <span>·</span>
                              <span>{timeAgo}</span>
                              {sc > 0 && (
                                <>
                                  <span>·</span>
                                  <span className={`${bottomStyles.statusCodeBadge} ${scClass}`}>{sc}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={bottomStyles.emptyState}>
                    <Clock size={32} style={{ opacity: 0.4 }} />
                    لا يوجد نشاطات مسجلة
                  </div>
                )}
              </div>
              <div className={bottomStyles.sectionFooter}>
                <button className={bottomStyles.viewAllBtn}>
                  عرض سجل العمليات بالكامل ←
                </button>
              </div>
            </div>
          </SpotlightCard>

        </div>
      </div>
    </div>
  );
}






// --- Skeleton ---
function SkeletonLoading() {
  return (
    <div className={styles.dashboardContainer} dir="rtl">
      <div className={`${styles.grid} ${styles.grid4}`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`${styles.card} ${styles.skeleton}`} style={{ height: 90 }} />
        ))}
      </div>
      {[[2], [2], [2], [2]].map((_, ri) => (
        <div key={ri} className={`${styles.grid} ${styles.grid2}`}>
          {[1, 2].map(i => <div key={i} className={`${styles.card} ${styles.skeleton}`} style={{ height: 260 }} />)}
        </div>
      ))}
    </div>
  );
}

// --- Error ---
function ErrorState({ message, onRetry }: any) {
  return (
    <div className={styles.emptyState} style={{ minHeight: '60vh' }}>
      <AlertTriangle className={styles.emptyStateIcon} style={{ color: '#f87171', opacity: 1 }} />
      <div className={styles.emptyStateTitle}>حدث خطأ أثناء تحميل البيانات</div>
      <div className={styles.emptyStateDesc}>{message}</div>
      <button onClick={onRetry} className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: '1rem' }}>
        إعادة المحاولة
      </button>
    </div>
  );
}
