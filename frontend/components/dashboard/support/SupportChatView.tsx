'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchTicket,
  replyToTicket,
  SupportTicket,
  TicketMessage,
} from '@/lib/support-api';
import styles from './chat.module.css';

// ─── Icons ─────────────────────────────────────────────────────
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconSend = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconSupport = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconDoubleCheck = () => (
  <svg width="14" height="11" viewBox="0 0 28 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 6 5 10 13 2" />
    <polyline points="9 6 13 10 21 2" />
  </svg>
);

// ─── Helpers ────────────────────────────────────────────────────
function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'اليوم';
    if (date.toDateString() === yesterday.toDateString()) return 'أمس';
    return date.toLocaleDateString('ar-SA', { weekday: 'long', month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function getDateKey(dateStr: string): string {
  return new Date(dateStr).toDateString();
}

function getInitials(name: string): string {
  const parts = name?.split(' ').filter(Boolean) ?? [];
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name ?? '??').substring(0, 2).toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    open:    { cls: styles.badgeOpen,    label: 'مفتوحة' },
    pending: { cls: styles.badgePending, label: 'بانتظار ردك' },
    closed:  { cls: styles.badgeClosed,  label: 'مغلقة' },
  };
  const s = map[status] || map.open;
  return <span className={`${styles.badge} ${s.cls}`}>{s.label}</span>;
}

