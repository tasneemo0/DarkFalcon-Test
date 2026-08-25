// AdminSupportInbox.tsx — Premium SaaS UI v3 (UI/UX Polish Only)
// ⚠️ All API / backend / auth / logic unchanged. CSS-only & JSX structure polish.
'use client';

import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import { useApp } from '@/lib/context';
import {
  SupportTicket, TicketMessage, AdminTicketStats, PaginatedTickets,
  adminFetchStats, adminFetchTickets, adminFetchTicket,
  adminReplyTicket, adminChangeStatus, adminAssignTicket,
} from '@/lib/support-api';
import styles from './admin-inbox.module.css';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────
const Ico = {
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Send: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Inbox: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  ChevLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Back: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Info: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Retry: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function relativeTime(d: string): string {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const day = Math.floor(h / 24);
  if (m < 1) return 'الآن';
  if (m < 60) return `${m}د`;
  if (h < 24) return `${h}س`;
  if (day < 7) return `${day}ي`;
  return new Date(d).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
}

function formatTime(d: string): string {
  try { return new Date(d).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function formatDate(d: string): string {
  try {
    const date = new Date(d);
    const today = new Date();
    const yest = new Date(today); yest.setDate(yest.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'اليوم';
    if (date.toDateString() === yest.toDateString()) return 'أمس';
    return date.toLocaleDateString('ar-SA', { weekday: 'long', month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function initials(name: string): string {
  const p = (name || '').split(' ').filter(Boolean);
  if (p.length >= 2) return p[0][0] + p[1][0];
  return (name || '?').substring(0, 2).toUpperCase();
}

function statusLabel(s: string) {
  if (s === 'open') return 'مفتوحة';
  if (s === 'pending') return 'انتظار';
  return 'مغلقة';
}

function statusClass(s: string) {
  if (s === 'open') return styles.statusOpen;
  if (s === 'pending') return styles.statusPending;
  return styles.statusClosed;
}

// ─────────────────────────────────────────────────────────────
// Ticket Details Content (shared between Drawer instances)
// ─────────────────────────────────────────────────────────────
interface DetailsContentProps {
  ticket: SupportTicket;
  token: string;
  onUpdated: (updated: SupportTicket) => void;
}

function TicketDetailsContent({ ticket, token, onUpdated }: DetailsContentProps) {
  const [changingStatus, setChangingStatus] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as 'open' | 'pending' | 'closed';
    if (newStatus === ticket.status) return;
    setChangingStatus(true);
    try {
      await adminChangeStatus(token, ticket.id, newStatus);
      onUpdated({ ...ticket, status: newStatus });
    } catch (err: any) {
      alert(err.message || 'فشل تغيير الحالة');
    } finally { setChangingStatus(false); }
  };

  const handleSelfAssign = async () => {
    setAssigning(true);
    try {
      const updated = await adminAssignTicket(token, ticket.id, 'me');
      onUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'فشل التعيين');
    } finally { setAssigning(false); }
  };

  const handleUnassign = async () => {
    setAssigning(true);
    try {
      const updated = await adminAssignTicket(token, ticket.id, null);
      onUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'فشل إلغاء التعيين');
    } finally { setAssigning(false); }
  };

  return (
    <>
      {/* Customer Info */}
      <div className={styles.detailsSection}>
        <div className={styles.sectionTitle}>بيانات العميل</div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>الاسم</span>
          <span className={styles.detailValue}>{ticket.user_name || '—'}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>البريد الإلكتروني</span>
          <span className={styles.detailValue} dir="ltr" style={{ textAlign: 'right' }}>
            {ticket.user_email || '—'}
          </span>
        </div>
      </div>

      {/* Ticket Info */}
      <div className={styles.detailsSection}>
        <div className={styles.sectionTitle}>معلومات التذكرة</div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>رقم التذكرة</span>
          <span className={styles.detailValue} dir="ltr" style={{ fontFamily: 'monospace', textAlign: 'right' }}>
            {ticket.ticket_number}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>تاريخ الإنشاء</span>
          <span className={styles.detailValue}>
            {new Date(ticket.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>آخر تحديث</span>
          <span className={styles.detailValue}>{relativeTime(ticket.updated_at)}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>الحالة الحالية</span>
          <span className={`${styles.statusBadge} ${statusClass(ticket.status)}`} style={{ width: 'fit-content' }}>
            {statusLabel(ticket.status)}
          </span>
        </div>
      </div>

      {/* Assignment */}
      <div className={styles.detailsSection}>
        <div className={styles.sectionTitle}>التعيين</div>
        {ticket.assigned_admin_name ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className={styles.assignBox}>
              <div className={styles.assignAvatar}>{initials(ticket.assigned_admin_name)}</div>
              <div className={styles.assignName}>{ticket.assigned_admin_name}</div>
            </div>
            <button className={styles.assignBtn} onClick={handleUnassign} disabled={assigning} aria-label="إلغاء التعيين">
              {assigning ? <span className={styles.spinner} /> : 'إلغاء التعيين'}
            </button>
          </div>
        ) : (
          <button className={styles.assignBtn} onClick={handleSelfAssign} disabled={assigning} aria-label="تعيين لي">
            {assigning ? <span className={styles.spinner} /> : <Ico.User />}
            تعيين لي
          </button>
        )}
      </div>

      {/* Status */}
      <div className={styles.detailsSection}>
        <div className={styles.sectionTitle}>تغيير الحالة</div>
        <select
          className={styles.statusSelect}
          value={ticket.status}
          onChange={handleStatusChange}
          disabled={changingStatus}
          dir="rtl"
          aria-label="تغيير حالة التذكرة"
        >
          <option value="open">مفتوحة</option>
          <option value="pending">بانتظار الرد</option>
          <option value="closed">مغلقة</option>
        </select>
      </div>

      {/* Actions */}
      <div className={styles.detailsSection}>
        <div className={styles.sectionTitle}>الإجراءات</div>
        {ticket.status !== 'closed' ? (
          <button
            className={`${styles.actionBtn} ${styles.btnDanger}`}
            onClick={() => {
              setChangingStatus(true);
              adminChangeStatus(token, ticket.id, 'closed')
                .then(() => onUpdated({ ...ticket, status: 'closed' }))
                .catch(e => alert(e.message))
                .finally(() => setChangingStatus(false));
            }}
            disabled={changingStatus}
            aria-label="إغلاق التذكرة"
          >
            {changingStatus ? <span className={styles.spinner} /> : null}
            إغلاق التذكرة
          </button>
        ) : (
          <button
            className={`${styles.actionBtn} ${styles.btnSuccess}`}
            onClick={() => {
              setChangingStatus(true);
              adminChangeStatus(token, ticket.id, 'open')
                .then(() => onUpdated({ ...ticket, status: 'open' }))
                .catch(e => alert(e.message))
                .finally(() => setChangingStatus(false));
            }}
            disabled={changingStatus}
            aria-label="إعادة فتح التذكرة"
          >
            {changingStatus ? <span className={styles.spinner} /> : null}
            إعادة فتح التذكرة
          </button>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Details Drawer — Side (Desktop) + Bottom Sheet (Mobile)
// ─────────────────────────────────────────────────────────────
interface DrawerProps {
  ticket: SupportTicket;
  token: string;
  onUpdated: (updated: SupportTicket) => void;
  onClose: () => void;
}

function DetailsDrawer({ ticket, token, onUpdated, onClose }: DrawerProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop — click to close */}
      <div
        className={styles.drawerBackdrop}
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      {/* Drawer Sheet */}
      <div
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="تفاصيل التذكرة"
      >
        {/* Handle (mobile only, visible via CSS) */}
        <div className={styles.drawerHandle} />

        {/* Header */}
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>تفاصيل التذكرة</span>
          <button
            className={styles.drawerCloseBtn}
            onClick={onClose}
            aria-label="إغلاق"
          >
            <Ico.X />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className={styles.drawerBody}>
          <TicketDetailsContent ticket={ticket} token={token} onUpdated={onUpdated} />
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// AdminChat — Middle Pane
// ─────────────────────────────────────────────────────────────
interface ChatProps {
  ticket: SupportTicket;
  token: string;
  onUpdated: (t: SupportTicket) => void;
  onCloseMobile: () => void;
  onOpenDetails: () => void;
}

function AdminChat({ ticket, token, onUpdated, onCloseMobile, onOpenDetails }: ChatProps) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [ticket.messages]);

  // Group messages by date → sender
  const groups = useMemo(() => {
    if (!ticket.messages) return [];
    const grouped: any[] = [];
    let currentGroup: any = null;
    let currentDateKey = '';

    for (const msg of ticket.messages) {
      const dateKey = new Date(msg.created_at).toDateString();
      const isUser = msg.sender_type === 'user';
      if (!currentGroup || currentGroup.isUser !== isUser || currentDateKey !== dateKey) {
        if (currentGroup) {
          currentGroup.messages[currentGroup.messages.length - 1].isLastInGroup = true;
        }
        currentDateKey = dateKey;
        currentGroup = {
          dateKey,
          dateLabel: formatDate(msg.created_at),
          isUser,
          senderName: msg.sender_name,
          messages: [{ ...msg, isFirstInGroup: true, isConsecutive: false }],
        };
        grouped.push(currentGroup);
      } else {
        currentGroup.messages.push({ ...msg, isFirstInGroup: false, isConsecutive: true });
      }
    }
    if (currentGroup && currentGroup.messages.length > 0) {
      currentGroup.messages[currentGroup.messages.length - 1].isLastInGroup = true;
    }

    // Reorganize into date groups
    const finalGroups: { dateLabel: string; msgGroups: typeof grouped }[] = [];
    let curD = '';
    for (const g of grouped) {
      if (g.dateKey !== curD) {
        curD = g.dateKey;
        finalGroups.push({ dateLabel: g.dateLabel, msgGroups: [g] });
      } else {
        finalGroups[finalGroups.length - 1].msgGroups.push(g);
      }
    }
    return finalGroups;
  }, [ticket.messages]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    setSendErr('');
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleSend = async () => {
    const text = replyText.trim();
    if (!text || sending) return;
    setSending(true); setSendErr(''); setReplyText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    try {
      const newMsg = await adminReplyTicket(token, ticket.id, text);
      onUpdated({
        ...ticket,
        status: ticket.status === 'open' ? 'pending' : ticket.status,
        messages: [...(ticket.messages || []), newMsg],
        last_message: newMsg.message,
        last_message_time: newMsg.created_at,
      });
      setTimeout(() => { if (textareaRef.current) textareaRef.current.focus(); }, 10);
    } catch (e: any) {
      setSendErr(e.message || 'فشل الإرسال'); setReplyText(text);
    } finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isClosed = ticket.status === 'closed';

  return (
    <div className={styles.chatCol}>
      {/* ── Conversation Header ── */}
      <div className={styles.chatHeader}>
        {/* Mobile Back */}
        <button
          className={styles.mobileBackBtn}
          onClick={onCloseMobile}
          aria-label="العودة للقائمة"
        >
          <Ico.Back />
        </button>

        <div className={styles.chatHeaderLeft}>
          <div className={styles.chatTitleRow}>
            <h2 className={styles.chatTitle}>{ticket.subject}</h2>
            <span className={`${styles.statusBadge} ${statusClass(ticket.status)}`}>
              {statusLabel(ticket.status)}
            </span>
          </div>
          <p className={styles.chatSub}>
            <span className={styles.chatSubId} dir="ltr">{ticket.ticket_number}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{ticket.user_name}</span>
            {ticket.user_email && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span dir="ltr" style={{ fontSize: 11 }}>{ticket.user_email}</span>
              </>
            )}
          </p>
        </div>

        {/* Details button — always visible */}
        <button
          className={styles.infoBtn}
          onClick={onOpenDetails}
          aria-label="تفاصيل التذكرة"
          data-tooltip="تفاصيل التذكرة"
        >
          <Ico.Info />
        </button>
      </div>

      {/* ── Messages ── */}
      <div className={styles.chatBody} id="admin-chat-body">
        {groups.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'var(--ai-text-muted)',
            fontSize: 13,
            marginTop: 48,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}>
            <Ico.Inbox />
            <span>لا توجد رسائل بعد</span>
          </div>
        )}

        {groups.map((dateGroup, dIdx) => (
          <React.Fragment key={dIdx}>
            <div className={styles.dateSep}>
              <div className={styles.dateSepLine} />
              <div className={styles.dateSepLabel}>{dateGroup.dateLabel}</div>
              <div className={styles.dateSepLine} />
            </div>

            {dateGroup.msgGroups.map((g, gIdx) => (
              <div
                key={gIdx}
                className={`${styles.msgGroup} ${g.isUser ? styles.msgUser : styles.msgAdmin} ${g.isConsecutive ? styles.msgGroupConsecutive : ''}`}
              >
                {g.messages.map((msg: any, mIdx: number) => (
                  <div
                    key={msg.id}
                    className={`${styles.bubble} ${g.isUser ? styles.bubbleUser : styles.bubbleAdmin}`}
                  >
                    {msg.message}
                  </div>
                ))}
                <div className={styles.msgMeta}>
                  <span className={styles.msgSenderName}>{g.senderName}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span className={styles.msgTime}>
                    {formatTime(g.messages[g.messages.length - 1].created_at)}
                  </span>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}

        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* ── Composer / Closed Notice ── */}
      <div className={styles.chatFooter}>
        {isClosed ? (
          <div className={styles.composerWrap}>
            <div className={styles.closedNotice}>
              <Ico.Lock />
              <span>هذه التذكرة مغلقة — لا يمكن إرسال رسائل جديدة</span>
            </div>
          </div>
        ) : (
          <div className={styles.composerWrap}>
            <div className={styles.composerBox}>
              <textarea
                ref={textareaRef}
                className={styles.composerInput}
                rows={1}
                placeholder="اكتب ردك للعميل..."
                value={replyText}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                disabled={sending}
                dir="auto"
                aria-label="كتابة رد"
              />
              <div className={styles.composerActions}>
                <button
                  className={`${styles.sendBtn} ${replyText.trim() && !sending ? styles.sendBtnActive : ''}`}
                  onClick={handleSend}
                  disabled={!replyText.trim() || sending}
                  aria-label="إرسال الرد"
                >
                  {sending
                    ? <span className={styles.spinner} style={{ width: 14, height: 14 }} />
                    : <Ico.Send />
                  }
                </button>
              </div>
            </div>
            {sendErr && <p className={styles.sendError}>{sendErr}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main: AdminSupportInbox
// ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 15;

export default function AdminSupportInbox() {
  const { token } = useApp();
  const [stats, setStats] = useState<AdminTicketStats | null>(null);
  const [listData, setListData] = useState<PaginatedTickets | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listErr, setListErr] = useState('');

  // Active ticket
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  // Mobile navigation
  const [mobileView, setMobileView] = useState<'inbox' | 'chat'>('inbox');
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Load stats
  const loadStats = useCallback(async () => {
    if (!token) return;
    try { const s = await adminFetchStats(token); setStats(s); } catch { /* non-critical */ }
  }, [token]);

  // Load ticket list
  const loadList = useCallback(async () => {
    if (!token) return;
    setListLoading(true); setListErr('');
    try {
      const data = await adminFetchTickets(token, {
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setListData(data);
    } catch (e: any) {
      setListErr(e.message || 'خطأ في التحميل');
    } finally { setListLoading(false); }
  }, [token, debouncedSearch, statusFilter, page]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadList(); }, [loadList]);

  // Open ticket
  const openTicket = async (id: number) => {
    if (!token) return;
    setTicketLoading(true);
    setMobileView('chat');
    try {
      const t = await adminFetchTicket(token, id);
      setActiveTicket(t);
      setListData(prev => prev ? {
        ...prev,
        results: prev.results.map(rt => rt.id === t.id ? { ...rt, unread_count: 0 } : rt),
      } : prev);
    } finally { setTicketLoading(false); }
  };

  // After ticket update
  const handleTicketUpdated = (updated: SupportTicket) => {
    setActiveTicket(updated);
    setListData(prev => prev ? {
      ...prev,
      results: prev.results.map(t => t.id === updated.id ? { ...t, ...updated } : t),
    } : prev);
    loadStats();
  };

  const totalPages = listData ? Math.ceil(listData.count / PAGE_SIZE) : 1;

  const statusChips = [
    { key: '', label: 'الكل' },
    { key: 'open', label: 'مفتوحة' },
    { key: 'pending', label: 'انتظار' },
    { key: 'closed', label: 'مغلقة' },
  ];

  return (
    <div className={styles.pageShell} dir="rtl">

      {/* ── Page Header ── */}
      <div className={styles.headerRow}>
        <div className={styles.headerInfo}>
          <h1 className={styles.pageTitle}>إدارة الدعم الفني</h1>
          <p className={styles.pageSub}>إدارة محادثات وطلبات دعم العملاء</p>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={() => { loadList(); loadStats(); }}
          aria-label="تحديث البيانات"
        >
          <Ico.Refresh />
          <span className={styles.refreshBtnLabel}>تحديث</span>
        </button>
      </div>

      {/* ── Summary Bar ── */}
      <div className={styles.summaryBar} role="region" aria-label="إحصائيات التذاكر">
        <div className={styles.summaryItem}>
          <span className={`${styles.summaryCount} ${styles.countTotal}`}>
            {stats?.total ?? '—'}
          </span>
          <span className={styles.summaryLabel}>الإجمالي</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={`${styles.summaryCount} ${styles.countOpen}`}>
            {stats?.open ?? '—'}
          </span>
          <span className={styles.summaryLabel}>مفتوحة</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={`${styles.summaryCount} ${styles.countPending}`}>
            {stats?.pending ?? '—'}
          </span>
          <span className={styles.summaryLabel}>انتظار</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={`${styles.summaryCount} ${styles.countClosed}`}>
            {stats?.closed ?? '—'}
          </span>
          <span className={styles.summaryLabel}>مغلقة</span>
        </div>
      </div>

      {/* ── WORKSPACE ── */}
      <div className={`${styles.workspace} ${mobileView === 'chat' ? styles.mobileShowChat : styles.mobileShowInbox}`}>

        {/* ── LEFT: INBOX ── */}
        <div className={styles.inboxCol}>

          {/* Sticky Inbox Header */}
          <div className={styles.inboxHeader}>
            <div className={styles.inboxTitleRow}>
              <span className={styles.inboxTitle}>صندوق الوارد</span>
              <span className={styles.inboxTitleCount}>
                {listData ? listData.count : '0'} تذكرة
              </span>
            </div>

            {/* Search */}
            <div className={styles.searchBox}>
              <span className={styles.searchIcon} aria-hidden="true"><Ico.Search /></span>
              <input
                className={styles.searchInput}
                placeholder="ابحث في التذاكر..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                dir="auto"
                aria-label="البحث في التذاكر"
              />
            </div>

            {/* Segmented Filters */}
            <div className={styles.inboxFilters} role="group" aria-label="تصفية التذاكر">
              {statusChips.map(c => (
                <button
                  key={c.key}
                  className={`${styles.filterChip} ${statusFilter === c.key ? styles.filterChipActive : ''}`}
                  onClick={() => { setStatusFilter(c.key); setPage(1); }}
                  aria-pressed={statusFilter === c.key}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Ticket List */}
          <div className={styles.inboxList} role="list" aria-label="قائمة التذاكر">

            {/* Loading Skeleton */}
            {listLoading && (
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    style={{
                      padding: '13px 16px',
                      borderBottom: '1px solid var(--ai-divider)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 9,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div className={styles.skeletonLine} style={{ width: '30%' }} />
                      <div className={styles.skeletonLine} style={{ width: '15%' }} />
                    </div>
                    <div className={styles.skeletonLine} style={{ width: '75%', height: 14 }} />
                    <div className={styles.skeletonLine} style={{ width: '50%', height: 11 }} />
                    <div className={styles.skeletonLine} style={{ width: '35%', height: 11 }} />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!listLoading && listErr && (
              <div className={styles.inlineError}>
                <p className={styles.inlineErrorMsg}>{listErr}</p>
                <button onClick={loadList} className={styles.retryBtn}>
                  <Ico.Retry /> إعادة المحاولة
                </button>
              </div>
            )}

            {/* Empty */}
            {!listLoading && !listErr && listData?.results.length === 0 && (
              <div style={{
                padding: 40,
                textAlign: 'center',
                color: 'var(--ai-text-muted)',
                fontSize: 13,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}>
                <div style={{ opacity: 0.35, marginBottom: 4 }}><Ico.Inbox /></div>
                <span style={{ fontWeight: 600, color: 'var(--ai-text-sec)' }}>
                  {search || statusFilter ? 'لا توجد نتائج' : 'لا توجد تذاكر دعم'}
                </span>
                <span style={{ fontSize: 12, maxWidth: 200, lineHeight: 1.6 }}>
                  {search ? 'جرّب كلمة بحث مختلفة' : statusFilter ? 'جرّب تصفية أخرى' : 'ستظهر التذاكر الجديدة هنا'}
                </span>
              </div>
            )}

            {/* Ticket Rows */}
            {!listLoading && listData?.results.map(t => {
              const isActive = activeTicket?.id === t.id;
              const isUnread = t.unread_count > 0;
              const bClass = t.status === 'open' ? styles.bOpen : t.status === 'pending' ? styles.bPending : styles.bClosed;

              return (
                <div
                  key={t.id}
                  className={`${styles.ticketRow} ${isActive ? styles.ticketRowActive : ''}`}
                  onClick={() => openTicket(t.id)}
                  role="listitem"
                  aria-selected={isActive}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTicket(t.id); } }}
                >
                  {/* Active Indicator */}
                  {isActive && <div className={styles.ticketRowIndicator} aria-hidden="true" />}

                  {/* Top row: ticket ID + time */}
                  <div className={styles.rowTop}>
                    <span className={styles.rowId} dir="ltr">{t.ticket_number}</span>
                    <span className={styles.rowTime}>
                      {relativeTime(t.last_message_time || t.updated_at)}
                    </span>
                  </div>

                  {/* Subject */}
                  <h3 className={styles.rowSubj} style={{ fontWeight: isUnread ? 700 : 600 }}>
                    {t.subject}
                  </h3>

                  {/* Client */}
                  <div className={styles.rowClient}>{t.user_name}</div>

                  {/* Bottom row: status + unread */}
                  <div className={styles.rowBottom}>
                    <span className={`${styles.badgeSmall} ${bClass}`}>
                      {t.status === 'open' ? 'مفتوحة' : t.status === 'pending' ? 'انتظار' : 'مغلقة'}
                    </span>
                    {isUnread && (
                      <span className={styles.unreadBadge} aria-label={`${t.unread_count} رسائل غير مقروءة`}>
                        {t.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {listData && totalPages > 1 && (
            <div className={styles.pagination} role="navigation" aria-label="تصفح الصفحات">
              <button
                className={styles.pageBtn}
                disabled={!listData.previous}
                onClick={() => setPage(p => p - 1)}
                aria-label="الصفحة السابقة"
              >
                <Ico.ChevRight />
              </button>
              <span className={styles.pageInfo}>{page} / {totalPages}</span>
              <button
                className={styles.pageBtn}
                disabled={!listData.next}
                onClick={() => setPage(p => p + 1)}
                aria-label="الصفحة التالية"
              >
                <Ico.ChevLeft />
              </button>
            </div>
          )}
        </div>

        {/* ── MIDDLE: EMPTY PLACEHOLDER ── */}
        {!activeTicket && !ticketLoading && (
          <div className={styles.chatCol}>
            <div className={styles.emptyChat}>
              <div className={styles.emptyChatIcon}><Ico.Inbox /></div>
              <h3 className={styles.emptyChatTitle}>اختر تذكرة لعرض المحادثة</h3>
              <p className={styles.emptyChatSub}>
                حدد إحدى التذاكر من صندوق الوارد لعرض الرسائل والتفاصيل.
              </p>
            </div>
          </div>
        )}

        {/* ── MIDDLE: LOADING ── */}
        {ticketLoading && (
          <div className={styles.chatCol} style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
            <span className={styles.spinner} style={{ width: 26, height: 26, borderWidth: 3 }} />
          </div>
        )}

        {/* ── MIDDLE: ACTIVE CHAT ── */}
        {activeTicket && !ticketLoading && (
          <AdminChat
            ticket={activeTicket}
            token={token!}
            onUpdated={handleTicketUpdated}
            onCloseMobile={() => { setMobileView('inbox'); setIsDetailsDrawerOpen(false); }}
            onOpenDetails={() => setIsDetailsDrawerOpen(true)}
          />
        )}
      </div>

      {/* ── DETAILS DRAWER (Side on Desktop, Bottom Sheet on Mobile) ── */}
      {activeTicket && isDetailsDrawerOpen && (
        <DetailsDrawer
          ticket={activeTicket}
          token={token!}
          onUpdated={handleTicketUpdated}
          onClose={() => setIsDetailsDrawerOpen(false)}
        />
      )}
    </div>
  );
}
