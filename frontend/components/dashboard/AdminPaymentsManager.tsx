'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText, Search, Filter, Calendar, Download, CheckCircle, XCircle, Clock,
  Eye, Check, X, MoreVertical, CreditCard, Banknote, HelpCircle, User,
  ArrowUpRight, DollarSign, Receipt, TrendingUp, CheckCircle2, AlertCircle
} from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { PremiumStatCard, PremiumCardWrapper } from '@/components/dashboard/PremiumCard';

interface AdminPaymentsManagerProps {
  invoices: any[];
  locale: string;
  handleAction: (invoiceId: number, action: 'accept' | 'reject', reason?: string) => void;
}

export function AdminPaymentsManager({ invoices, locale, handleAction }: AdminPaymentsManagerProps) {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals / Drawers State
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [approveInvoice, setApproveInvoice] = useState<any>(null);
  const [rejectInvoice, setRejectInvoice] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter invoices based on real data
  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const nameMatch = (inv.user_full_name || '').toLowerCase().includes(search);
      const emailMatch = (inv.user_email || '').toLowerCase().includes(search);
      const idMatch = inv.id.toString().includes(search);
      return nameMatch || emailMatch || idMatch;
    }
    return true;
  });

  // Derived Stats from real data
  const totalInvoices = invoices.length;
  const completed = invoices.filter(i => i.status === 'paid' || i.status === 'مكتمل').length;
  const pending = invoices.filter(i => i.status === 'pending' || i.status === 'معلق').length;
  const rejected = invoices.filter(i => i.status === 'rejected' || i.status === 'مرفوض').length;
  const revenue = invoices.filter(i => i.status === 'paid' || i.status === 'مكتمل').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const triggerAction = (action: 'accept' | 'reject', id: number, reason?: string) => {
    handleAction(id, action, reason);
    setApproveInvoice(null);
    setRejectInvoice(null);
    setViewInvoice(null);
    setRejectReason('');
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return 'U';
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        /* Core Animations */
        @keyframes apmFadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes apmSlideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        /* Layout */
        .apm-container {
          display: flex;
          flex-direction: column;
          gap: 32px;
          color: var(--text-primary);
        }

        /* Header */
        .apm-header {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: apmFadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .apm-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .apm-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          background: var(--surface);
          padding: 12px;
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .apm-filter-input {
          background: var(--surface-hover);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
        }
        .apm-filter-input:focus {
          border-color: #f97316;
          background: var(--primary-lighter);
        }

        /* Summary Cards */
        .apm-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }
        .apm-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          opacity: 0;
        }
        .apm-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .apm-card:hover .apm-card-icon {
          transform: scale(1.1) rotate(5deg);
        }
        .apm-card.delay-1 { animation: apmFadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards; }
        .apm-card.delay-2 { animation: apmFadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards; }
        .apm-card.delay-3 { animation: apmFadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards; }
        .apm-card.delay-4 { animation: apmFadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.4s forwards; }
        .apm-card.delay-5 { animation: apmFadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.5s forwards; }

        /* DataTable */
        .apm-table-container {
          background: linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
          overflow-x: auto;
          animation: apmFadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.6s forwards;
          opacity: 0;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
        }
        .apm-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          text-align: start;
          min-width: 900px;
        }
        .apm-table th {
          background: rgba(0,0,0,0.2);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          white-space: nowrap;
        }
        .apm-table td {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          font-size: 14px;
          color: var(--text-secondary);
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        
        .apm-table tr {
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
        }
        .apm-table tr:hover {
          background: linear-gradient(90deg, rgba(var(--primary-rgb), 0.05) 0%, transparent 100%);
          cursor: pointer;
        }
        .apm-table tr:hover td {
          color: var(--text-primary);
        }
        .apm-table th:nth-child(5), .apm-table td:nth-child(5),
        .apm-table th:nth-child(6), .apm-table td:nth-child(6),
        .apm-table th:nth-child(7), .apm-table td:nth-child(7),
        .apm-table th:nth-child(8), .apm-table td:nth-child(8) {
          text-align: center;
        }
        
        .apm-table td:first-child {
          border-inline-start: 4px solid transparent;
        }
        .apm-table tr:hover td:first-child {
          border-inline-start-color: var(--primary);
          padding-inline-start: 32px;
        }
        
        /* Badges */
        .apm-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(8px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .apm-badge::before {
          content: '';
          display: block;
          width: 6px; height: 6px;
          border-radius: 50%;
        }
        .apm-badge.paid {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .apm-badge.paid::before { background: #34d399; box-shadow: 0 0 8px #34d399; }
        
        .apm-badge.pending {
          background: rgba(245, 158, 11, 0.1);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .apm-badge.pending::before { background: #fbbf24; box-shadow: 0 0 8px #fbbf24; animation: pulseGlow 2s infinite; }
        
        .apm-badge.rejected {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .apm-badge.rejected::before { background: #f87171; box-shadow: 0 0 8px #f87171; }
        
        @keyframes pulseGlow {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        /* Actions */
        .apm-actions {
          display: flex;
          gap: 8px;
          opacity: 0.4;
          transition: opacity 0.3s ease;
        }
        .apm-table tr:hover .apm-actions {
          opacity: 1;
        }
        .apm-btn-icon {
          background: var(--surface-hover);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .apm-btn-icon:hover {
          background: var(--text-primary);
          color: var(--bg-primary);
          transform: translateY(-2px);
        }
        .apm-btn-icon.approve:hover { background: #10b981; color: var(--text-primary); border-color: #10b981; }
        .apm-btn-icon.reject:hover { background: #ef4444; color: var(--text-primary); border-color: #ef4444; }

        /* Modals & Drawers overlay */
        .apm-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Drawer */
        .apm-drawer {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          width: 440px;
          max-width: 100%;
          background: var(--surface);
          border-left: 1px solid var(--border);
          z-index: 1001;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: apmSlideInRight 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          box-shadow: -20px 0 60px rgba(0,0,0,0.5);
          overflow-y: auto;
        }

        /* Modal */
        .apm-modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 32px;
          width: 480px;
          max-width: 90%;
          z-index: 1001;
          box-shadow: 0 30px 60px rgba(0,0,0,0.6);
          animation: apmFadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        
        .apm-avatar-initials {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.2), rgba(var(--primary-rgb), 0.05));
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; color: var(--primary); font-size: 14px;
          border: 1px solid rgba(var(--primary-rgb), 0.3);
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.15);
        }

      `}</style>

      <div className="apm-container">
        {/* Header */}
        <div className="apm-header">
          <div className="apm-header-top">
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {locale === 'ar' ? 'إدارة المدفوعات' : 'Payment Management'}
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: '15px', color: 'var(--text-secondary)' }}>
                {locale === 'ar'
                  ? 'مراجعة وإدارة جميع المدفوعات والفواتير وطلبات الاشتراك.'
                  : 'Review and manage all payments, invoices, and subscription requests.'}
              </p>
            </div>
            <button style={{
              background: 'var(--primary)', color: 'var(--text-primary)', border: 'none', borderRadius: '12px',
              padding: '12px 20px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
              cursor: 'pointer', boxShadow: 'var(--shadow-md)'
            }}>
              <Download size={16} />
              {locale === 'ar' ? 'تصدير CSV' : 'Export CSV'}
            </button>
          </div>

          <div className="apm-filters">
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={16} style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                className="apm-filter-input"
                placeholder={locale === 'ar' ? 'البحث بالاسم أو الإيميل...' : 'Search by name or email...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px' }}
              />
            </div>
            <select className="apm-filter-input" style={{ flex: '1 1 120px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">{locale === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="apm-filter-input" style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={14} color="#64748b" />
              <span>{locale === 'ar' ? 'آخر 30 يوم' : 'Last 30 Days'}</span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="apm-summary-grid">
          <PremiumStatCard title={locale === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices'} value={totalInvoices} icon={<Receipt size={24} />} color="info" />
          <PremiumStatCard title={locale === 'ar' ? 'المدفوعات المكتملة' : 'Completed Payments'} value={completed} icon={<CheckCircle size={24} />} color="success" />
          <PremiumStatCard title={locale === 'ar' ? 'المدفوعات المعلقة' : 'Pending Payments'} value={pending} icon={<Clock size={24} />} color="warning" />
          <PremiumStatCard title={locale === 'ar' ? 'المدفوعات المرفوضة' : 'Rejected Payments'} value={rejected} icon={<XCircle size={24} />} color="danger" />
          <PremiumStatCard title={locale === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'} value={revenue} prefix="SAR " icon={<TrendingUp size={24} />} color="primary" />
        </div>

        {/* Data Table */}
        <div className="apm-table-container">
          <table className="saasResponsiveTable apm-table" style={{ direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
                <th>{locale === 'ar' ? 'العميل' : 'Customer'}</th>
                <th>{locale === 'ar' ? 'الباقة' : 'Package'}</th>
                <th>{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</th>
                <th>{locale === 'ar' ? 'المبلغ' : 'Amount'}</th>
                <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                <th>{locale === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</th>
                <th>{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <AlertCircle size={32} opacity={0.5} />
                      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{locale === 'ar' ? 'لا توجد فواتير حتى الآن' : 'No invoices found'}</div>
                      <div style={{ fontSize: '13px' }}>{locale === 'ar' ? 'ستظهر الفواتير هنا عند إنشاء أول طلب اشتراك أو عملية دفع.' : 'Invoices will appear here once a subscription is purchased.'}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} onClick={() => setViewInvoice(inv)}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>#{inv.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="apm-avatar-initials">
                          {getInitials(inv.user_full_name, inv.user_email)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.user_full_name || 'Unknown'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{inv.user_email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', backdropFilter: 'blur(4px)', display: 'inline-block', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        {inv.plan_name || (locale === 'ar' ? 'غير محددة' : 'Not specified')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CreditCard size={14} color="#94a3b8" />
                        {inv.payment_method || (locale === 'ar' ? 'غير محدد' : 'Unknown')}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.amount} SAR</td>
                    <td>
                      <StatusBadge status={inv.status} locale={locale} />
                    </td>
                    <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="apm-actions" onClick={e => e.stopPropagation()}>
                        <button className="apm-btn-icon" onClick={() => setViewInvoice(inv)} title="View"><Eye size={14} /></button>
                        {inv.status === 'pending' && (
                          <>
                            <button className="apm-btn-icon approve" onClick={() => setApproveInvoice(inv)} title="Approve"><Check size={14} /></button>
                            <button className="apm-btn-icon reject" onClick={() => setRejectInvoice(inv)} title="Reject"><X size={14} /></button>
                          </>
                        )}
                        <a href={`/api/v1/billing/invoices/${inv.id}/download/`} download className="apm-btn-icon" title="Download"><Download size={14} /></a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Drawer */}
      {viewInvoice && (
        <div className="apm-overlay" onClick={() => setViewInvoice(null)}>
          <div className="apm-drawer" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Invoice #{viewInvoice.id}</h2>
              <button className="apm-btn-icon" onClick={() => setViewInvoice(null)}><X size={18} /></button>
            </div>

            <div style={{ background: 'var(--surface-hover)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="apm-avatar-initials" style={{ width: 48, height: 48, fontSize: '18px' }}>
                  {getInitials(viewInvoice.user_full_name, viewInvoice.user_email)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>{viewInvoice.user_full_name || 'Unknown'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{viewInvoice.user_email || 'No email'}</div>
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--surface-hover)' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div>
                  <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>Package</div>
                  <div style={{ fontWeight: 600 }}>{viewInvoice.plan_name || 'غير محددة'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>Amount</div>
                  <div style={{ fontWeight: 700, color: '#f97316' }}>{viewInvoice.amount} SAR</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>Status</div>
                  <StatusBadge status={viewInvoice.status} locale={locale} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>Method</div>
                  <div style={{ fontWeight: 600 }}>{viewInvoice.payment_method || 'غير محدد'}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Payment Proof</h4>
              {viewInvoice.receipt_image ? (
                <div style={{ width: '100%', height: '200px', background: 'var(--surface-hover)', borderRadius: '12px', overflow: 'hidden' }}>
                  <img src={viewInvoice.receipt_image} alt="Receipt" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: '200px', background: 'var(--surface-hover)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                  <FileText size={40} opacity={0.5} />
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {viewInvoice.status === 'pending' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => { setApproveInvoice(viewInvoice); setViewInvoice(null); }} style={{ flex: 1, padding: '14px', background: 'var(--success)', color: 'var(--text-primary)', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => { setRejectInvoice(viewInvoice); setViewInvoice(null); }} style={{ flex: 1, padding: '14px', background: 'var(--error)', color: 'var(--text-primary)', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                </div>
              )}
              <a href={`/api/v1/billing/invoices/${viewInvoice.id}/download/`} download style={{ width: '100%', padding: '14px', background: 'var(--surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>Download PDF</a>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveInvoice && (
        <div className="apm-overlay" onClick={() => setApproveInvoice(null)}>
          <div className="apm-modal" onClick={e => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <CheckCircle2 size={24} />
            </div>
            <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 800 }}>Approve Payment</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              You are about to activate this customer's subscription. This action will:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-primary)', fontSize: '14px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} color="#10b981" /> Mark invoice #{approveInvoice.id} as paid</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} color="#10b981" /> Activate {approveInvoice.plan_name || 'package'}</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} color="#10b981" /> Update customer permissions</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} color="#10b981" /> Record activity log</li>
            </ul>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setApproveInvoice(null)} style={{ flex: 1, padding: '14px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => triggerAction('accept', approveInvoice.id)} style={{ flex: 1, padding: '14px', background: 'var(--success)', color: 'var(--text-primary)', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Approve Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectInvoice && (
        <div className="apm-overlay" onClick={() => setRejectInvoice(null)}>
          <div className="apm-modal" onClick={e => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <XCircle size={24} />
            </div>
            <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 800 }}>Reject Payment</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Please provide a reason for rejecting invoice #{rejectInvoice.id}. This will be sent to the customer.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="E.g., Payment proof is blurry..."
              rows={4}
              style={{ width: '100%', padding: '14px', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', marginBottom: '24px', resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setRejectInvoice(null)} style={{ flex: 1, padding: '14px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => triggerAction('reject', rejectInvoice.id, rejectReason)} style={{ flex: 1, padding: '14px', background: 'var(--error)', color: 'var(--text-primary)', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Reject Payment</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helpers



function StatusBadge({ status, locale }: { status: string, locale: string }) {
  const isPaid = status === 'paid' || status === 'مكتمل';
  const isPending = status === 'pending' || status === 'معلق';
  const isRejected = status === 'rejected' || status === 'مرفوض';

  if (isPaid) return <span className="apm-badge paid">{locale === 'ar' ? 'مكتمل' : 'Paid'}</span>;
  if (isPending) return <span className="apm-badge pending">{locale === 'ar' ? 'معلق' : 'Pending'}</span>;
  if (isRejected) return <span className="apm-badge rejected">{locale === 'ar' ? 'مرفوض' : 'Rejected'}</span>;

  return <span className="apm-badge" style={{ background: 'var(--surface-hover)', color: 'var(--text-primary)' }}>{status}</span>;
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