// ─── Skeleton ────────────────────────────────────────────────────
function SkeletonBubble({ isUser }: { isUser: boolean }) {
  return (
    <div className={`${styles.msgGroup} ${isUser ? styles.msgGroupUser : styles.msgGroupSupport}`}>
      <div className={`${styles.skeletonBubble} ${isUser ? styles.skeletonRight : styles.skeletonLeft}`} />
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────
interface Props {
  ticketId: number;
  token: string;
  onBack: () => void;
  onNewTicket?: () => void;
}

// ─── Component ──────────────────────────────────────────────────
export default function SupportChatView({ ticketId, token, onBack, onNewTicket }: Props) {
  const [ticket, setTicket]     = useState<SupportTicket | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending]   = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadTicket = useCallback(async () => {
    try {
      const data = await fetchTicket(token, ticketId);
      setTicket(data);
    } catch {
      setError('تعذّر تحميل المحادثة. يرجى المحاولة مجدداً.');
    } finally {
      setLoading(false);
    }
  }, [token, ticketId]);

  useEffect(() => { loadTicket(); }, [loadTicket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    setSendError('');
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const handleSend = async () => {
    if (!replyText.trim() || sending || !ticket) return;
    if (ticket.status === 'closed') {
      setSendError('هذه التذكرة مغلقة.');
      return;
    }
    setSending(true);
    setSendError('');
    const text = replyText.trim();
    setReplyText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    try {
      const newMsg = await replyToTicket(token, ticketId, text);
      setTicket(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: prev.status === 'pending' ? 'open' : prev.status,
          messages: [...(prev.messages || []), newMsg],
          last_message: newMsg.message,
          last_message_time: newMsg.created_at,
        };
      });
    } catch (err: any) {
      setSendError(err.message || 'فشل الإرسال. يرجى المحاولة مجدداً.');
      setReplyText(text);
    } finally {
      setSending(false);
      setTimeout(() => { if (textareaRef.current) textareaRef.current.focus(); }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date, then mark consecutive sender groups
  type MsgWithGroupInfo = TicketMessage & {
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
  };
  type DateGroup = {
    dateKey: string;
    dateLabel: string;
    messages: MsgWithGroupInfo[];
  };

  const groupedMessages = React.useMemo((): DateGroup[] => {
    if (!ticket?.messages) return [];
    const dateGroups: DateGroup[] = [];
    let currentDateKey = '';

    for (const msg of ticket.messages) {
      const dk = getDateKey(msg.created_at);
      if (dk !== currentDateKey) {
        currentDateKey = dk;
        dateGroups.push({ dateKey: dk, dateLabel: formatDate(msg.created_at), messages: [] });
      }
      dateGroups[dateGroups.length - 1].messages.push({ ...msg, isFirstInGroup: false, isLastInGroup: false });
    }

    // Mark first/last within consecutive same-sender sequences
    for (const dg of dateGroups) {
      for (let i = 0; i < dg.messages.length; i++) {
        const prev = dg.messages[i - 1];
        const next = dg.messages[i + 1];
        const cur  = dg.messages[i];
        cur.isFirstInGroup = !prev || prev.sender_type !== cur.sender_type;
        cur.isLastInGroup  = !next || next.sender_type !== cur.sender_type;
      }
    }
    return dateGroups;
  }, [ticket?.messages]);

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.chatShell} dir="rtl">
        {/* Header skeleton */}
        <div className={styles.chatHeader}>
          <button className={styles.backBtn} onClick={onBack} aria-label="العودة">
            <IconBack />
            <span>التذاكر</span>
          </button>
          <div className={styles.headerCenter}>
            <div className={styles.skeletonLine} style={{ width: 180, height: 16, marginBottom: 6 }} />
            <div className={styles.skeletonLine} style={{ width: 100, height: 11 }} />
          </div>
          <div style={{ width: 70 }} />
        </div>
        {/* Body skeleton */}
        <div className={styles.chatBody}>
          <SkeletonBubble isUser={false} />
          <SkeletonBubble isUser={true} />
          <SkeletonBubble isUser={false} />
          <SkeletonBubble isUser={true} />
        </div>
        <div className={styles.chatFooter} style={{ opacity: 0.4 }}>
          <div className={styles.composerWrap}>
            <div className={styles.composerInput} style={{ height: 44, borderRadius: 14 }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (error || !ticket) {
    return (
      <div className={styles.chatShell} dir="rtl">
        <div className={styles.chatHeader}>
          <button className={styles.backBtn} onClick={onBack} aria-label="العودة">
            <IconBack /><span>التذاكر</span>
          </button>
        </div>
        <div className={styles.chatBody} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>!</div>
            <p className={styles.errorTitle}>تعذّر تحميل المحادثة</p>
            <p className={styles.errorSub}>{error}</p>
            <button className={styles.retryBtn} onClick={loadTicket}>إعادة المحاولة</button>
          </div>
        </div>
      </div>
    );
  }

  const isClosed     = ticket.status === 'closed';
  const assignedName = ticket.assigned_admin_name || 'فريق الدعم';
  const hasMessages  = (ticket.messages?.length ?? 0) > 0;

  return (
    <div className={styles.chatShell} dir="rtl">

      {/* ── Header ───────────────────────────────────── */}
      <div className={styles.chatHeader}>
        <button id="btn-back-to-tickets" className={styles.backBtn} onClick={onBack} aria-label="العودة للتذاكر">
          <IconBack /><span>التذاكر</span>
        </button>

        <div className={styles.headerCenter}>
          <div className={styles.headerSubject}>{ticket.subject}</div>
          <div className={styles.headerMeta}>
            <span className={styles.headerTicketNum}>{ticket.ticket_number}</span>
            <span className={styles.headerDot} />
            <span className={styles.headerAssigned}>{assignedName}</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {/* ── Messages Body ────────────────────────────── */}
      <div className={styles.chatBody} id="chat-messages-body">

        {/* Ticket description banner */}
        <div className={styles.descBanner}>
          <div className={styles.descBannerIcon}><IconSupport /></div>
          <div className={styles.descBannerText}>
            <span className={styles.descBannerLabel}>وصف المشكلة</span>
            <p className={styles.descBannerContent}>{ticket.description}</p>
          </div>
        </div>

        {!hasMessages && (
          <div className={styles.emptyMsgs}>لا توجد رسائل بعد. ابدأ بكتابة ردك أدناه.</div>
        )}

        {groupedMessages.map(group => (
          <React.Fragment key={group.dateKey}>
            {/* Date separator */}
            <div className={styles.dateSep}>
              <span className={styles.dateSepLine} />
              <span className={styles.dateSepLabel}>{group.dateLabel}</span>
              <span className={styles.dateSepLine} />
            </div>

            {group.messages.map(msg => {
              const isUser = msg.sender_type === 'user';
              const showAvatar = msg.isFirstInGroup;

              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={`
                    ${styles.msgGroup}
                    ${isUser ? styles.msgGroupUser : styles.msgGroupSupport}
                    ${msg.isFirstInGroup ? styles.firstInGroup : ''}
                    ${msg.isLastInGroup  ? styles.lastInGroup  : ''}
                  `}
                >
                  {/* Avatar — only on first in group */}
                  <div className={styles.avatarSlot}>
                    {showAvatar && (
                      <div className={`${styles.avatar} ${isUser ? styles.avatarUser : styles.avatarSupport}`}>
                        {isUser ? getInitials(msg.sender_name) : <IconSupport />}
                      </div>
                    )}
                  </div>

                    {/* Bubble stack */}
                  <div className={styles.bubbleStack}>
                    {msg.isFirstInGroup && (
                      <div className={`${styles.senderLabel} ${isUser ? styles.senderLabelUser : styles.senderLabelSupport}`}>
                        {isUser ? 'أنت' : 'فريق الدعم'}
                      </div>
                    )}
                    <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleSupport}`}>
                      <p className={styles.bubbleText}>{msg.message}</p>
                    </div>
                    {/* Meta — below bubble */}
                    {msg.isLastInGroup && (
                      <div className={`${styles.msgMeta} ${isUser ? styles.msgMetaUser : styles.msgMetaSupport}`}>
                        <span className={styles.msgTime}>{formatTime(msg.created_at)}</span>
                        {isUser && (
                          <span className={`${styles.readReceipt} ${msg.is_read ? styles.readReceiptRead : ''}`}>
                            {msg.is_read ? <IconDoubleCheck /> : <IconCheck />}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}

        <div ref={bottomRef} style={{ height: 8 }} />
      </div>

      {/* ── Footer / Composer ────────────────────────── */}
      <div className={styles.chatFooter}>
        {isClosed ? (
          <div className={styles.closedState}>
            <div className={styles.closedIcon}><IconLock /></div>
            <p className={styles.closedTitle}>تم إغلاق هذه التذكرة</p>
            <p className={styles.closedSub}>إذا احتجت مساعدة إضافية، يمكنك إنشاء طلب دعم جديد.</p>
            {onNewTicket && (
              <button className={styles.newTicketBtn} onClick={onNewTicket}>
                <IconPlus />
                إنشاء طلب جديد
              </button>
            )}
          </div>
        ) : (
          <div className={styles.composerWrap}>
            <div className={`${styles.composerBox} ${replyText ? styles.composerBoxActive : ''}`}>
              <textarea
                ref={textareaRef}
                id="chat-reply-input"
                className={styles.composerInput}
                rows={1}
                placeholder="اكتب رسالتك هنا..."
                value={replyText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                disabled={sending}
                dir="auto"
              />
              <div className={styles.composerActions}>
                <button
                  id="btn-send-reply"
                  className={`${styles.sendBtn} ${replyText.trim() ? styles.sendBtnActive : ''}`}
                  onClick={handleSend}
                  disabled={!replyText.trim() || sending}
                  aria-label="إرسال"
                >
                  {sending
                    ? <span className={styles.spinner} />
                    : <IconSend />
                  }
                </button>
              </div>
            </div>
            {sendError && <p className={styles.sendError}>{sendError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
