'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download, Copy, CheckCircle2, AlertTriangle, Receipt, CreditCard, Calendar, User, AlignLeft, Hash } from 'lucide-react';
import styles from './InvoiceDetailsModal.module.css';
import { PremiumButton } from './PremiumButton';
import { API_BASE_URL } from '@/lib/api';
import { useApp } from '@/lib/context';

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number | null;
}

export function InvoiceDetailsModal({ isOpen, onClose, invoiceId }: InvoiceDetailsModalProps) {
  const { token } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoiceDetails = async () => {
    if (!invoiceId) return;
    try {
      setLoading(true);
      setError(null);
      // We assume GET /api/v1/billing/invoices/{id}/ exists or similar.
      // If it's different, we can adjust. The requirement says: 
      // "Fetch invoice data using real invoice.id from API"
      const res = await fetch(`${API_BASE_URL}/api/v1/billing/invoices/${invoiceId}/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('df-token')}`,
        },
      });

      if (!res.ok) {
        throw new Error('فشل جلب تفاصيل الفاتورة، يرجى المحاولة مرة أخرى.');
      }
      
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchInvoiceDetails();
    } else {
      // Reset state when closed
      setTimeout(() => {
        setData(null);
        setError(null);
      }, 300); // Wait for exit animation
    }
  }, [isOpen, invoiceId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay} dir="rtl">
          {/* Backdrop Blur Fade In */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'absolute', inset: 0, zIndex: -1 }}
            onClick={onClose}
          />

          {/* Modal Scale & Fade In */}
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, duration: 0.25 }}
          >
            <div className={styles.header}>
              <div className={styles.title}>
                <Receipt size={24} color="var(--color-primary)" />
                تفاصيل الفاتورة #{invoiceId}
              </div>
              <button className={styles.closeButton} onClick={onClose} aria-label="إغلاق">
                <X size={20} />
              </button>
            </div>

            <div className={styles.content}>
              {loading && <InvoiceLoading />}
              {error && <InvoiceError message={error} onRetry={fetchInvoiceDetails} />}
              {!loading && !error && data && <InvoiceDetailsContent data={data} />}
            </div>

            {!loading && !error && data && (
              <div className={styles.footer}>
                <PremiumButton variant="secondary" onClick={onClose}>إغلاق</PremiumButton>
                
                <PremiumButton 
                  variant="outline" 
                  icon={<Copy size={16} />} 
                  onClick={() => {
                    navigator.clipboard.writeText(`INV-${data.id}`);
                    // Could add a toast here
                  }}
                >
                  نسخ الرقم
                </PremiumButton>

                <PremiumButton 
                  variant="outline" 
                  icon={<Printer size={16} />} 
                  onClick={() => window.print()}
                >
                  طباعة
                </PremiumButton>

                <PremiumButton 
                  variant="primary" 
                  icon={<Download size={16} />} 
                  onClick={() => {
                    window.open(`${API_BASE_URL}/api/v1/billing/invoices/${data.id}/download/`, '_blank');
                  }}
                >
                  تحميل PDF
                </PremiumButton>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InvoiceLoading() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner} />
      <span style={{ fontWeight: 500 }}>جاري جلب بيانات الفاتورة...</span>
    </div>
  );
}

function InvoiceError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.errorContainer}>
      <AlertTriangle size={64} className={styles.errorIcon} />
      <div className={styles.errorTitle}>تعذر تحميل الفاتورة</div>
      <div className={styles.errorDesc}>{message}</div>
      <PremiumButton variant="primary" onClick={onRetry}>إعادة المحاولة</PremiumButton>
    </div>
  );
}

