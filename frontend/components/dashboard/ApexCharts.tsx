'use client';

/**
 * ApexCharts.tsx
 * Shared chart components using ApexCharts for Premium SaaS Dashboards
 * Uses next/dynamic to disable SSR as ApexCharts relies on window
 */

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart2, TrendingUp, PieChart as PieIcon, Info } from 'lucide-react';
import styles from '../../app/dashboard/dashboard.module.css';
import { PremiumCardWrapper } from '@/components/dashboard/PremiumCard';
export const CHART_COLORS = {
  primary: '#E8833A',     // Warm Orange — matches globals.css --primary
  primaryLow: '#3D2A18',  // Primary dark (matches --primary-light dark)
  success: '#22C55E',     // Green — matches --success
  danger: '#EF4444',      // Red — matches --error
  warning: '#F59E0B',     // Amber — matches --warning
  info: '#3B82F6',        // Blue — matches --info
  muted: 'rgba(255,255,255,0.04)',
  text: '#F0EDE8',        // Matches --text-primary dark
  textMuted: '#9A9A9A',   // Matches --text-secondary dark
  cta: '#E8833A'          // Same as primary in this design system
};

// Dynamically import ReactApexChart to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ─── Data Validation Utilities ───────────────────────────────────────────────
function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } catch {
    return dateStr;
  }
}

function processTimeSeriesData(data: any[], valueKey: string) {
  if (!Array.isArray(data)) return [];
  return data
    .filter(d => {
      if (!d || !d.date) return false;
      const dt = new Date(d.date);
      return !isNaN(dt.getTime());
    })
    .map(d => ({
      x: formatDate(String(d.date)),
      y: Number(d[valueKey] || 0)
    }));
}

function processPieData(data: any[]) {
  if (!Array.isArray(data)) return { labels: [], series: [] };
  const labels: string[] = [];
  const series: number[] = [];
  data.forEach(d => {
    if (d && d.name != null) {
      labels.push(String(d.name));
      series.push(Number(d.value || 0));
    }
  });
  return { labels, series };
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function ChartEmptyState() {
  return (
    <div style={{ width: '100%', height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
      <Info size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
      <span style={{ fontSize: '14px', fontWeight: 500 }}>لا توجد بيانات كافية حتى الآن</span>
    </div>
  );
}

// ─── Chart Card Wrapper ──────────────────────────────────────────────────────
export function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) {
  return (
    <PremiumCardWrapper className={styles.saasCard} style={{ display: 'flex', flexDirection: 'column' }}>
      <div className={styles.saasCardHeader} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
          <div className={styles.saasCardIconWrap} style={{ width: 40, height: 40, flexShrink: 0 }}>
            {icon}
          </div>
          {title}
        </div>
      </div>
      <div style={{ width: '100%', position: 'relative', zIndex: 1, direction: 'ltr', flex: 1 }}>
        {children}
      </div>
    </PremiumCardWrapper>
  );
}

// Common Apex Options — matches globals.css Design System
const commonOptions: any = {
  chart: {
    toolbar: { show: false },
    fontFamily: 'inherit',
    background: 'transparent',
    animations: { enabled: true, easing: 'easeinout', speed: 700 }
  },
  theme: { mode: 'dark' },
  grid: {
    borderColor: '#33333D',   // matches --border dark
    strokeDashArray: 4,
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } },
    padding: { top: 0, right: 0, bottom: 0, left: 10 }
  },
  dataLabels: { enabled: false },
  xaxis: {
    labels: { style: { colors: CHART_COLORS.textMuted, fontSize: '11px', fontWeight: 500 } },
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: {
    labels: { style: { colors: CHART_COLORS.textMuted, fontSize: '11px', fontWeight: 500 } }
  },
  tooltip: {
    theme: 'dark',
    style: { fontSize: '12px', fontFamily: 'inherit' },
    x: { show: true }
  }
};

// ─── 1. Daily Messages Bar Chart ─────────────────────────────────────────────
export function DailyMessagesApexChart({ data }: { data: any }) {
  const [series, setSeries] = useState<any[]>([]);
  const hasData = series.length > 0 && series[0].data.length > 0;

  useEffect(() => {
    const validData = processTimeSeriesData(data, 'messages');
    if (validData.length > 0) setSeries([{ name: 'رسالة', data: validData }]);
  }, [data]);

  const options = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'bar' },
    colors: [CHART_COLORS.primary],
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: '40%' }
    }
  };

  return (
    <ChartCard title="الرسائل اليومية (آخر 30 يوم)" icon={<BarChart2 size={20} />}>
      {hasData ? (
        <ReactApexChart options={options} series={series} type="bar" height={240} />
      ) : <ChartEmptyState />}
    </ChartCard>
  );
}

