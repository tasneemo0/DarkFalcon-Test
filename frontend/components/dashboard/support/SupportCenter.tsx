'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/context';
import {
  fetchTickets,
  createTicket,
  SupportTicket,
  PaginatedTickets,
} from '@/lib/support-api';
import SupportChatView from './SupportChatView';
import styles from './sc.module.css';

// ─── Icons ──────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconChevron = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconInbox = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);
const IconAlertCircle = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// ─── Helpers ────────────────────────────────────────────────────
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1)  return 'الآن';
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  if (diffHr  < 24) return `منذ ${diffHr} ساعة`;
  if (diffDay < 7)  return `منذ ${diffDay} يوم`;
  return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
}

// ─── Status badge ────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  open:    { label: 'مفتوحة',       cls: styles.sOpen    },
  pending: { label: 'بانتظار الرد', cls: styles.sPending },
  closed:  { label: 'مغلقة',        cls: styles.sClosed  },
};

function StatusDot({ status }: { status: string }) {
  const s = STATUS_MAP[status] || STATUS_MAP.open;
  return (
    <span className={`${styles.statusChip} ${s.cls}`}>
      <span className={styles.statusDotPulse} />
      {s.label}
    </span>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className={styles.skRow}>
      <div className={styles.skLeft}>
        <div className={styles.skLine} style={{ width: 80, height: 11, marginBottom: 10 }} />
        <div className={styles.skLine} style={{ width: 220, height: 16, marginBottom: 8 }} />
        <div className={styles.skLine} style={{ width: 160, height: 12 }} />
      </div>
      <div className={styles.skRight}>
        <div className={styles.skLine} style={{ width: 66, height: 24, borderRadius: 20 }} />
        <div className={styles.skLine} style={{ width: 52, height: 11, marginTop: 8 }} />
      </div>
    </div>
  );
}

// ─── Create Modal ────────────────────────────────────────────────
interface ModalProps {
  token: string;
  onClose: () => void;
  onCreated: (t: SupportTicket) => void;
}

