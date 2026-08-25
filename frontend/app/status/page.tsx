'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import styles from './status.module.css';

const services = [
  { name: 'API Server', nameAr: 'خادم API', status: 'operational', uptime: '99.99%' },
  { name: 'WhatsApp Cloud API', nameAr: 'WhatsApp Cloud API', status: 'operational', uptime: '99.95%' },
  { name: 'Webhook Delivery', nameAr: 'تسليم Webhook', status: 'operational', uptime: '99.97%' },
  { name: 'Dashboard', nameAr: 'لوحة التحكم', status: 'operational', uptime: '99.99%' },
  { name: 'Database', nameAr: 'قاعدة البيانات', status: 'operational', uptime: '99.99%' },
  { name: 'Message Queue', nameAr: 'طابور الرسائل', status: 'operational', uptime: '99.98%' },
  { name: 'Authentication', nameAr: 'المصادقة', status: 'operational', uptime: '99.99%' },
  { name: 'CDN / Static Assets', nameAr: 'CDN / الملفات الثابتة', status: 'operational', uptime: '100%' },
];

const incidents = [
  {
    date: '2024-01-10',
    titleEn: 'Increased API Latency',
    titleAr: 'زيادة في زمن استجابة API',
    descEn: 'We experienced increased latency on API requests. Issue has been resolved.',
    descAr: 'واجهنا زيادة في زمن استجابة طلبات API. تم حل المشكلة.',
    status: 'resolved',
    duration: '23 min',
  },
  {
    date: '2024-01-05',
    titleEn: 'Webhook Delivery Delays',
    titleAr: 'تأخير في تسليم Webhook',
    descEn: 'Some webhook deliveries were delayed. All webhooks have been delivered.',
    descAr: 'تأخر تسليم بعض Webhooks. تم تسليم جميع الأحداث.',
    status: 'resolved',
    duration: '45 min',
  },
];

export default function StatusPage() {
  const { locale } = useApp();

  const allOperational = services.every(s => s.status === 'operational');

  return (
    <div className={styles.statusPage}>
      <div className="container">
        {}
        <div className={styles.statusHeader}>
          <h1 className={styles.statusTitle}>
            {locale === 'ar' ? 'حالة الخدمة' : 'Service Status'}
          </h1>
          <div className={`${styles.statusBanner} ${allOperational ? styles.statusOk : styles.statusIssue}`}>
            <div className={styles.statusIcon}>
              {allOperational ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              )}
            </div>
            <span>
              {allOperational
                ? (locale === 'ar' ? 'جميع الأنظمة تعمل بشكل طبيعي' : 'All Systems Operational')
                : (locale === 'ar' ? 'بعض الأنظمة تواجه مشاكل' : 'Some Systems Have Issues')
              }
            </span>
          </div>
        </div>

        {}
        <div className={styles.servicesCard}>
          {services.map((service, i) => (
            <div key={i} className={styles.serviceRow}>
              <div className={styles.serviceName}>
                <span className={styles.serviceStatusDot} data-status={service.status} />
                <span>{locale === 'ar' ? service.nameAr : service.name}</span>
              </div>
              <div className={styles.serviceRight}>
                <span className={styles.serviceUptime}>{service.uptime}</span>
                <span className={`${styles.serviceStatus}`} data-status={service.status}>
                  {service.status === 'operational' ? (locale === 'ar' ? 'يعمل' : 'Operational') :
                   service.status === 'degraded' ? (locale === 'ar' ? 'أداء منخفض' : 'Degraded') :
                   (locale === 'ar' ? 'معطل' : 'Down')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {}
        <div className={styles.uptimeSection}>
          <h2 className={styles.sectionTitle}>
            {locale === 'ar' ? 'سجل وقت التشغيل - آخر 30 يوم' : 'Uptime History - Last 30 Days'}
          </h2>
          <div className={styles.uptimeChart}>
            {Array.from({ length: 30 }, (_, i) => (
              <div 
                key={i} 
                className={styles.uptimeBar} 
                data-status={i === 20 || i === 25 ? 'degraded' : 'operational'}
                title={`Day ${30 - i}`}
              />
            ))}
          </div>
          <div className={styles.uptimeLegend}>
            <span><span className={styles.legendDot} data-status="operational" /> {locale === 'ar' ? 'يعمل' : 'Operational'}</span>
            <span><span className={styles.legendDot} data-status="degraded" /> {locale === 'ar' ? 'أداء منخفض' : 'Degraded'}</span>
            <span><span className={styles.legendDot} data-status="down" /> {locale === 'ar' ? 'معطل' : 'Down'}</span>
          </div>
        </div>

        {}
        <div className={styles.incidentsSection}>
          <h2 className={styles.sectionTitle}>
            {locale === 'ar' ? 'آخر الحوادث' : 'Recent Incidents'}
          </h2>
          {incidents.map((incident, i) => (
            <div key={i} className={styles.incidentCard}>
              <div className={styles.incidentHeader}>
                <span className={styles.incidentDate}>{incident.date}</span>
                <span className={`${styles.incidentStatus}`} data-status={incident.status}>
                  {incident.status === 'resolved' ? (locale === 'ar' ? 'تم الحل' : 'Resolved') : (locale === 'ar' ? 'جاري' : 'Ongoing')}
                </span>
              </div>
              <h3 className={styles.incidentTitle}>{locale === 'ar' ? incident.titleAr : incident.titleEn}</h3>
              <p className={styles.incidentDesc}>{locale === 'ar' ? incident.descAr : incident.descEn}</p>
              <span className={styles.incidentDuration}>
                {locale === 'ar' ? `المدة: ${incident.duration}` : `Duration: ${incident.duration}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}