function InvoiceDetailsContent({ data }: { data: any }) {
  // Helpers to format data nicely
  const statusColor = data.status === 'paid' ? styles.badgeSuccess : 
                      data.status === 'under_review' ? styles.badgeWarning : 
                      data.status === 'rejected' ? styles.badgeDanger : '';
  
  const statusLabel = data.status === 'paid' ? 'مدفوعة' : 
                      data.status === 'under_review' ? 'معلقة (قيد المراجعة)' : 
                      data.status === 'rejected' ? 'مرفوضة' : 'غير مدفوعة';

  return (
    <div className={styles.dataGrid}>
      
      {/* Amount Header */}
      <div className={styles.dataGroupFull} style={{ alignItems: 'center', textAlign: 'center', marginBottom: '16px' }}>
        <div className={styles.dataLabel}>إجمالي المبلغ</div>
        <div className={styles.amount}>
          {Number(data.amount || 0).toLocaleString()} {data.currency || 'ر.س'}
        </div>
        <span className={`${styles.badge} ${statusColor}`} style={{ marginTop: '8px' }}>
          {statusLabel}
        </span>
      </div>

      {/* Row 1 */}
      <div className={styles.dataGroup}>
        <div className={styles.dataLabel}>رقم الفاتورة</div>
        <div className={styles.dataValue}><Hash size={16} color="#94a3b8" /> INV-{data.id}</div>
      </div>
      <div className={styles.dataGroup}>
        <div className={styles.dataLabel}>العميل</div>
        <div className={styles.dataValue}><User size={16} color="#94a3b8" /> {data.user_email || 'غير متوفر'}</div>
      </div>

      {/* Row 2 */}
      <div className={styles.dataGroup}>
        <div className={styles.dataLabel}>رقم العميل (Client ID)</div>
        <div className={styles.dataValue}>{data.user_id || '---'}</div>
      </div>
      <div className={styles.dataGroup}>
        <div className={styles.dataLabel}>الباقة (Plan)</div>
        <div className={styles.dataValue}>{data.plan_name || 'باقة مخصصة'}</div>
      </div>

      {/* Row 3 */}
      <div className={styles.dataGroup}>
        <div className={styles.dataLabel}>تاريخ الإنشاء</div>
        <div className={styles.dataValue}>
          <Calendar size={16} color="#94a3b8" />
          {data.created_at ? new Date(data.created_at).toLocaleString('ar-SA') : '---'}
        </div>
      </div>
      <div className={styles.dataGroup}>
        <div className={styles.dataLabel}>تاريخ الدفع</div>
        <div className={styles.dataValue}>
          <CheckCircle2 size={16} color={data.paid_at ? "#10b981" : "#94a3b8"} />
          {data.paid_at ? new Date(data.paid_at).toLocaleString('ar-SA') : 'لم يتم الدفع بعد'}
        </div>
      </div>

      {/* Row 4 */}
      <div className={styles.dataGroup}>
        <div className={styles.dataLabel}>وسيلة الدفع</div>
        <div className={styles.dataValue}>
          <CreditCard size={16} color="#94a3b8" />
          {data.payment_method === 'bank_transfer' ? 'تحويل بنكي' : 
           data.payment_method === 'stripe' ? 'بطاقة ائتمان (Stripe)' : 
           data.payment_method || 'غير محدد'}
        </div>
      </div>
      <div className={styles.dataGroup}>
        <div className={styles.dataLabel}>رقم العملية (Transaction ID)</div>
        <div className={styles.dataValue} style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>
          {data.transaction_id || '---'}
        </div>
      </div>

      {/* Row 5: Notes */}
      {(data.notes || data.rejection_reason) && (
        <div className={styles.dataGroupFull}>
          <div className={styles.dataLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlignLeft size={16} /> ملاحظات
          </div>
          <div className={styles.notesBox}>
            {data.rejection_reason && (
              <div style={{ color: '#ef4444', marginBottom: data.notes ? '8px' : '0' }}>
                <strong>سبب الرفض:</strong> {data.rejection_reason}
              </div>
            )}
            {data.notes && <div>{data.notes}</div>}
          </div>
        </div>
      )}

    </div>
  );
}