// ─── 2. Cumulative Usage Line/Area Chart ──────────────────────────────────────
export function UsageOverTimeApexChart({ data }: { data: any }) {
  const [series, setSeries] = useState<any[]>([]);
  const hasData = series.length > 0 && series[0].data.length > 0;

  useEffect(() => {
    const validData = processTimeSeriesData(data, 'messages');
    if (validData.length > 0) setSeries([{ name: 'استهلاك', data: validData }]);
  }, [data]);

  const options = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'area' },
    colors: [CHART_COLORS.primary],
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 90, 100] }
    }
  };

  return (
    <ChartCard title="استهلاك الرسائل التراكمي" icon={<TrendingUp size={20} />}>
      {hasData ? (
        <ReactApexChart options={options} series={series} type="area" height={240} />
      ) : <ChartEmptyState />}
    </ChartCard>
  );
}

// ─── 3. Devices Status Donut ─────────────────────────────────────────────────
export function DevicesStatusApexChart({ data }: { data: any }) {
  const [series, setSeries] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const hasData = series.length > 0 && series.reduce((a, b) => a + b, 0) > 0;

  useEffect(() => {
    const { labels: l, series: s } = processPieData(data);
    setLabels(l);
    setSeries(s);
  }, [data]);

  const options = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'donut' },
    labels: labels,
    colors: [CHART_COLORS.primary, CHART_COLORS.textMuted],
    stroke: { show: false },
    legend: { position: 'bottom', labels: { colors: '#94a3b8' }, fontSize: '13px' },
    plotOptions: {
      pie: { donut: { size: '70%' } }
    }
  };

  return (
    <ChartCard title="حالة الأجهزة" icon={<PieIcon size={20} />}>
      {hasData ? (
        <ReactApexChart options={options} series={series} type="donut" height={260} />
      ) : <ChartEmptyState />}
    </ChartCard>
  );
}

// ─── 4. Invoices Overview Donut ──────────────────────────────────────────────
export function InvoicesOverviewApexChart({ data }: { data: any }) {
  const [series, setSeries] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const hasData = series.length > 0 && series.reduce((a, b) => a + b, 0) > 0;

  useEffect(() => {
    const { labels: l, series: s } = processPieData(data);
    setLabels(l);
    setSeries(s);
  }, [data]);

  const options = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'donut' },
    labels: labels,
    colors: [CHART_COLORS.primary, CHART_COLORS.textMuted, CHART_COLORS.success],
    stroke: { show: false },
    legend: { position: 'bottom', labels: { colors: '#94a3b8' }, fontSize: '13px' },
    plotOptions: {
      pie: { donut: { size: '70%' } }
    }
  };

  return (
    <ChartCard title="الفواتير حسب الحالة" icon={<PieIcon size={20} />}>
      {hasData ? (
        <ReactApexChart options={options} series={series} type="donut" height={260} />
      ) : <ChartEmptyState />}
    </ChartCard>
  );
}

// ─── 5. Admin: Daily Orders Bar Chart ────────────────────────────────────────
export function DailyOrdersApexChart({ data }: { data: any }) {
  const [series, setSeries] = useState<any[]>([]);
  const hasData = series.length > 0 && series[0].data.length > 0;

  useEffect(() => {
    const validData = processTimeSeriesData(data, 'count');
    if (validData.length > 0) setSeries([{ name: 'اشتراك', data: validData }]);
  }, [data]);

  const options = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'bar' },
    colors: [CHART_COLORS.primary],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } }
  };

  return (
    <ChartCard title="الاشتراكات اليومية (آخر 30 يوم)" icon={<BarChart2 size={20} />}>
      {hasData ? (
        <ReactApexChart options={options} series={series} type="bar" height={240} />
      ) : <ChartEmptyState />}
    </ChartCard>
  );
}

// ─── 6. Admin: Daily Active Users Line ───────────────────────────────────────
export function DailyActiveUsersApexChart({ data }: { data: any }) {
  const [series, setSeries] = useState<any[]>([]);
  const hasData = series.length > 0 && series[0].data.length > 0;

  useEffect(() => {
    const validData = processTimeSeriesData(data, 'users');
    if (validData.length > 0) setSeries([{ name: 'مستخدم نشط', data: validData }]);
  }, [data]);

  const options = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'line' },
    colors: [CHART_COLORS.primary],
    stroke: { curve: 'smooth', width: 4 }
  };

  return (
    <ChartCard title="المستخدمون النشطون يومياً" icon={<TrendingUp size={20} />}>
      {hasData ? (
        <ReactApexChart options={options} series={series} type="line" height={240} />
      ) : <ChartEmptyState />}
    </ChartCard>
  );
}