function CreateModal({ token, onClose, onCreated }: ModalProps) {
  const [subject,     setSubject]     = useState('');
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim())     { setError('يرجى إدخال موضوع الطلب.'); return; }
    if (!description.trim()) { setError('يرجى إدخال وصف المشكلة.'); return; }
    setLoading(true); setError('');
    try {
      const t = await createTicket(token, { subject: subject.trim(), description: description.trim() });
      onCreated(t);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title" dir="rtl">
        {/* Modal header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 id="modal-title" className={styles.modalTitle}>إنشاء طلب دعم</h2>
            <p className={styles.modalSub}>سيرد عليك فريق الدعم في أقرب وقت ممكن.</p>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose} aria-label="إغلاق"><IconX /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.fieldGroup}>
            <label htmlFor="ticket-subject" className={styles.fieldLabel}>موضوع الطلب</label>
            <input
              id="ticket-subject"
              className={styles.fieldInput}
              type="text"
              placeholder="مثال: مشكلة في الاتصال بالجهاز"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              maxLength={200}
              disabled={loading}
              dir="auto"
              autoFocus
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="ticket-desc" className={styles.fieldLabel}>
              وصف المشكلة
              <span className={styles.fieldLabelNote}>كلما كانت التفاصيل أوضح، كانت المساعدة أسرع</span>
            </label>
            <textarea
              id="ticket-desc"
              className={styles.fieldTextarea}
              placeholder="اشرح ما حدث بالتفصيل: متى ظهرت المشكلة؟ ما الذي كنت تفعله؟"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={loading}
              dir="auto"
              rows={5}
            />
          </div>

          {error && <p className={styles.fieldError}>{error}</p>}

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={loading}>إلغاء</button>
            <button
              type="submit"
              id="btn-submit-ticket"
              className={styles.btnBrand}
              disabled={loading || !subject.trim() || !description.trim()}
            >
              {loading ? <span className={styles.spinner} /> : <IconPlus />}
              {loading ? 'جارٍ الإرسال…' : 'إرسال الطلب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function SupportCenter() {
  const { token } = useApp();
  const [data,         setData]         = useState<PaginatedTickets | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page,         setPage]         = useState(1);
  const [showModal,    setShowModal]    = useState(false);
  const [openTicketId, setOpenTicketId] = useState<number | null>(null);

  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const result = await fetchTickets(token, {
        status: statusFilter || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setData(result);
    } catch {
      setError('تعذّر تحميل الطلبات. يرجى المحاولة مجدداً.');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (ticket: SupportTicket) => {
    setShowModal(false);
    setOpenTicketId(ticket.id);
  };

  const handleFilter = (f: string) => {
    setStatusFilter(f);
    setPage(1);
  };

  // Filter tabs with count
  const filterTabs = [
    { key: '',        label: 'جميع الطلبات' },
    { key: 'open',    label: 'مفتوحة'       },
    { key: 'pending', label: 'بانتظار الرد' },
    { key: 'closed',  label: 'مغلقة'        },
  ];

  // Count by status from current page results (approximate for tabs)
  const allCount     = data?.count ?? 0;
  const openCount    = data?.results.filter(t => t.status === 'open').length    ?? 0;
  const pendingCount = data?.results.filter(t => t.status === 'pending').length ?? 0;
  const closedCount  = data?.results.filter(t => t.status === 'closed').length  ?? 0;

  const tabCounts: Record<string, number> = {
    '':        allCount,
    open:      openCount,
    pending:   pendingCount,
    closed:    closedCount,
  };

  // ── Chat view ─────────────────────────────────────────────
  if (openTicketId !== null) {
    return (
      <div className={styles.chatWrapper} dir="rtl">
        <SupportChatView
          ticketId={openTicketId}
          token={token!}
          onBack={() => { setOpenTicketId(null); load(); }}
          onNewTicket={() => { setOpenTicketId(null); setShowModal(true); }}
        />
        {showModal && token && (
          <CreateModal token={token} onClose={() => setShowModal(false)} onCreated={handleCreated} />
        )}
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;
  const tickets    = data?.results ?? [];
  const isEmpty    = !loading && !error && tickets.length === 0;

  return (
    <div className={styles.page} dir="rtl">

      {/* ── Page Header ─────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1 className={styles.pageTitle}>الدعم الفني</h1>
          <p className={styles.pageSub}>تابع طلباتك وتواصل مع فريق الدعم.</p>
        </div>
        <button
          id="btn-create-ticket"
          className={styles.btnCreate}
          onClick={() => setShowModal(true)}
        >
          <IconPlus />
          إنشاء طلب دعم
        </button>
      </div>

      {/* ── Filter Tabs ─────────────────────────────── */}
      <div className={styles.tabsBar}>
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${statusFilter === tab.key ? styles.tabActive : ''}`}
            onClick={() => handleFilter(tab.key)}
          >
            {tab.label}
            {!loading && data && (
              <span className={`${styles.tabCount} ${statusFilter === tab.key ? styles.tabCountActive : ''}`}>
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Inbox Section ───────────────────────────── */}
      <div className={styles.inboxSection}>
        <div className={styles.inboxHeader}>
          <span className={styles.inboxTitle}>طلبات الدعم</span>
          {!loading && data && (
            <span className={styles.inboxCount}>{data.count} طلب</span>
          )}
        </div>

        <div className={styles.inboxList}>

          {/* Loading */}
          {loading && (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          )}

          {/* Error */}
          {!loading && error && (
            <div className={styles.stateBox}>
              <div className={styles.stateIcon} style={{ color: 'var(--error)' }}><IconAlertCircle /></div>
              <p className={styles.stateTitle}>حدث خطأ</p>
              <p className={styles.stateSub}>{error}</p>
              <button className={styles.btnBrand} onClick={load} style={{ marginTop: 12 }}>
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* Empty */}
          {isEmpty && (
            <div className={styles.stateBox}>
              <div className={styles.stateIcon}><IconInbox /></div>
              <p className={styles.stateTitle}>
                {statusFilter ? 'لا توجد طلبات بهذه الحالة' : 'لا توجد طلبات دعم بعد'}
              </p>
              <p className={styles.stateSub}>
                {statusFilter
                  ? 'جرب فلتراً آخر أو أنشئ طلب دعم جديد.'
                  : 'هل تواجه مشكلة؟ أنشئ طلبك وسيرد عليك فريقنا في أقرب وقت.'}
              </p>
              {!statusFilter && (
                <button className={styles.btnBrand} onClick={() => setShowModal(true)} style={{ marginTop: 14 }}>
                  <IconPlus />
                  إنشاء أول طلب
                </button>
              )}
            </div>
          )}

          {/* Ticket rows */}
          {!loading && !error && tickets.map((ticket, idx) => {
            const hasUnread = ticket.unread_count > 0;
            const isLast    = idx === tickets.length - 1;

            return (
              <div
                key={ticket.id}
                id={`ticket-row-${ticket.id}`}
                className={`${styles.ticketRow} ${hasUnread ? styles.ticketRowUnread : ''}`}
                style={{ borderBottom: isLast ? 'none' : undefined }}
                onClick={() => setOpenTicketId(ticket.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setOpenTicketId(ticket.id)}
                aria-label={`فتح التذكرة ${ticket.ticket_number}: ${ticket.subject}`}
              >
                {/* Unread stripe */}
                {hasUnread && <span className={styles.unreadStripe} />}

                {/* Main content */}
                <div className={styles.rowContent}>
                  {/* Left: subject + meta */}
                  <div className={styles.rowLeft}>
                    <div className={styles.rowTop}>
                      <span className={styles.ticketNum}>{ticket.ticket_number}</span>
                      {hasUnread && (
                        <span className={styles.unreadBadge} title={`${ticket.unread_count} رسائل غير مقروءة`}>
                          {ticket.unread_count}
                        </span>
                      )}
                    </div>
                    <p className={`${styles.ticketSubject} ${hasUnread ? styles.ticketSubjectBold : ''}`}>
                      {ticket.subject}
                    </p>
                    <p className={styles.ticketPreview}>
                      {ticket.last_message || ticket.description?.slice(0, 80) || '—'}
                    </p>
                  </div>

                  {/* Right: status + time + chevron */}
                  <div className={styles.rowRight}>
                    <StatusDot status={ticket.status} />
                    <span className={styles.ticketTime}>
                      {formatRelativeTime(ticket.last_message_time || ticket.updated_at)}
                    </span>
                    <span className={styles.rowChevron}><IconChevron /></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pagination ──────────────────────────────── */}
      {!loading && data && data.count > PAGE_SIZE && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!data.previous}
          >
            <IconChevronRight /> السابق
          </button>
          <span className={styles.pageInfo}>
            {page} / {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => p + 1)}
            disabled={!data.next}
          >
            التالي <IconChevronLeft />
          </button>
        </div>
      )}

      {/* ── Modal ───────────────────────────────────── */}
      {showModal && token && (
        <CreateModal token={token} onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
