import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, Download, Users, UserCheck, UserMinus, UserPlus } from 'lucide-react';
import { PremiumButton } from '@/components/dashboard/PremiumButton';
import { PremiumStatCard } from '@/components/dashboard/PremiumCard';
import { API_BASE_URL } from '@/lib/api';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ActivityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export function ActivityReportModal({ isOpen, onClose, token }: ActivityReportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  useEffect(() => {
    if (isOpen && !reportData) {
      fetchReport();
    }
  }, [isOpen]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/clients/activity/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReportData(data);
    } catch (err) {
      console.error('Failed to fetch activity report', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const chartOptions = {
    chart: { type: 'area' as const, toolbar: { show: false }, fontFamily: 'var(--font-cairo)', background: 'transparent' },
    colors: ['#F59E0B'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0, stops: [0, 90, 100] } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' as const, width: 3 },
    xaxis: { 
        categories: reportData?.activityChart?.map((item: any) => item.name) || [], 
        axisBorder: { show: false }, 
        axisTicks: { show: false },
        labels: { style: { colors: 'var(--text-tertiary)' } }
    },
    yaxis: { labels: { style: { colors: 'var(--text-tertiary)' } } },
    grid: { borderColor: 'var(--border-light)', strokeDashArray: 4, xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } } },
    theme: { mode: 'dark' as const },
    tooltip: { theme: 'dark' as const }
  };
  
  const chartSeries = [{ name: 'نشاط', data: reportData?.activityChart?.map((item: any) => item.نشاط) || [] }];

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
          direction: 'rtl'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xl)', padding: '24px', width: '90%', maxWidth: '800px',
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: 'var(--shadow-card-hover)', position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10, paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={24} color="#F59E0B" />
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>تقرير نشاط العملاء</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <PremiumButton variant="outline" size="sm" onClick={handleExportPDF} icon={<Download size={16} />} iconPosition="right">
                  تصدير PDF
                </PremiumButton>
                <button onClick={onClose} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {isLoading || !reportData ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                جاري تحميل التقرير...
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <PremiumStatCard
                    title="إجمالي العملاء"
                    value={reportData.stats.total}
                    icon={<Users size={24} />}
                    color="primary"
                  />
                  <PremiumStatCard
                    title="العملاء النشطين"
                    value={reportData.stats.active}
                    icon={<UserCheck size={24} />}
                    color="success"
                  />
                  <PremiumStatCard
                    title="الموقوفين"
                    value={reportData.stats.suspended}
                    icon={<UserMinus size={24} />}
                    color="danger"
                  />
                  <PremiumStatCard
                    title="العملاء الجدد (هذا الشهر)"
                    value={reportData.stats.new}
                    icon={<UserPlus size={24} />}
                    color="info"
                  />
                </div>
                
                <div style={{ background: 'var(--background)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 20px 0', fontSize: '15px', color: 'var(--text-primary)' }}>نشاط العملاء (آخر 7 أيام)</h4>
                  <div style={{ height: '250px', width: '100%', direction: 'ltr' }}>
                    <Chart options={chartOptions} series={chartSeries} type="area" height="100%" width="100%" />
                  </div>
                </div>
                
                <div style={{ background: 'var(--background)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--text-primary)' }}>آخر العملاء تسجيلاً للدخول</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reportData.recentLogins.map((login: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px' }}>
                            {login.name ? login.name.charAt(0).toUpperCase() : login.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{login.name || 'عميل'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{login.email}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', direction: 'ltr' }}>
                          {login.time}
                        </div>
                      </div>
                    ))}
                    {reportData.recentLogins.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>لا توجد بيانات متاحة</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