// ─── 7. Admin: Daily Revenue Area Chart ──────────────────────────────────────
export function DailyRevenueApexChart({ data }: { data: any }) {
  const [series, setSeries] = useState<any[]>([]);
  const hasData = series.length > 0 && series[0].data.length > 0;

  useEffect(() => {
    const validData = processTimeSeriesData(data, 'amount');
    if (validData.length > 0) setSeries([{ name: 'إيرادات (SAR)', data: validData }]);
  }, [data]);

  const options = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'area' },
    colors: [CHART_COLORS.primary],
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 90, 100] }
    },
    yaxis: {
      labels: { style: { colors: '#64748b', fontSize: '11px' }, formatter: (v: number) => `$${v}` }
    }
  };

  return (
    <ChartCard title="الإيرادات اليومية (آخر 30 يوم)" icon={<TrendingUp size={20} />}>
      {hasData ? (
        <ReactApexChart options={options} series={series} type="area" height={240} />
      ) : <ChartEmptyState />}
    </ChartCard>
  );
}

// ─── 8. Admin: Invoices by Status Pie ────────────────────────────────────────
export function AdminInvoicesStatusApexChart({ data }: { data: any }) {
  const [series, setSeries] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const hasData = series.length > 0 && series.reduce((a, b) => a + b, 0) > 0;

  useEffect(() => {
    const { labels: l, series: s } = processPieData(data);
    const translated = l.map(label => {
      const lower = label.toLowerCase();
      if (lower === 'paid') return 'مدفوعة';
      if (lower === 'pending' || lower === 'under_review') return 'معلقة';
      if (lower === 'rejected') return 'مرفوضة';
      return label;
    });
    setLabels(translated);
    setSeries(s);
  }, [data]);

  const options = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'donut' },
    labels: labels,
    colors: [CHART_COLORS.primary, CHART_COLORS.textMuted, CHART_COLORS.success],
    stroke: { show: false },
    legend: { position: 'bottom', labels: { colors: '#94a3b8' }, fontSize: '13px' },
    plotOptions: { pie: { donut: { size: '70%' } } },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: { width: '100%' },
        plotOptions: { pie: { customScale: 0.8 } }
      }
    }]
  };

  return (
    <ChartCard title="الفواتير حسب الحالة" icon={<PieIcon size={20} />}>
      {hasData ? (
        <ReactApexChart options={options} series={series} type="donut" height={260} />
      ) : <ChartEmptyState />}
    </ChartCard>
  );
}

// ─── 9. Admin: Customers Growth Bar Chart ────────────────────────────────────
export function CustomersGrowthApexChart({ data }: { data: any }) {
  const [series, setSeries] = useState<any[]>([]);
  const hasData = series.length > 0 && series[0].data.length > 0;

  useEffect(() => {
    const validData = processTimeSeriesData(data, 'count');
    if (validData.length > 0) setSeries([{ name: 'عميل جديد', data: validData }]);
  }, [data]);

  const options = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'bar' },
    colors: [CHART_COLORS.primary],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } }
  };

  return (
    <ChartCard title="نمو العملاء الجدد (آخر 30 يوم)" icon={<BarChart2 size={20} />}>
      {hasData ? (
        <ReactApexChart options={options} series={series} type="bar" height={240} />
      ) : <ChartEmptyState />}
    </ChartCard>
  );
}

// ─── 10. Admin: Platform Daily Messages ──────────────────────────────────────
export function PlatformDailyMessagesApexChart({ data }: { data: any }) {
  const [series, setSeries] = useState<any[]>([]);
  const hasData = series.length > 0 && series[0].data.length > 0;

  useEffect(() => {
    const validData = processTimeSeriesData(data, 'messages');
    if (validData.length > 0) setSeries([{ name: 'رسالة', data: validData }]);
  }, [data]);

  const options = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: 'area' },
    colors: [CHART_COLORS.primary],
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 90, 100] }
    }
  };

  return (
    <ChartCard title="رسائل المنصة اليومية" icon={<BarChart2 size={20} />}>
      {hasData ? (
        <ReactApexChart options={options} series={series} type="area" height={240} />
      ) : <ChartEmptyState />}
    </ChartCard>
  );
}
