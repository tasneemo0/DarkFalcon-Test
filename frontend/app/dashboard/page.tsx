'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useT } from '@/lib/i18n';
import styles from './dashboard.module.css';
import ClientDashboardOverview from '@/components/dashboard/ClientDashboardOverview';
import AdminDashboardOverview from '@/components/dashboard/AdminDashboardOverview';
import AdminRolesManager from '@/components/dashboard/AdminRolesManager';
import AdminSessionsManager from '@/components/dashboard/AdminSessionsManager';
import AdminUsersManager from '@/components/dashboard/AdminUsersManager';
import SubscriptionPlansManager from '@/components/dashboard/SubscriptionPlansManager';
import UserProfileDashboard from '@/components/dashboard/UserProfileDashboard';
import { UserPlanCard } from '@/components/dashboard/UserPlanCard';
import { UserCurrentPlanOverview } from '@/components/dashboard/UserCurrentPlanOverview';
import { AdminPaymentsManager } from '@/components/dashboard/AdminPaymentsManager';
import SupportCenter from '@/components/dashboard/support/SupportCenter';
import AdminSupportInbox from '@/components/dashboard/support/AdminSupportInbox';
import { API_BASE_URL } from '@/lib/api';
import { PremiumStatCard, PremiumCardWrapper } from '@/components/dashboard/PremiumCard';
import { PremiumButton } from '@/components/dashboard/PremiumButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Bot, ClipboardList, MessageCircle, MessageSquare, KeyRound, FileText, Eye, Save, HelpCircle, Settings, Plus, Trash2, Pencil, ToggleLeft, ToggleRight, Phone, Smartphone, AlertCircle, ArrowUp, ArrowDown, Power, PowerOff, Star, Zap, Shield, Crown, CheckCircle, XCircle, Check, X, Gem, Package, PlusCircle, Medal, Search, FileDown, FileUp, Copy, ChevronDown, ChevronUp, CheckCircle2, Users, Coins, TrendingUp, Sparkles, Megaphone, Link as LinkIcon } from 'lucide-react';

declare const FB: any;
declare global {
  interface Window {
    fbAsyncInit: () => void;
  }
}

const sidebarItems = [
  { key: 'overview', icon: 'grid', labelAr: 'الرئيسية', labelEn: 'Overview' },
  { key: 'numbers', icon: 'phone', labelAr: 'أجهزتي (الواتساب)', labelEn: 'My Devices' },
  { key: 'apiKeys', icon: 'key', labelAr: 'توثيق API', labelEn: 'API Documentation' },
  { key: 'webhooks', icon: 'webhook', labelAr: 'الويب هوك', labelEn: 'Webhooks' },
  { key: 'aiRules', icon: 'bot', labelAr: 'المجيب التلقائي الذكي', labelEn: 'Smart AI & FAQ' },
  { key: 'interactive_bot', icon: 'message', labelAr: 'البوت التفاعلي', labelEn: 'Interactive Bot' },
  { key: 'chatbot', icon: 'message', labelAr: 'سجل حجز البوت', labelEn: 'Booking Chatbot Log' },
  { key: 'logs', icon: 'template', labelAr: 'سجل العمليات', labelEn: 'Operations Logs' },
  { key: 'billing', icon: 'template', labelAr: 'الاشتراكات والفوترة', labelEn: 'Billing & Plans' },
  { key: 'settings', icon: 'settings', labelAr: 'إعدادات الحساب', labelEn: 'Account Settings' },
  { key: 'support', icon: 'message', labelAr: 'الدعم الفني', labelEn: 'Support Center' },
  { key: 'profile', icon: 'grid', labelAr: 'الملف الشخصي', labelEn: 'My Profile' },
];

const adminSidebarItems = [
  { key: 'admin_overview', icon: 'grid', labelAr: 'إحصائيات المنصة', labelEn: 'Admin Overview' },
  { key: 'admin_clients', icon: 'grid', labelAr: 'إدارة العملاء', labelEn: 'Client Management' },
  { key: 'admin_sessions', icon: 'phone', labelAr: 'إدارة الجلسات', labelEn: 'Active Sessions' },
  { key: 'admin_plans', icon: 'template', labelAr: 'إدارة الباقات', labelEn: 'Plans Management' },
  { key: 'admin_payments', icon: 'template', labelAr: 'إدارة المدفوعات', labelEn: 'Payment Logs' },
  { key: 'admin_notifications', icon: 'webhook', labelAr: 'إرسال إشعارات جماعية', labelEn: 'Send Notifications' },
  { key: 'admin_tickets', icon: 'message', labelAr: 'تذاكر الدعم الفني', labelEn: 'Support Tickets' },
  { key: 'admin_agreements', icon: 'key', labelAr: 'إدارة الاتفاقيات الشروط', labelEn: 'Consent Agreements' },
  { key: 'admin_settings', icon: 'settings', labelAr: 'إعدادات النظام', labelEn: 'System Settings' },
  { key: 'admin_roles', icon: 'settings', labelAr: 'إدارة الأدمن والرتب', labelEn: 'Admins & Roles' },
];

const iconMap: Record<string, React.ReactNode> = {
  grid: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  message: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  phone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>,
  template: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>,
  key: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>,
  webhook: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 16.98h-5.99c-1.1 0-1.95.68-2.95 1.39C8.07 19.26 7.51 20 6 20c-1.66 0-3-1.34-3-3s1.34-3 3-3" /><path d="M12 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3" /></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  bot: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4M8 15h.01M16 15h.01" /></svg>,
};

export default function DashboardPage() {
  const { locale, theme, toggleTheme, user, setUser, token, setToken, logout } = useApp();
  const router = useRouter();

  const { scrollY } = useScroll();
  const topBarBg = useTransform(scrollY, [0, 50], ["rgba(var(--bg-primary-rgb), 0)", "rgba(var(--bg-primary-rgb), 0.8)"]);
  const topBarBlur = useTransform(scrollY, [0, 50], ["blur(0px)", "blur(12px)"]);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeItem, setActiveItem] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [impersonatingUser, setImpersonatingUser] = useState<string | null>(null);


  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<any | null>(null);
  const [loadingInstances, setLoadingInstances] = useState(true);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Deletion Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);

  const [consentName, setConsentName] = useState('');
  const [consentEmail, setConsentEmail] = useState('');
  const [consentPhone, setConsentPhone] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstanceType, setNewInstanceType] = useState('web_qr');
  const [newPhoneId, setNewPhoneId] = useState('');
  const [newWabaId, setNewWabaId] = useState('');
  const [newAccessToken, setNewAccessToken] = useState('');
  const [deviceConnectionType, setDeviceConnectionType] = useState<'qr' | 'meta' | null>(null);

  // Meta Embedded Signup states
  const [showManualMeta, setShowManualMeta] = useState(false);
  const [metaToken, setMetaToken] = useState('');
  const [metaWabaId, setMetaWabaId] = useState('');
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState('');
  const [metaBusinessId, setMetaBusinessId] = useState('');

  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [whMsgRec, setWhMsgRec] = useState(true);
  const [whMsgSent, setWhMsgSent] = useState(false);
  const [whStatChange, setWhStatChange] = useState(true);
  const [whGroupJoin, setWhGroupJoin] = useState(false);
  const [whGroupLeave, setWhGroupLeave] = useState(false);
  const [whQrUpd, setWhQrUpd] = useState(true);

  const [faqRules, setFaqRules] = useState<any[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newMatchType, setNewMatchType] = useState('contains');
  const [newActionType, setNewActionType] = useState('text');
  const [newActionPayload, setNewActionPayload] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [addingRule, setAddingRule] = useState(false);
  const [botMode, setBotMode] = useState('off');
  const [interactiveBotName, setInteractiveBotName] = useState('');
  const [interactiveTrigger, setInteractiveTrigger] = useState('');
  const [interactiveWelcome, setInteractiveWelcome] = useState('');
  const [interactiveInvalid, setInteractiveInvalid] = useState('');
  const [interactiveFooter, setInteractiveFooter] = useState('');

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [savingBotSettings, setSavingBotSettings] = useState(false);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [aiTestMessage, setAiTestMessage] = useState('');
  const [aiTestResponse, setAiTestResponse] = useState('');
  const [testingAI, setTestingAI] = useState(false);

  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState('');

  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Admin Invoices UI State
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
  const [invoiceDateFilter, setInvoiceDateFilter] = useState('all');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRejectInvoice, setSelectedRejectInvoice] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleReviewInvoice = async (invoiceId: number, action: 'accept' | 'reject', reason?: string) => {
    try {
      const data = await fetchWithAuth(`/api/v1/billing/invoices/${invoiceId}/review/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      });
      if (data.success) {
        setToastMsg(locale === 'ar' ? data.message : 'Invoice updated successfully');
        setInvoices(invoices.map((inv: any) => inv.id === invoiceId ? { ...inv, status: action === 'accept' ? 'paid' : 'rejected' } : inv));
        if (action === 'accept') {
          await fetchClientData();
        }
        if (action === 'reject') {
          setIsRejectModalOpen(false);
          setRejectReason('');
          setSelectedRejectInvoice(null);
        }
      } else {
        setToastMsg(locale === 'ar' ? 'فشل تحديث حالة الفاتورة' : 'Failed to update invoice status');
      }
    } catch (err) {
      setToastMsg(locale === 'ar' ? 'فشل تحديث حالة الفاتورة' : 'Failed to update invoice status');
    }
  };

  const filteredInvoices = invoices.filter((inv: any) => {
    if (invoiceSearch) {
      const search = invoiceSearch.toLowerCase();
      const customer = String(inv.user || '').toLowerCase();
      if (!customer.includes(search) && !String(inv.id).includes(search)) return false;
    }
    if (invoiceStatusFilter !== 'all' && inv.status !== invoiceStatusFilter) return false;

    if (invoiceDateFilter !== 'all') {
      const invDate = new Date(inv.created_at);
      const now = new Date();
      if (invoiceDateFilter === 'today' && invDate.toDateString() !== now.toDateString()) return false;
      if (invoiceDateFilter === 'week') {
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 7);
        if (invDate < lastWeek) return false;
      }
      if (invoiceDateFilter === 'month') {
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        if (invDate < lastMonth) return false;
      }
    }
    return true;
  });

  const totalRevenue = invoices.filter((i: any) => i.status === 'paid').reduce((acc: number, curr: any) => acc + parseFloat(curr.amount || 0), 0);


  const [notifications, setNotifications] = useState<any[]>([]);

  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);
  const [twoStepEnabled, setTwoStepEnabled] = useState(false);
  const [twoStepPassword, setTwoStepPassword] = useState('');
  const [restrictIp, setRestrictIp] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);

  const [tickets, setTickets] = useState<any[]>([]);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState('medium');
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [activeTicket, setActiveTicket] = useState<any | null>(null);

  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminClients, setAdminClients] = useState<any[]>([]);
  const [adminSessions, setAdminSessions] = useState<any[]>([]);
  const [adminPlans, setAdminPlans] = useState<any[]>([]);
  const [adminSignatures, setAdminSignatures] = useState<any[]>([]);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [selectedSubscribePlan, setSelectedSubscribePlan] = useState<any>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [adminPlanName, setAdminPlanName] = useState('');
  const [adminPlanPrice, setAdminPlanPrice] = useState('');
  const [adminPlanDays, setAdminPlanDays] = useState('30');
  const [adminPlanDevices, setAdminPlanDevices] = useState('3');
  const [adminPlanMsgs, setAdminPlanMsgs] = useState('1000');
  const [adminPlanDesc, setAdminPlanDesc] = useState('');
  const [adminPlanUnlimitedMsgs, setAdminPlanUnlimitedMsgs] = useState(false);
  const [adminPlanUnlimitedDevices, setAdminPlanUnlimitedDevices] = useState(false);
  const [adminPlanNumbers, setAdminPlanNumbers] = useState('1');
  const [adminPlanUnlimitedNumbers, setAdminPlanUnlimitedNumbers] = useState(false);
  const [adminPlanFeatures, setAdminPlanFeatures] = useState({
    interactive_bot: false,
    ai_reply: false,
    webhooks: false,
    api_access: false,
    broadcasts: false
  });
  const [adminPlanSupport, setAdminPlanSupport] = useState('regular');
  const [adminPlanIcon, setAdminPlanIcon] = useState('basic');
  const [adminPlanGradient, setAdminPlanGradient] = useState('linear-gradient(135deg, #333333, #000000)');
  const [adminPlanOrder, setAdminPlanOrder] = useState('0');
  const [adminPlanIsActive, setAdminPlanIsActive] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [savingAdminPlan, setSavingAdminPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);
  const [copiedPlanId, setCopiedPlanId] = useState<number | null>(null);

  // Plans page search / filter / sort (must be at top level — Rules of Hooks)
  const [planSearch, setPlanSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [planSort, setPlanSort] = useState<'default' | 'price_asc' | 'price_desc'>('default');

  const [bcTitle, setBcTitle] = useState('');
  const [bcContent, setBcContent] = useState('');
  const [bcType, setBcType] = useState('update');

  const [playgroundEndpoint, setPlaygroundEndpoint] = useState('/api/v1/whatsapp/send/text/');
  const [playgroundBody, setPlaygroundBody] = useState('{\n  "to": "966500000000",\n  "body": "تجربة إرسال رسالة نصية عبر المطورين"\n}');
  const [playgroundResponse, setPlaygroundResponse] = useState('');
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState('python');

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const isFormData = options.body instanceof FormData;
    const headers: any = {
      'Authorization': `Bearer ${token || localStorage.getItem('df-token')}`,
      ...(options.headers || {}),
    };
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    } else if (isFormData) {
      delete headers['Content-Type'];
    }
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (res.status === 401) {
      logout();
      router.push('/auth/login');
      throw new Error('Session expired');
    }
    if (!res.ok) {
      const errText = await res.text();
      try {
        const errJson = JSON.parse(errText);
        throw new Error(errJson.message || errJson.error || errText);
      } catch (e: any) {
        if (e.message && e.message !== 'Unexpected end of JSON input' && e.message !== 'Unexpected token o in JSON at position 1' && !e.message.includes('Unexpected')) {
          throw e;
        }
        throw new Error(errText || 'API request failed');
      }
    }
    if (res.status === 204) return null;
    return res.json();
  };



  const renderPlanIcon = (iconStr: string) => {
    switch (iconStr) {
      case 'vip': return <Crown size={32} color="#fff" />;
      case 'max': return <Zap size={32} color="#fff" />;
      case 'plus': return <PlusCircle size={32} color="#fff" />;
      case 'gold': return <Medal size={32} color="#fff" />;
      case 'silver': return <Shield size={32} color="#fff" />;
      case 'diamond': return <Gem size={32} color="#fff" />;
      case 'basic':
      default: return <Package size={32} color="#fff" />;
    }
  };

  const getPlanGradient = (iconStr: string, customGradient: string) => {
    if (customGradient && customGradient !== 'linear-gradient(135deg, #333333, #000000)') return customGradient;
    switch (iconStr) {
      case 'vip': return 'linear-gradient(135deg, #f59e0b, #ea580c)';
      case 'max': return 'linear-gradient(135deg, #0ea5e9, #0284c7)';
      case 'plus': return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
      case 'gold': return 'linear-gradient(135deg, #eab308, #ca8a04)';
      case 'silver': return 'linear-gradient(135deg, #94a3b8, #64748b)';
      case 'diamond': return 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
      case 'basic':
      default: return 'linear-gradient(135deg, #64748b, #8b5cf6)';
    }
  };

  const getPlanBorder = (iconStr: string) => {
    switch (iconStr) {
      case 'vip': return '#f59e0b';
      case 'max': return '#0ea5e9';
      case 'plus': return '#8b5cf6';
      case 'gold': return '#eab308';
      case 'silver': return '#94a3b8';
      case 'diamond': return '#3b82f6';
      case 'basic':
      default: return '#64748b';
    }
  };
  const handleExitImpersonation = () => {
    const adminToken = localStorage.getItem('df-admin-token');
    const adminUser = localStorage.getItem('df-admin-user');
    if (adminToken && adminUser) {
      localStorage.setItem('df-token', adminToken);
      localStorage.setItem('df-user', adminUser);
      setToken(adminToken);
      setUser(JSON.parse(adminUser));
      localStorage.removeItem('df-admin-token');
      localStorage.removeItem('df-admin-user');
      setImpersonatingUser(null);
      setIsAdminMode(true);
      setActiveItem('admin_overview');
      window.location.reload();
    }
  };

  const fetchInstances = async () => {
    try {
      setLoadingInstances(true);
      const data = await fetchWithAuth('/api/v1/whatsapp/instances/');
      setInstances(data);
    } catch (err) {
      console.error('Failed to fetch instances:', err);
    } finally {
      setLoadingInstances(false);
    }
  };

  const fetchClientData = async () => {
    try {
      const logsData = await fetchWithAuth('/api/v1/whatsapp/logs/');
      setApiLogs(logsData);

      const bookingsData = await fetchWithAuth('/api/v1/whatsapp/bookings/');
      setBookings(bookingsData);

      const notifsData = await fetchWithAuth('/api/v1/whatsapp/notifications/');
      setNotifications(notifsData);

      const subData = await fetchWithAuth('/api/v1/billing/subscription/').catch(() => null);
      setSubscription(subData);

      const invData = await fetchWithAuth('/api/v1/billing/invoices/');
      setInvoices(invData);

      const pld = await fetchWithAuth('/api/v1/billing/plans/');
      setPlans(pld);

      const tck = await fetchWithAuth('/api/v1/whatsapp/tickets/');
      setTickets(tck);

      const agr = await fetchWithAuth('/api/v1/whatsapp/agreements/');
      setAgreements(agr);

      const sh = await fetchWithAuth('/api/v1/auth/sessions/');
      setSessionLogs(sh);

      const lh = await fetchWithAuth('/api/v1/auth/login-history/');
      setLoginHistory(lh);
    } catch (e) {
      console.error('Failed to fetch client logs / billing:', e);
    }
  };

  const fetchAdminData = async () => {
    try {
      const stats = await fetchWithAuth('/api/v1/whatsapp/admin/overview/');
      setAdminStats(stats);

      const cls = await fetchWithAuth('/api/v1/whatsapp/admin/clients/');
      setAdminClients(cls);

      const ses = await fetchWithAuth('/api/v1/whatsapp/admin/sessions/');
      setAdminSessions(ses);

      const pns = await fetchWithAuth('/api/v1/billing/plans/');
      setAdminPlans(pns);

      const sigs = await fetchWithAuth('/api/v1/whatsapp/admin/agreements/signatures/');
      setAdminSignatures(sigs);
    } catch (e) {
      console.error('Failed to load admin logs:', e);
    }
  };

  useEffect(() => {
    // Load Meta Facebook SDK for Business Login / Embedded Signup
    if (typeof window !== 'undefined' && !document.getElementById('facebook-jssdk')) {
      window.fbAsyncInit = function () {
        FB.init({
          appId: process.env.NEXT_PUBLIC_META_APP_ID || 'YOUR_META_APP_ID',
          cookie: true,
          xfbml: true,
          version: 'v20.0'
        });
      };

      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(js);
    }

    // Add Window Message Listener for Embedded Signup Callbacks
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log("Embedded Signup Message Received:", data);
          // If we want to handle the postMessage flow directly, we can do it here.
          // But typically FB.login authResponse gives us the 'code' which is easier to send to backend.
        }
      } catch (e) {
        // Not a JSON message
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!token && !localStorage.getItem('df-token')) {
      router.push('/auth/login');
      return;
    }

    if (localStorage.getItem('df-admin-token')) {
      setImpersonatingUser(user?.email || 'Client Account');
    } else {
      setImpersonatingUser(null);
    }

    fetchInstances();
    fetchClientData();
  }, [token]);

  useEffect(() => {
    if (user?.profile) {
      setEditEmail(user.email);
      setTwoFactor(user.profile.two_factor_enabled);
      setTwoStepEnabled(user.profile.two_step_enabled);
      setRestrictIp(user.profile.restrict_ip_enabled);
    }
  }, [user]);

  useEffect(() => {
    if (isAdminMode) {
      fetchAdminData();
    }
  }, [isAdminMode, activeItem]);

  useEffect(() => {
    if (selectedInstance) {
      setBotMode(selectedInstance.bot_mode || 'off');
      setAiApiKey(selectedInstance.ai_api_key || '');
      setAiProvider(selectedInstance.ai_provider || 'gemini');
      setAiModel(selectedInstance.ai_model || 'gemini-2.5-flash');

      const rawPrompt = selectedInstance.ai_prompt || '';
      try {
        const parsed = JSON.parse(rawPrompt);
        if (parsed.interactiveBotName !== undefined) {
          setInteractiveBotName(parsed.interactiveBotName || '');
          setInteractiveTrigger(parsed.interactiveTrigger || '');
          setInteractiveWelcome(parsed.interactiveWelcome || '');
          setInteractiveInvalid(parsed.interactiveInvalid || '');
          setInteractiveFooter(parsed.interactiveFooter || '');
          setAiPrompt('');
        } else {
          setAiPrompt(rawPrompt);
        }
      } catch (e) {
        setAiPrompt(rawPrompt);
        setInteractiveBotName('');
        setInteractiveTrigger('');
        setInteractiveWelcome('');
        setInteractiveInvalid('');
        setInteractiveFooter('');
      }
    } else {
      setBotMode('off');
      setAiPrompt('');
      setAiApiKey('');
      setAiProvider('gemini');
      setAiModel('gemini-2.5-flash');
      setInteractiveBotName('');
      setInteractiveTrigger('');
      setInteractiveWelcome('');
      setInteractiveInvalid('');
      setInteractiveFooter('');
    }
  }, [selectedInstance?.id]);

  useEffect(() => {
    if (!selectedInstance || selectedInstance.instance_type !== 'web_qr') return;
    if (selectedInstance.status !== 'qrcode' && selectedInstance.status !== 'connecting') return;

    const interval = setInterval(async () => {
      try {
        const data = await fetchWithAuth(`/api/v1/whatsapp/instances/${selectedInstance.id}/`);
        setSelectedInstance(data);
        setInstances(prev => prev.map(inst => inst.id === data.id ? data : inst));
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedInstance]);

  // Listen for navigation events dispatched by child components (e.g. AdminDashboardOverview)
  useEffect(() => {
    const handler = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      if (key) setActiveItem(key);
    };
    window.addEventListener('df-navigate', handler);
    return () => window.removeEventListener('df-navigate', handler);
  }, []);

  const handleOpenCreateInstance = () => {
    if (instances.length >= 3) {
      alert(locale === 'ar' ? 'لقد تجاوزت الحد الأقصى المسموح به للأجهزة وهو 3 أرقام.' : 'You have reached the maximum device limit of 3 numbers.');
      return;

    }

    if (agreements.length > 0) {
      setSelectedAgreement(agreements[0]);
      setIsAgreementModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSignAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentName || !consentEmail || !consentPhone || !consentAccepted) {
      alert(locale === 'ar' ? 'الرجاء ملء جميع الحقول والموافقة على الاتفاقية.' : 'Please fill all fields and accept the agreement.');
      return;
    }
    try {
      await fetchWithAuth(`/api/v1/whatsapp/agreements/${selectedAgreement.id}/sign/`, {
        method: 'POST',
        body: JSON.stringify({
          full_name: consentName,
          email: consentEmail,
          phone_number: consentPhone
        })
      });
      setIsAgreementModalOpen(false);
      setIsModalOpen(true);
    } catch (e) {
      alert('Failed to sign consent agreement');
    }
  };

  const handleCreateInstance = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setCreateError(null);
    if (!newInstanceName || !newInstanceType) {
      setCreateError(locale === 'ar' ? 'الرجاء إدخال اسم الجهاز' : 'Please enter a device name');
      return;
    }

    setIsCreatingInstance(true);
    try {
      if (newInstanceType === 'meta') {
        if (!newPhoneId || !newWabaId || !newAccessToken) {
          setCreateError(locale === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
          setIsCreatingInstance(false);
          return;
        }
        const res = await fetchWithAuth('/api/v1/whatsapp/cloud-api/manual/', {
          method: 'POST',
          body: JSON.stringify({
            device_name: newInstanceName,
            phone_number_id: newPhoneId,
            waba_id: newWabaId,
            business_id: newWabaId,
            access_token: newAccessToken
          })
        });
        setInstances(prev => [...prev, res]);
        setToastMsg(locale === 'ar' ? 'تم إضافة الجهاز بنجاح' : 'Device added successfully!');
        setTimeout(() => setToastMsg(''), 3000);
      } else {
        const payload: any = {
          instance_name: newInstanceName,
          instance_type: 'web_qr'
        };

        const newInst = await fetchWithAuth('/api/v1/whatsapp/instances/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setInstances(prev => [...prev, newInst]);
        setToastMsg(locale === 'ar' ? 'تم إنشاء الجهاز بنجاح' : 'Device created successfully!');
        setTimeout(() => setToastMsg(''), 3000);

        setSelectedInstance(newInst);
        setWebhookUrl(newInst.webhook_url || '');
        setWebhookEnabled(newInst.webhook_enabled);
        setWhMsgRec(newInst.wh_message_received);
        setWhMsgSent(newInst.wh_message_sent);
        setWhStatChange(newInst.wh_status_changed);
        setWhGroupJoin(newInst.wh_group_member_join);
        setWhGroupLeave(newInst.wh_group_member_leave);
        setWhQrUpd(newInst.wh_qr_updated);
        setFaqRules(newInst.faq_rules || []);
      }

      setIsModalOpen(false);
      setNewInstanceName('');
      setNewPhoneId('');
      setNewWabaId('');
      setNewAccessToken('');
    } catch (err: any) {
      setCreateError(err.message || (locale === 'ar' ? 'فشل إنشاء الجهاز، يرجى المحاولة لاحقاً.' : 'Failed to create WhatsApp instance'));
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const handleMetaSignup = async () => {
    // Temporarily disabled for local environment
    alert(locale === 'ar'
      ? 'سيتم تفعيل الربط الرسمي بعد رفع الموقع على الدومين وإكمال إعدادات Meta Production'
      : 'Official Meta connection will be enabled after deploying to a domain and completing Meta Production settings');
    return;

    /* FUTURE IMPLEMENTATION:
    if (!newInstanceName) {
    if (!newInstanceName) {
      alert(locale === 'ar' ? 'الرجاء إدخال اسم الجهاز أولاً' : 'Please enter a device name first');
      return;
    }
    const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID || 'YOUR_META_CONFIG_ID';
    
    FB.login(async (response: any) => {
      if (response.authResponse) {
        const code = response.authResponse.code;
        try {
          const res = await fetchWithAuth('/api/v1/whatsapp/cloud-api/callback/', {
            method: 'POST',
            body: JSON.stringify({
              device_name: newInstanceName,
              code: code,
              // waba_id, phone_number_id typically are obtained in background via window message, 
              // but if code exchange fetches everything, we might not strictly need it here.
              // We'll rely on the window message setting it if we had it, but actually Meta's standard flow 
              // returns waba_id and phone_number_id via FB SDK callback for embedded signup?
              // Standard embedded signup requires exchanging code for token, then fetching WABAs.
              // The backend will handle the code exchange. Wait, without phone_number_id the backend can't know which one.
              // In Embedded Signup, the auth response doesn't give phone_number_id directly unless requested, 
              // but we need it. Usually, it's sent via the window message listener.
              // Let's pass the ones we might have captured.
              waba_id: metaWabaId, 
              phone_number_id: metaPhoneNumberId,
              business_id: metaBusinessId
            })
          });
          setInstances(prev => [...prev, res]);
          setIsModalOpen(false);
          setNewInstanceName('');
          setDeviceConnectionType(null);
          setToastMsg(locale === 'ar' ? 'تم ربط رقم واتساب الأعمال بنجاح' : 'WhatsApp Business successfully connected!');
          setTimeout(() => setToastMsg(''), 3000);
        } catch (e: any) {
          alert((locale === 'ar' ? 'فشل الربط: ' : 'Connection failed: ') + (e.message || 'Unknown error'));
        }
      } else {
        alert(locale === 'ar' ? 'تم إلغاء تسجيل الدخول أو فشل' : 'Login cancelled or failed');
      }
    }, {
      config_id: configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: '',
        sessionInfoVersion: '2'
      }
    });
    */
  };

  const handleManualMetaConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/api/v1/whatsapp/cloud-api/manual/', {
        method: 'POST',
        body: JSON.stringify({
          device_name: newInstanceName,
          phone_number_id: metaPhoneNumberId,
          waba_id: metaWabaId,
          business_id: metaBusinessId,
          access_token: metaToken
        })
      });
      setInstances(prev => [...prev, res]);
      setIsModalOpen(false);
      setNewInstanceName('');
      setDeviceConnectionType(null);
      setShowManualMeta(false);
      setMetaPhoneNumberId('');
      setMetaWabaId('');
      setMetaBusinessId('');
      setMetaToken('');
      setToastMsg(locale === 'ar' ? 'تم ربط رقم واتساب الأعمال بنجاح' : 'WhatsApp Business successfully connected!');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (e: any) {
      alert((locale === 'ar' ? 'فشل الربط: ' : 'Connection failed: ') + (e.message || 'Unknown error'));
    }
  };

  const handleDeleteInstance = (id: number) => {
    setDeleteConfirm({ isOpen: true, id });
    setDeleteError(null);
  };

  const executeDeleteInstance = async () => {
    if (!deleteConfirm.id) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await fetchWithAuth(`/api/v1/whatsapp/instances/${deleteConfirm.id}/`, { method: 'DELETE' });
      setInstances(prev => prev.filter(inst => inst.id !== deleteConfirm.id));
      if (selectedInstance?.id === deleteConfirm.id) setSelectedInstance(null);
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (err: any) {
      setDeleteError(locale === 'ar' ? 'فشل حذف الجلسة، يرجى المحاولة مرة أخرى.' : 'Failed to delete session. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInitSession = async () => {
    if (!selectedInstance) return;
    setIsInitializing(true);
    try {
      const data = await fetchWithAuth(`/api/v1/whatsapp/instances/${selectedInstance.id}/init/`, { method: 'POST' });
      setSelectedInstance(data);
      setInstances(prev => prev.map(inst => inst.id === data.id ? data : inst));
      setToastMsg(locale === 'ar' ? 'تم تحديث حالة الجلسة' : 'Session updated successfully');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err: any) {
      setToastMsg(err.message || (locale === 'ar' ? 'فشل تحديث الجلسة' : 'Failed to initialize session'));
      setTimeout(() => setToastMsg(''), 3000);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLogoutSession = async () => {
    if (!selectedInstance) return;
    setIsLoggingOut(true);
    try {
      const data = await fetchWithAuth(`/api/v1/whatsapp/instances/${selectedInstance.id}/logout/`, { method: 'POST' });
      setSelectedInstance(data);
      setInstances(prev => prev.map(inst => inst.id === data.id ? data : inst));
      setToastMsg(locale === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err: any) {
      setToastMsg(err.message || (locale === 'ar' ? 'فشل تسجيل الخروج من الجلسة' : 'Failed to log out session'));
      setTimeout(() => setToastMsg(''), 3000);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSaveWebhookSettings = async (instanceId: number) => {
    try {
      const data = await fetchWithAuth(`/api/v1/whatsapp/instances/${instanceId}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          webhook_url: webhookUrl,
          webhook_enabled: webhookEnabled,
          wh_message_received: whMsgRec,
          wh_message_sent: whMsgSent,
          wh_status_changed: whStatChange,
          wh_group_member_join: whGroupJoin,
          wh_group_member_leave: whGroupLeave,
          wh_qr_updated: whQrUpd
        }),
      });
      setInstances(prev => prev.map(i => i.id === data.id ? data : i));
      alert(locale === 'ar' ? 'تم حفظ إعدادات الويب هوك بنجاح' : 'Webhook configurations saved successfully');
    } catch (e) {
      alert('Failed to update webhooks settings');
    }
  };

  const handleSaveBotSettings = async (instanceId: number, silent: boolean = false, overrideMode?: string) => {
    try {
      setSavingBotSettings(true);

      const effectiveMode = overrideMode !== undefined ? overrideMode : botMode;
      let payloadPrompt = aiPrompt;
      if (effectiveMode === 'qa') {
        payloadPrompt = JSON.stringify({
          interactiveBotName,
          interactiveTrigger,
          interactiveWelcome,
          interactiveInvalid,
          interactiveFooter
        });
      }

      const data = await fetchWithAuth(`/api/v1/whatsapp/instances/${instanceId}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          bot_mode: effectiveMode,
          ai_provider: aiProvider,
          ai_model: aiModel,
          ai_prompt: payloadPrompt,
          ai_api_key: aiApiKey
        }),
      });
      setInstances(prev => prev.map(i => i.id === data.id ? data : i));
      setSelectedInstance(data);
      if (!silent) {
        alert(locale === 'ar' ? 'تم حفظ إعدادات المجيب التلقائي بنجاح' : 'Auto-reply settings saved successfully');
      }
    } catch (e) {
      if (!silent) {
        alert('Failed to update bot settings');
      }
    } finally {
      setSavingBotSettings(false);
    }
  };

  const handleAddFaqRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstance || !newKeyword || !newAnswer) return;
    try {
      setAddingRule(true);
      const rule = await fetchWithAuth('/api/v1/whatsapp/faq-rules/', {
        method: 'POST',
        body: JSON.stringify({
          instance: selectedInstance.id,
          keyword: newKeyword,
          answer: newAnswer,
          matching_type: newMatchType,
          action_type: newActionType,
          action_payload: newActionPayload
        }),
      });
      setFaqRules(prev => [...prev, rule]);
      setNewKeyword('');
      setNewAnswer('');
      setNewActionPayload('');
    } catch (err) {
      alert('Failed to add rule');
    } finally {
      setAddingRule(false);
    }
  };

  const handleDeleteFaqRule = async (id: number) => {
    try {
      await fetchWithAuth(`/api/v1/whatsapp/faq-rules/${id}/`, { method: 'DELETE' });
      setFaqRules(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Failed to delete rule');
    }
  };

  const handleToggleRuleStatus = async (id: number, active: boolean) => {
    try {
      const updated = await fetchWithAuth(`/api/v1/whatsapp/faq-rules/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: active })
      });
      setFaqRules(prev => prev.map(r => r.id === updated.id ? updated : r));
    } catch (e) {
      alert('Failed to update rule status');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { email: editEmail };
      if (editPassword) payload.password = editPassword;

      const updated = await fetchWithAuth('/api/v1/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      setUser(updated);
      setEditPassword('');
      alert(locale === 'ar' ? 'تم تحديث معلومات الحساب بنجاح' : 'Account updated successfully');
    } catch (e) {
      alert('Failed to update credentials');
    }
  };

  const handleToggleSecurity = async (field: string, val: boolean) => {
    try {
      const payload: any = {};
      if (field === '2fa') payload.two_factor_enabled = val;
      if (field === '2step') {
        payload.two_step_enabled = val;
        if (val && twoStepPassword) payload.two_step_password = twoStepPassword;
      }
      if (field === 'ip') payload.restrict_ip_enabled = val;

      const updated = await fetchWithAuth('/api/v1/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      setUser(updated);
      alert(locale === 'ar' ? 'تم حفظ التعديلات الأمنية بنجاح' : 'Security settings updated successfully');
    } catch (e) {
      alert('Failed to update security toggles');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject || !newTicketDesc) return;
    try {
      const tck = await fetchWithAuth('/api/v1/whatsapp/tickets/', {
        method: 'POST',
        body: JSON.stringify({
          subject: newTicketSubject,
          description: newTicketDesc,
          priority: newTicketPriority
        })
      });
      setTickets(prev => [tck, ...prev]);
      setNewTicketSubject('');
      setNewTicketDesc('');
    } catch (e) {
      alert('Failed to create ticket');
    }
  };

  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketReplyText || !activeTicket) return;
    try {
      const reply = await fetchWithAuth(`/api/v1/whatsapp/tickets/${activeTicket.id}/reply/`, {
        method: 'POST',
        body: JSON.stringify({ message: ticketReplyText })
      });
      setActiveTicket((prev: any) => ({
        ...prev,
        messages: [...(prev.messages || []), reply]
      }));
      setTicketReplyText('');
    } catch (e) {
      alert('Failed to send reply');
    }
  };

  const openSubscribeModal = (plan: any) => {
    setSelectedSubscribePlan(plan);
    setReceiptFile(null);
    setIsSubscribeModalOpen(true);
  };

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubscribePlan || !receiptFile) {
      setToastMsg(locale === 'ar' ? 'يرجى اختيار ملف الإيصال البنكي' : 'Please upload transfer receipt');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    setIsSubscribing(true);
    try {
      const formData = new FormData();
      formData.append('plan_id', selectedSubscribePlan.id.toString());
      formData.append('payment_method', 'bank_transfer');
      formData.append('receipt_image', receiptFile);

      const res = await fetchWithAuth('/api/v1/billing/subscription/', {
        method: 'POST',
        body: formData
      });

      if (res.invoice) {
        setInvoices(prev => [res.invoice, ...prev]);
      }
      setIsSubscribeModalOpen(false);
      setReceiptFile(null);
      setSelectedSubscribePlan(null);
      setToastMsg(res.message || (locale === 'ar' ? 'تم إرسال طلب الاشتراك بنجاح وهو بانتظار مراجعة الأدمن' : 'Subscription request sent successfully'));
      setTimeout(() => setToastMsg(''), 5000);
    } catch (e: any) {
      console.log("Subscription API Notice:", e.message || e);
      let errorMsg = locale === 'ar' ? 'فشل إرسال طلب الاشتراك' : 'Failed to send subscription request';
      if (e.message) {
        errorMsg = e.message;
      }
      setToastMsg(errorMsg);
      setTimeout(() => setToastMsg(''), 5000);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTestEndpoint = async () => {
    setPlaygroundLoading(true);
    setPlaygroundResponse('');
    try {
      const activeInst = selectedInstance || (instances.length > 0 ? instances[0] : null);
      const tokenHeader = activeInst?.api_key || 'YOUR_INSTANCE_API_KEY';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenHeader}`
      };
      const res = await fetch(`${API_BASE_URL}${playgroundEndpoint}`, {
        method: 'POST',
        headers: headers,
        body: playgroundBody
      });
      const data = await res.json();
      setPlaygroundResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setPlaygroundResponse(JSON.stringify({ error: e.message || 'Request failed' }, null, 2));
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const getPlaygroundSnippet = () => {
    const activeInst = selectedInstance || (instances.length > 0 ? instances[0] : null);
    const key = activeInst?.api_key || 'df_token_xxxxxxxxxxxxxxxxxx';
    const bodyStr = playgroundBody.replace(/\n/g, '\n      ');

    if (activeLangTab === 'python') {
      return `import requests

url = "${API_BASE_URL}${playgroundEndpoint}"
headers = {
    "Authorization": "Bearer ${key}",
    "Content-Type": "application/json"
}
payload = ${bodyStr}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
    }
    if (activeLangTab === 'javascript') {
      return `const response = await fetch("${API_BASE_URL}${playgroundEndpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${key}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${bodyStr})
});

const data = await response.json();
console.log(data);`;
    }
    if (activeLangTab === 'php') {
      return `<?php
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => "${API_BASE_URL}${playgroundEndpoint}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer ${key}",
        "Content-Type: application/json"
    ],
    CURLOPT_POSTFIELDS => '${bodyStr.trim()}'
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;`;
    }
    return '';
  };

  const getActiveNumbersCount = () => instances.filter(i => i.status === 'connected').length;
  const getActiveWebhooksCount = () => instances.filter(i => i.webhook_url && i.webhook_enabled).length;

  const getTranslationText = (key: string, ar: string, en: string) => {
    return locale === 'ar' ? ar : en;
  };

  const handleSuspendClient = async (id: number) => {
    try {
      await fetchWithAuth(`/api/v1/whatsapp/admin/clients/${id}/suspend/`, { method: 'POST' });
      setAdminClients(prev => prev.map(c => c.id === id ? { ...c, is_active: false } : c));
    } catch (e) {
      alert('Failed to suspend client');
    }
  };

  const handleActivateClient = async (id: number) => {
    try {
      await fetchWithAuth(`/api/v1/whatsapp/admin/clients/${id}/activate/`, { method: 'POST' });
      setAdminClients(prev => prev.map(c => c.id === id ? { ...c, is_active: true } : c));
    } catch (e) {
      alert('Failed to activate client');
    }
  };

  const handleImpersonateClient = async (client: any) => {
    try {
      const data = await fetchWithAuth(`/api/v1/whatsapp/admin/clients/${client.id}/login-as/`, { method: 'POST' });

      localStorage.setItem('df-admin-token', token || '');
      localStorage.setItem('df-admin-user', JSON.stringify(user));

      localStorage.setItem('df-token', data.tokens.access);
      localStorage.setItem('df-user', JSON.stringify(data.user));

      window.location.href = '/dashboard';
    } catch (e) {
      alert('Failed to impersonate client');
    }
  };

  const handleTerminateSession = async (id: number) => {
    try {
      await fetchWithAuth(`/api/v1/whatsapp/admin/sessions/${id}/terminate/`, { method: 'POST' });
      setAdminSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'disconnected', qr_code: null } : s));
    } catch (e) {
      alert('Failed to terminate session');
    }
  };

  const resetPlanForm = () => {
    setEditingPlanId(null);
    setAdminPlanName('');
    setAdminPlanDesc('');
    setAdminPlanPrice('');
    setAdminPlanDays('30');
    setAdminPlanMsgs('10000');
    setAdminPlanUnlimitedMsgs(false);
    setAdminPlanDevices('3');
    setAdminPlanUnlimitedDevices(false);
    setAdminPlanNumbers('1');
    setAdminPlanUnlimitedNumbers(false);
    setAdminPlanFeatures({ interactive_bot: false, ai_reply: false, webhooks: false, api_access: false, broadcasts: false });
    setAdminPlanSupport('regular');
    setAdminPlanIcon('basic');
    setAdminPlanGradient('linear-gradient(135deg, #333333, #000000)');
    setAdminPlanOrder('0');
    setAdminPlanIsActive(true);
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlanId(plan.id);
    setAdminPlanName(plan.name || '');
    setAdminPlanDesc(plan.description || '');
    setAdminPlanPrice(plan.price?.toString() || '0');
    setAdminPlanDays(plan.duration_days?.toString() || '30');
    setAdminPlanMsgs(plan.message_limit?.toString() || '10000');
    setAdminPlanUnlimitedMsgs(plan.is_messages_unlimited || false);
    setAdminPlanDevices(plan.device_limit?.toString() || '3');
    setAdminPlanUnlimitedDevices(plan.is_devices_unlimited || false);
    setAdminPlanNumbers(plan.number_limit?.toString() || '1');
    setAdminPlanUnlimitedNumbers(plan.is_numbers_unlimited || false);
    setAdminPlanFeatures({
      interactive_bot: plan.interactive_bot || false,
      ai_reply: plan.ai_reply || false,
      webhooks: plan.webhooks || false,
      api_access: plan.api_access || false,
      broadcasts: plan.broadcasts || false
    });
    setAdminPlanSupport(plan.support_type || 'regular');
    setAdminPlanIcon(plan.icon || 'basic');
    setAdminPlanGradient(plan.color_gradient || 'linear-gradient(135deg, #333333, #000000)');
    setAdminPlanOrder(plan.order?.toString() || '0');
    setAdminPlanIsActive(plan.is_active ?? true);
    setIsPlanModalOpen(true);
  };

  const handleTogglePlan = async (id: number, currentActive: boolean) => {
    try {
      const updated = await fetchWithAuth(`/api/v1/billing/plans/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentActive })
      });
      setAdminPlans(prev => prev.map(p => p.id === id ? updated : p));
    } catch (e) {
      alert('Failed to toggle plan status');
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه الباقة؟' : 'Are you sure you want to delete this plan?')) return;
    try {
      await fetchWithAuth(`/api/v1/billing/plans/${id}/`, { method: 'DELETE' });
      setAdminPlans(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert(locale === 'ar' ? 'لا يمكن حذف هذه الباقة لأنها مرتبطة باشتراكات، يمكنك تعطيلها بدلًا من حذفها.' : 'Cannot delete plan as it is linked to existing subscriptions. Disable it instead.');
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdminPlan(true);
    try {
      const payload = {
        name: adminPlanName,
        description: adminPlanDesc,
        price: parseFloat(adminPlanPrice),
        duration_days: parseInt(adminPlanDays),
        message_limit: parseInt(adminPlanMsgs),
        is_messages_unlimited: adminPlanUnlimitedMsgs,
        device_limit: parseInt(adminPlanDevices),
        is_devices_unlimited: adminPlanUnlimitedDevices,
        number_limit: parseInt(adminPlanNumbers),
        is_numbers_unlimited: adminPlanUnlimitedNumbers,
        interactive_bot: adminPlanFeatures.interactive_bot,
        ai_reply: adminPlanFeatures.ai_reply,
        webhooks: adminPlanFeatures.webhooks,
        api_access: adminPlanFeatures.api_access,
        broadcasts: adminPlanFeatures.broadcasts,
        support_type: adminPlanSupport,
        icon: adminPlanIcon,
        color_gradient: adminPlanGradient,
        order: parseInt(adminPlanOrder),
        is_active: adminPlanIsActive,
      };

      if (editingPlanId) {
        const updated = await fetchWithAuth(`/api/v1/billing/plans/${editingPlanId}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        setAdminPlans(prev => prev.map(p => p.id === editingPlanId ? updated : p));
      } else {
        const plan = await fetchWithAuth('/api/v1/billing/plans/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setAdminPlans(prev => [...prev, plan]);
      }
      setIsPlanModalOpen(false);
      resetPlanForm();
      setToastMsg('تم حفظ الباقة بنجاح');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (e) {
      alert('فشل في حفظ الباقة، تأكد من صحة البيانات!');
      console.error(e);
    } finally {
      setSavingAdminPlan(false);
    }
  };

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcTitle || !bcContent) return;
    try {
      await fetchWithAuth('/api/v1/whatsapp/admin/notifications/', {
        method: 'POST',
        body: JSON.stringify({
          title: bcTitle,
          content: bcContent,
          type: bcType
        })
      });
      alert('Broadcast notification sent successfully!');
      setBcTitle('');
      setBcContent('');
    } catch (e) {
      alert('Failed to broadcast message');
    }
  };

  const handleTestAI = async () => {
    if (!aiTestMessage.trim()) return;
    setTestingAI(true);
    setAiTestResponse('');
    
    setTimeout(() => {
      setAiTestResponse(locale === 'ar' ? 'هذا رد تجريبي من الذكاء الاصطناعي بناءً على إعداداتك...' : 'This is a mock AI response based on your configuration...');
      setTestingAI(false);
    }, 1500);
  };

  return (
    <div className={styles.dashboardLayout}>

      { }
      {(impersonatingUser !== null) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#F2994A',
          color: 'white',
          padding: '10px 24px',
          textAlign: 'center',
          fontWeight: 700,
          zIndex: 9999,
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <span>⚠️ {locale === 'ar' ? `أنت تتصفح حساب العميل: ${impersonatingUser}` : `You are viewing client account: ${impersonatingUser}`}</span>
          <button onClick={handleExitImpersonation} style={{
            background: 'white',
            border: 'none',
            color: '#F2994A',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '12px'
          }}>
            {locale === 'ar' ? 'العودة كمدير النظام' : 'Return to Admin'}
          </button>
        </div>
      )}

      { }
      <div className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`} style={(impersonatingUser !== null) ? { top: '44px' } : undefined}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.sidebarLogo}>
            <span>DarkFalcon API</span>
          </Link>
          <button className={styles.sidebarCloseBtn} onClick={() => setSidebarOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          { }
          {user?.is_staff && (
            <div style={{ padding: '8px 12px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsAdminMode(!isAdminMode);
                  setActiveItem(isAdminMode ? 'overview' : 'admin_overview');
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #2D9CDB, #56CCF2)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(45,156,219,0.2)'
                }}
              >
                {isAdminMode ? (locale === 'ar' ? '← لوحة العميل' : '← Client Panel') : (locale === 'ar' ? 'لوحة الأدمن (المدير) →' : 'Admin Dashboard →')}
              </motion.button>
            </div>
          )}

          { }
          {!isAdminMode ? (
            sidebarItems.map(item => (
              <button
                key={item.key}
                className={`${styles.sidebarItem} ${activeItem === item.key ? styles.sidebarItemActive : ''}`}
                onClick={() => {
                  setActiveItem(item.key);
                  setSelectedInstance(null);
                  setSidebarOpen(false);
                }}
                style={{ position: 'relative' }}
              >
                {activeItem === item.key && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className={styles.sidebarActiveIndicator}
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 'inherit' }}>
                  {iconMap[item.icon]}
                  <span>{getTranslationText(item.key, item.labelAr, item.labelEn)}</span>
                </div>
              </button>
            ))
          ) : (
            adminSidebarItems.map(item => (
              <button
                key={item.key}
                className={`${styles.sidebarItem} ${activeItem === item.key ? styles.sidebarItemActive : ''}`}
                onClick={() => {
                  setActiveItem(item.key);
                  setSidebarOpen(false);
                }}
                style={{ position: 'relative' }}
              >
                {activeItem === item.key && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className={styles.sidebarActiveIndicator}
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 'inherit' }}>
                  {iconMap[item.icon]}
                  <span>{getTranslationText(item.key, item.labelAr, item.labelEn)}</span>
                </div>
              </button>
            ))
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarPlan}>
            <span className={styles.planLabel}>{locale === 'ar' ? 'الباقة الحالية' : 'Current Plan'}</span>
            <span className={styles.planName}>
              {subscription?.plan_name || (locale === 'ar' ? 'تجريبية مجانية' : '7 Days Trial')}
            </span>
          </div>

          <button
            className={styles.logoutBtn}
            onClick={() => { logout(); router.push('/auth/login'); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            <span>{locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      { }
      <main className={styles.mainContent} style={(impersonatingUser !== null) ? { marginTop: '44px' } : undefined}>

        { }
                <motion.header 
          className={styles.topBar}
          style={{
            backgroundColor: topBarBg as any,
            backdropFilter: topBarBlur as any,
            WebkitBackdropFilter: topBarBlur as any
          }}
        >
          <button className={styles.burgerBtn} onClick={() => setSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>

          <div className={styles.topBarTitle}>
            <h1>
              {isAdminMode ?
                getTranslationText('', 'لوحة المدير العام للمنصة', 'DarkFalcon General Admin Controls') :
                getTranslationText('', 'لوحة إدارة الحساب', 'Customer WhatsApp Web Dashboard')
              }
            </h1>
            <p>{locale === 'ar' ? `أهلاً بك، ${user?.email}` : `Welcome back, ${user?.email}`}</p>
          </div>

          <div className={styles.topBarActions}>
            <button className={styles.topBarIcon} onClick={toggleTheme}>
              {theme === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              )}
            </button>
            <div className={styles.userAvatar}>
              <span>{user?.email ? user.email.charAt(0).toUpperCase() : 'U'}</span>
            </div>
          </div>
        </motion.header>

        { }
        <div className={styles.dashboardContent}>

          { }
          { }
          { }

          { }
          {activeItem === 'overview' && !isAdminMode && (
            <ClientDashboardOverview onNavigate={setActiveItem} />
          )}

          {activeItem === 'admin_roles' && isAdminMode && <AdminRolesManager />}
          {activeItem === 'admin_users' && isAdminMode && <AdminUsersManager />}

          {activeItem === 'numbers' && !isAdminMode && (
            <div>
              {selectedInstance ? (

                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <button onClick={() => setSelectedInstance(null)} className="btn btn-outline btn-sm" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    {locale === 'ar' ? 'العودة لقائمة الأجهزة' : 'Back to Devices List'}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {selectedInstance.instance_type === 'web_qr' ? <Smartphone size={28} color="var(--primary)" /> : <Zap size={28} color="#1877F2" />}
                        {selectedInstance.instance_name}
                      </h2>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>ID: {selectedInstance.id} • {locale === 'ar' ? 'تاريخ الربط:' : 'Created:'} {new Date(selectedInstance.created_at).toLocaleDateString()}</span>
                    </div>

                    <button onClick={() => handleDeleteInstance(selectedInstance.id)} className="btn btn-outline" style={{ color: '#EB5757', borderColor: '#EB575740', background: 'var(--surface)' }}>
                      <Trash2 size={16} />
                      {locale === 'ar' ? 'حذف الجهاز' : 'Delete Device'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

                    {/* Card 1: Session Details */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={18} color="var(--primary)" />
                        {locale === 'ar' ? 'تفاصيل الجلسة والاتصال' : 'Session & Connection Details'}
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{locale === 'ar' ? 'حالة الجلسة' : 'Status'}</span>
                          <span style={{
                            background: selectedInstance.status === 'connected' ? 'var(--success-bg)' : selectedInstance.status === 'qrcode' || selectedInstance.status === 'connecting' ? '#f59e0b20' : 'rgba(235,87,87,0.1)',
                            color: selectedInstance.status === 'connected' ? 'var(--success)' : selectedInstance.status === 'qrcode' || selectedInstance.status === 'connecting' ? '#f59e0b' : '#EB5757',
                            padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px'
                          }}>
                            {selectedInstance.status === 'connected' ? <CheckCircle size={14} /> : selectedInstance.status === 'qrcode' ? <Smartphone size={14} /> : <AlertCircle size={14} />}
                            {selectedInstance.status === 'connected' ? (locale === 'ar' ? 'متصل' : 'Connected') : selectedInstance.status === 'qrcode' ? (locale === 'ar' ? 'بانتظار مسح QR' : 'Waiting for QR') : selectedInstance.status === 'connecting' ? (locale === 'ar' ? 'جاري الاتصال...' : 'Connecting...') : (locale === 'ar' ? 'غير متصل' : 'Disconnected')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{locale === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'}</span>
                          <span style={{ fontWeight: 700, fontSize: '15px' }}>{selectedInstance.phone_number ? `+${selectedInstance.phone_number}` : (locale === 'ar' ? 'غير متوفر' : 'N/A')}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{locale === 'ar' ? 'نوع الاتصال' : 'Connection Type'}</span>
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>{selectedInstance.instance_type === 'web_qr' ? 'WhatsApp Web (QR)' : 'Meta API (Official)'}</span>
                        </div>

                        {selectedInstance.instance_type === 'web_qr' && (
                          <div style={{ marginTop: '8px' }}>
                            {selectedInstance.status === 'qrcode' && selectedInstance.qr_code && (
                              <div style={{ background: 'white', padding: '16px', borderRadius: '12px', textAlign: 'center', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                                <img src={selectedInstance.qr_code} alt="QR Code" style={{ width: '220px', height: '220px', margin: '0 auto' }} />
                                <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#64748b' }}>{locale === 'ar' ? 'امسح الرمز من تطبيق الواتساب الخاص بك' : 'Scan this QR from your WhatsApp app'}</p>
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <div style={{ flex: 1 }}>
                                <PremiumButton
                                  variant="primary"
                                  onClick={handleInitSession}
                                  loading={isInitializing}
                                  style={{ width: '100%', justifyContent: 'center' }}
                                >
                                  {locale === 'ar' ? 'تحديث QR / تشغيل' : 'Init / Refresh QR'}
                                </PremiumButton>
                              </div>
                              <div style={{ flex: 1 }}>
                                <PremiumButton
                                  variant="danger"
                                  onClick={handleLogoutSession}
                                  loading={isLoggingOut}
                                  style={{ width: '100%', justifyContent: 'center' }}
                                >
                                  {locale === 'ar' ? 'تسجيل الخروج' : 'Logout Session'}
                                </PremiumButton>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedInstance.instance_type === 'meta' && selectedInstance.status === 'connected' && (
                          <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>
                            {locale === 'ar' ? 'الجهاز متصل ومستقر عبر واجهة Meta البرمجية السحابية.' : 'Device is connected and stable via Meta Cloud API.'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card 2: API Details */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <KeyRound size={18} color="var(--primary)" />
                        {locale === 'ar' ? 'بيانات الربط البرمجي API' : 'API Connection Details'}
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Instance ID</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="text" readOnly value={selectedInstance.id} style={{ flex: 1, padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace' }} />
                            <button onClick={() => { navigator.clipboard.writeText(selectedInstance.id.toString()); setToastMsg(locale === 'ar' ? 'تم النسخ' : 'Copied'); setTimeout(() => setToastMsg(''), 2000); }} className="btn btn-outline" style={{ padding: '0 12px' }} title="Copy"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg></button>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Access Token (API Key)</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="password" readOnly value={selectedInstance.api_key} style={{ flex: 1, padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace' }} />
                            <button onClick={() => { navigator.clipboard.writeText(selectedInstance.api_key); setToastMsg(locale === 'ar' ? 'تم النسخ' : 'Copied'); setTimeout(() => setToastMsg(''), 2000); }} className="btn btn-outline" style={{ padding: '0 12px' }} title="Copy"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg></button>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Base URL (REST API)</label>
                          <div style={{ padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {window.location.origin}/api/v1/whatsapp/send/text/
                          </div>
                        </div>

                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setActiveItem('apiKeys'); setSelectedInstance(null); }}>
                          <FileText size={16} />
                          {locale === 'ar' ? 'عرض توثيق API الكامل' : 'View full API Documentation'}
                        </div>
                      </div>
                    </div>

                    {/* Quick Test Message Form */}
                    <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageCircle size={18} color="var(--primary)" />
                        {locale === 'ar' ? 'تجربة إرسال رسالة نصية' : 'Test Send Message'}
                      </h3>

                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const to = formData.get('to') as string;
                        const body = formData.get('body') as string;
                        if (!to || !body) return;
                        const btn = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement;
                        btn.disabled = true;
                        btn.textContent = locale === 'ar' ? 'جاري الإرسال...' : 'Sending...';
                        try {
                          const res = await fetch(`${API_BASE_URL}/api/v1/whatsapp/send/text/`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${selectedInstance.api_key}`
                            },
                            body: JSON.stringify({ instance_id: selectedInstance.id, to, body })
                          });
                          const json = await res.json();
                          if (res.ok) alert(locale === 'ar' ? 'تم الإرسال بنجاح!' : 'Sent successfully!');
                          else alert((locale === 'ar' ? 'فشل الإرسال: ' : 'Failed to send: ') + JSON.stringify(json));
                        } catch (err) {
                          alert('Error sending message');
                        } finally {
                          btn.disabled = false;
                          btn.textContent = locale === 'ar' ? 'إرسال رسالة تجريبية' : 'Send Test Message';
                        }
                      }} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 250px' }}>
                          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>{locale === 'ar' ? 'رقم المستلم (مع رمز الدولة):' : 'Recipient Phone (with country code):'}</label>
                          <input type="text" name="to" placeholder="966500000000" required style={{ width: '100%', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', fontSize: '14px' }} />
                        </div>
                        <div style={{ flex: '2 1 400px' }}>
                          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>{locale === 'ar' ? 'نص الرسالة:' : 'Message Text:'}</label>
                          <input type="text" name="body" placeholder={locale === 'ar' ? 'مرحباً، هذه رسالة تجريبية من النظام' : 'Hello, this is a test message from system'} required style={{ width: '100%', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', fontSize: '14px' }} />
                        </div>
                        <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <button type="submit" className="btn btn-primary w-full">
                            <Zap size={16} />
                            {locale === 'ar' ? 'إرسال رسالة تجريبية' : 'Send Test Message'}
                          </button>
                        </div>
                      </form>
                    </div>

                  </div>
                </div>
              ) : (

                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-primary)' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Smartphone size={20} color="var(--primary)" />
                      {locale === 'ar' ? 'أجهزتي وقنوات الإرسال المربوطة' : 'My Connected Devices'}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={fetchInstances} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-tertiary)' }} title={locale === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                        {locale === 'ar' ? 'تحديث' : 'Refresh'}
                      </button>
                      <button onClick={handleOpenCreateInstance} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={16} />
                        {locale === 'ar' ? 'ربط جهاز جديد' : 'Add New Device'}
                      </button>
                    </div>
                  </div>

                  <div className={styles.tableWrapper} style={{ padding: '0' }}>
                    <table className={styles.table} style={{ margin: 0 }}>
                      <thead style={{ background: 'var(--bg-tertiary)' }}>
                        <tr>
                          <th style={{ padding: '16px 24px' }}>{locale === 'ar' ? 'اسم الجهاز' : 'Device Name'}</th>
                          <th style={{ padding: '16px 24px' }}>{locale === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'}</th>
                          <th style={{ padding: '16px 24px' }}>{locale === 'ar' ? 'نوع الاتصال' : 'Connection Type'}</th>
                          <th style={{ padding: '16px 24px' }}>{locale === 'ar' ? 'حالة الجلسة' : 'Status'}</th>
                          <th style={{ padding: '16px 24px' }}>{locale === 'ar' ? 'رمز المطورين Token' : 'API Token'}</th>
                          <th style={{ padding: '16px 24px', textAlign: 'center' }}>{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingInstances ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                {locale === 'ar' ? 'جاري تحميل الأجهزة...' : 'Loading devices...'}
                              </div>
                            </td>
                          </tr>
                        ) : instances.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
                              <Smartphone size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                              <p style={{ margin: 0, fontSize: '15px' }}>{locale === 'ar' ? 'لم تقم بربط أي جهاز بعد. اضغط على إضافة جهاز جديد للبدء!' : 'No devices added yet. Click Add New Device to start!'}</p>
                            </td>
                          </tr>
                        ) : (
                          instances.map(inst => (
                            <tr key={inst.id} style={{ transition: 'background 0.2s', borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '16px 24px' }}>
                                <button onClick={() => {
                                  setSelectedInstance(inst);
                                  setWebhookUrl(inst.webhook_url || '');
                                  setWebhookEnabled(inst.webhook_enabled);
                                  setWhMsgRec(inst.wh_message_received);
                                  setWhMsgSent(inst.wh_message_sent);
                                  setWhStatChange(inst.wh_status_changed);
                                  setWhGroupJoin(inst.wh_group_member_join);
                                  setWhGroupLeave(inst.wh_group_member_leave);
                                  setWhQrUpd(inst.wh_qr_updated);
                                  setFaqRules(inst.faq_rules || []);
                                }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 800, fontSize: '15px', padding: 0, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                                  {inst.instance_name}
                                </button>
                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                  ID: {inst.id}
                                </div>
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <div style={{ fontWeight: 600, color: inst.phone_number ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                  {inst.phone_number ? `+${inst.phone_number}` : (locale === 'ar' ? 'غير متوفر' : 'N/A')}
                                </div>
                                {inst.quality_rating && (
                                  <div style={{ marginTop: '4px' }}>
                                    <span style={{
                                      display: 'inline-block',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: inst.quality_rating.toLowerCase() === 'green' ? 'rgba(39, 174, 96, 0.1)' : inst.quality_rating.toLowerCase() === 'yellow' ? 'rgba(242, 201, 76, 0.1)' : 'rgba(235, 87, 87, 0.1)',
                                      color: inst.quality_rating.toLowerCase() === 'green' ? '#27ae60' : inst.quality_rating.toLowerCase() === 'yellow' ? '#d97706' : '#EB5757',
                                    }}>
                                      {inst.quality_rating.toUpperCase()} Rating
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  background: inst.instance_type === 'web_qr' ? 'rgba(39, 174, 96, 0.1)' : 'rgba(24, 119, 242, 0.1)',
                                  color: inst.instance_type === 'web_qr' ? '#27ae60' : '#1877F2',
                                  padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700
                                }}>
                                  {inst.instance_type === 'web_qr' ? <Smartphone size={14} /> : <Zap size={14} />}
                                  {inst.instance_type === 'web_qr' ? 'QR Code' : 'Meta API'}
                                </span>
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  background: inst.status === 'connected' ? 'var(--success-bg)' : inst.status === 'qrcode' || inst.status === 'connecting' ? '#f59e0b20' : 'rgba(235,87,87,0.1)',
                                  color: inst.status === 'connected' ? 'var(--success)' : inst.status === 'qrcode' || inst.status === 'connecting' ? '#f59e0b' : '#EB5757',
                                  padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700
                                }}>
                                  {inst.status === 'connected' ? <CheckCircle size={14} /> : inst.status === 'qrcode' ? <Smartphone size={14} /> : <AlertCircle size={14} />}
                                  {inst.status === 'connected' ? (locale === 'ar' ? 'متصل' : 'Connected')
                                    : inst.status === 'qrcode' ? (locale === 'ar' ? 'بانتظار مسح QR' : 'Waiting for QR')
                                      : inst.status === 'connecting' ? (locale === 'ar' ? 'جاري الاتصال...' : 'Connecting...')
                                        : (locale === 'ar' ? 'غير متصل' : 'Disconnected')}
                                </span>
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                  <code style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '2px' }}>
                                    {inst.api_key ? `••••••••${inst.api_key.substring(inst.api_key.length - 4)}` : '••••••••'}
                                  </code>
                                  <button onClick={() => { navigator.clipboard.writeText(inst.api_key); setToastMsg(locale === 'ar' ? 'تم نسخ الـ Token' : 'Token Copied!'); setTimeout(() => setToastMsg(''), 3000); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }} title={locale === 'ar' ? 'نسخ' : 'Copy'}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button onClick={() => {
                                    setSelectedInstance(inst);
                                    setWebhookUrl(inst.webhook_url || '');
                                    setWebhookEnabled(inst.webhook_enabled);
                                    setWhMsgRec(inst.wh_message_received);
                                    setWhMsgSent(inst.wh_message_sent);
                                    setWhStatChange(inst.wh_status_changed);
                                    setWhGroupJoin(inst.wh_group_member_join);
                                    setWhGroupLeave(inst.wh_group_member_leave);
                                    setWhQrUpd(inst.wh_qr_updated);
                                    setFaqRules(inst.faq_rules || []);
                                  }} className="btn btn-sm btn-outline" style={{ background: 'var(--bg-tertiary)' }}>
                                    {locale === 'ar' ? 'إدارة' : 'Manage'}
                                  </button>
                                  <button onClick={() => handleDeleteInstance(inst.id)} className="btn btn-sm btn-outline" style={{ color: '#EB5757', borderColor: '#EB575740', background: 'var(--bg-tertiary)' }} title={locale === 'ar' ? 'حذف' : 'Delete'}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          { }
          {activeItem === 'apiKeys' && !isAdminMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                <h3 style={{ marginBottom: '14px', fontWeight: 700 }}>{locale === 'ar' ? 'مفاتيح الربط والتوثيق التلقائي للمطورين' : 'Auto API Documentation & Tokens'}</h3>

                {instances.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>{locale === 'ar' ? 'يرجى إضافة جهاز أولاً للحصول على مفتاح API.' : 'Please add a device to obtain an API key.'}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {instances.map(inst => (
                      <div key={inst.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '12px 18px', borderRadius: '8px' }}>
                        <div>
                          <strong>{inst.instance_name}</strong>
                          <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-secondary)' }}>ID: {inst.id}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '600px', flex: 1 }}>
                          <div style={{ flex: 1, minWidth: 0, padding: '8px', fontSize: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', fontFamily: 'monospace', wordBreak: 'break-all', userSelect: 'all', overflowWrap: 'anywhere' }}>{inst.api_key}</div>
                          <button onClick={() => { navigator.clipboard.writeText(inst.api_key); alert('Token Copied!'); }} className="btn btn-sm btn-outline" style={{ whiteSpace: 'nowrap', height: 'fit-content' }}>
                            {locale === 'ar' ? 'نسخ المفتاح' : 'Copy Token'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              { }
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>{locale === 'ar' ? 'منصة اختبار الطلبات التفاعلية (Try it Now)' : 'Interactive API playground'}</h3>

                <div className={styles.settingsGrid}>
                  { }
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
                    {instances.length > 0 && (
                      <div>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>{locale === 'ar' ? 'جهاز التجربة (Test WhatsApp Device):' : 'Test Device:'}</label>
                        <select
                          value={selectedInstance?.id || instances[0].id}
                          onChange={(e) => {
                            const inst = instances.find(i => i.id === Number(e.target.value));
                            setSelectedInstance(inst || null);
                          }}
                          style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }}
                        >
                          {instances.map(inst => (
                            <option key={inst.id} value={inst.id}>
                              {inst.instance_name} ({inst.phone_number || 'Disconnected'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>{locale === 'ar' ? 'نقطة النهاية (Endpoint):' : 'API Endpoint:'}</label>
                      <select value={playgroundEndpoint} onChange={(e) => {
                        setPlaygroundEndpoint(e.target.value);

                        if (e.target.value.includes('text')) {
                          setPlaygroundBody('{\n  "to": "966500000000",\n  "body": "تجربة إرسال رسالة نصية عبر المطورين"\n}');
                        } else if (e.target.value.includes('media')) {
                          setPlaygroundBody('{\n  "to": "966500000000",\n  "type": "image",\n  "link": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",\n  "caption": "مرحباً بك من المطورين"\n}');
                        } else if (e.target.value.includes('buttons')) {
                          setPlaygroundBody('{\n  "to": "966500000000",\n  "text": "هل تفضل العرض؟",\n  "buttons": ["نعم أريد", "لا شكراً"],\n  "footer": "TrustChat API"\n}');
                        } else if (e.target.value.includes('list')) {
                          setPlaygroundBody('{\n  "to": "966500000000",\n  "text": "الرجاء اختيار الخدمة:",\n  "title": "خدماتنا",\n  "buttonText": "عرض القائمة",\n  "sections": [\n    {\n      "title": "القسم الأول",\n      "rows": [\n        {"rowId": "srv1", "title": "تفعيل البوت", "description": "تفعيل المجيب الذكي"},\n        {"rowId": "srv2", "title": "الدعم الفني", "description": "محادثة عميل للرد"} \n      ]\n    }\n  ]\n}');
                        } else {
                          setPlaygroundBody('{\n  "to": "966500000000"\n}');
                        }
                      }} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
                        <option value="/api/v1/whatsapp/send/text/">Send Message (Text)</option>
                        <option value="/api/v1/whatsapp/send/media/">Send Media (Image/Video/File/Audio)</option>
                        <option value="/api/v1/whatsapp/send/buttons/">Send Buttons</option>
                        <option value="/api/v1/whatsapp/send/list/">Send Lists</option>
                        <option value="/api/v1/whatsapp/chats/">Get Chats</option>
                        <option value="/api/v1/whatsapp/contacts/">Get Contacts</option>
                        <option value="/api/v1/whatsapp/groups/">Get Groups</option>
                        <option value="/api/v1/whatsapp/logout/">Logout Device Session</option>
                        <option value="/api/v1/whatsapp/restart/">Restart Device Session</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>JSON Request Payload:</label>
                      <textarea rows={8} value={playgroundBody} onChange={(e) => setPlaygroundBody(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px' }} />
                    </div>

                    <button onClick={handleTestEndpoint} disabled={playgroundLoading} className="btn btn-primary" style={{ width: '100%' }}>
                      {playgroundLoading ? '...' : (locale === 'ar' ? 'جرب الآن ⚡' : 'Try it Now ⚡')}
                    </button>
                  </div>

                  { }
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
                    { }
                    <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                      {['python', 'javascript', 'php'].map(lang => (
                        <button key={lang} onClick={() => setActiveLangTab(lang)} style={{
                          padding: '6px 12px', background: 'none', border: 'none', borderBottom: activeLangTab === lang ? '2px solid var(--primary)' : 'none',
                          fontWeight: 700, cursor: 'pointer', color: activeLangTab === lang ? 'var(--primary)' : 'var(--text-secondary)'
                        }}>
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <pre style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', fontSize: '12px', overflow: 'auto', maxHeight: '180px', fontFamily: 'monospace', direction: 'ltr', maxWidth: '100%' }}>
                      <code>{getPlaygroundSnippet()}</code>
                    </pre>

                    <h4>JSON API Response Output:</h4>
                    <pre style={{ background: 'black', color: '#27ae60', padding: '12px', borderRadius: '6px', fontSize: '12px', overflow: 'auto', minHeight: '130px', fontFamily: 'monospace', direction: 'ltr', maxWidth: '100%' }}>
                      <code>{playgroundResponse || '{}'}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          { }
          {activeItem === 'webhooks' && !isAdminMode && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>{locale === 'ar' ? 'إعدادات الويب هوك وتحديد الأحداث (Webhooks)' : 'Webhook Configuration'}</h3>

              {instances.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>{locale === 'ar' ? 'يرجى ربط جهاز أولاً لتعديل الويب هوك.' : 'Please add a device session to manage webhooks.'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {instances.map(inst => (
                    <div key={inst.id} style={{ border: '1px solid var(--border-light)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <strong>{inst.instance_name}</strong>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <label style={{ fontSize: '13px' }}>{locale === 'ar' ? 'تفعيل الويب هوك:' : 'Webhook status:'}</label>
                          <input type="checkbox" checked={webhookEnabled} onChange={(e) => setWebhookEnabled(e.target.checked)} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                        <input type="url" placeholder="https://yourdomain.com/webhook" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} style={{ flex: 1, padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                        <button onClick={() => handleSaveWebhookSettings(inst.id)} className="btn btn-primary">
                          {locale === 'ar' ? 'حفظ' : 'Save'}
                        </button>
                      </div>

                      { }
                      <h5>{locale === 'ar' ? 'أحداث الويب هوك المفعلة:' : 'Trigger Webhook for Events:'}</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
                          <input type="checkbox" checked={whMsgRec} onChange={(e) => setWhMsgRec(e.target.checked)} />
                          {locale === 'ar' ? 'استقبال رسالة' : 'Message Received'}
                        </label>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
                          <input type="checkbox" checked={whMsgSent} onChange={(e) => setWhMsgSent(e.target.checked)} />
                          {locale === 'ar' ? 'إرسال رسالة' : 'Message Sent'}
                        </label>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
                          <input type="checkbox" checked={whStatChange} onChange={(e) => setWhStatChange(e.target.checked)} />
                          {locale === 'ar' ? 'تغيير حالة الاتصال' : 'Connection Status Changed'}
                        </label>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
                          <input type="checkbox" checked={whGroupJoin} onChange={(e) => setWhGroupJoin(e.target.checked)} />
                          {locale === 'ar' ? 'دخول عضو للمجموعة' : 'Member Joined Group'}
                        </label>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
                          <input type="checkbox" checked={whGroupLeave} onChange={(e) => setWhGroupLeave(e.target.checked)} />
                          {locale === 'ar' ? 'خروج عضو من المجموعة' : 'Member Left Group'}
                        </label>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
                          <input type="checkbox" checked={whQrUpd} onChange={(e) => setWhQrUpd(e.target.checked)} />
                          {locale === 'ar' ? 'تحديث كود الـ QR' : 'QR Updated'}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          { }

          {activeItem === 'aiRules' && !isAdminMode && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Premium Page Header */}
              <div style={{ background: 'linear-gradient(135deg, var(--surface) 0%, rgba(var(--primary-rgb), 0.05) 100%)', borderRadius: 'var(--radius-xl)', padding: '32px 24px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Bot size={32} color="var(--primary)" />
                    {locale === 'ar' ? 'المجيب التلقائي' : 'Auto Responder'}
                  </h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px' }}>
                    {locale === 'ar' ? 'تحكم في طريقة الرد على رسائل عملائك لكل جهاز واتساب.' : 'Control how you reply to customer messages for each WhatsApp device.'}
                  </p>
                </div>
                
                {/* Compact Status Indicator */}
                <div style={{ background: 'var(--bg-primary)', padding: '12px 20px', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>{locale === 'ar' ? 'الجهاز' : 'Device'}:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedInstance ? (selectedInstance.instance_name || selectedInstance.phone_number) : (locale === 'ar' ? 'لم يتم التحديد' : 'Not Selected')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', alignItems: 'center' }}>
                    <span>{locale === 'ar' ? 'حالة الاتصال' : 'Status'}:</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: selectedInstance?.status === 'connected' ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedInstance?.status === 'connected' ? 'var(--success)' : 'var(--error)' }}></span>
                      {selectedInstance?.status === 'connected' ? (locale === 'ar' ? 'متصل' : 'Connected') : (locale === 'ar' ? 'غير متصل' : 'Disconnected')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>{locale === 'ar' ? 'الوضع الحالي' : 'Current Mode'}:</span>
                    <strong style={{ color: 'var(--primary)' }}>
                      {botMode === 'ai' ? (locale === 'ar' ? 'الذكاء الاصطناعي' : 'AI Mode') : botMode === 'qa' ? (locale === 'ar' ? 'الكلمات المفتاحية' : 'Keywords') : (locale === 'ar' ? 'معطل' : 'Disabled')}
                    </strong>
                  </div>
                </div>
              </div>

              {instances.length === 0 ? (
                <div style={{ background: 'var(--surface)', border: '1px dashed var(--border-light)', padding: '40px', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
                  <Smartphone size={48} color="var(--text-tertiary)" style={{ opacity: 0.5, marginBottom: '16px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 600 }}>{locale === 'ar' ? 'يرجى ربط جهاز أولاً لتعديل إعدادات المجيب.' : 'Please add a device session to configure auto-reply settings.'}</p>
                </div>
              ) : (
                <>
                  {/* Premium Device Selector */}
                  <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)' }}>
                    <label style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '15px' }}>
                      <Smartphone size={18} color="var(--primary)" />
                      {locale === 'ar' ? 'اختر الجهاز لإعداد المجيب:' : 'Select Device to Configure:'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={selectedInstance?.id || ''}
                        onChange={(e) => {
                          const inst = instances.find(i => i.id === Number(e.target.value));
                          setSelectedInstance(inst || null);
                          if (inst) {
                             setBotMode(inst.bot_mode || 'off');
                             setAiProvider(inst.ai_provider || 'gemini');
                             setAiModel(inst.ai_model || 'gemini-2.5-flash');
                          }
                        }}
                        style={{ width: '100%', padding: '16px 48px 16px 16px', appearance: 'none', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', transition: 'border-color 0.2s' }}
                      >
                        <option value="">{locale === 'ar' ? '-- اختر جهازاً --' : '-- Choose a Device --'}</option>
                        {instances.map(inst => (
                          <option key={inst.id} value={inst.id}>
                            {inst.instance_name} {inst.phone_number ? `(${inst.phone_number})` : ''} - {inst.status === 'connected' ? (locale === 'ar' ? 'متصل' : 'Connected') : (locale === 'ar' ? 'غير متصل' : 'Disconnected')}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)' }} />
                    </div>
                    {selectedInstance && selectedInstance.status !== 'connected' && (
                      <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(235, 87, 87, 0.1)', border: '1px solid rgba(235, 87, 87, 0.2)', borderRadius: '8px', color: 'var(--error)', fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <AlertCircle size={18} />
                        {locale === 'ar' ? 'هذا الجهاز غير متصل حالياً، ولن يعمل الرد التلقائي حتى إعادة الاتصال.' : 'This device is currently disconnected. Auto-responder will not work until reconnected.'}
                      </div>
                    )}
                  </div>

                  {selectedInstance && (
                    <>
                      {/* Reply Mode Selection */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        
                        {/* Mode: Disabled */}
                        <div 
                          onClick={() => { setBotMode('off'); handleSaveBotSettings(selectedInstance.id, true, 'off'); }}
                          style={{ background: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-xl)', border: botMode === 'off' ? '2px solid var(--primary)' : '1px solid var(--border-light)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', transition: 'all 0.2s ease', transform: botMode === 'off' ? 'translateY(-2px)' : 'none', boxShadow: botMode === 'off' ? '0 8px 24px rgba(var(--primary-rgb), 0.15)' : 'none' }}
                        >
                          {botMode === 'off' && <div style={{ position: 'absolute', top: '16px', left: locale === 'ar' ? '16px' : 'auto', right: locale === 'en' ? '16px' : 'auto', color: 'var(--primary)' }}><CheckCircle2 size={24} /></div>}
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: botMode === 'off' ? 'var(--primary)' : 'var(--bg-tertiary)', color: botMode === 'off' ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                            <PowerOff size={24} />
                          </div>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>{locale === 'ar' ? 'معطل' : 'Disabled'}</h4>
                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{locale === 'ar' ? 'إيقاف الردود التلقائية لهذا الجهاز.' : 'Stop all auto-replies for this device.'}</p>
                          </div>
                        </div>

                        {/* Mode: AI */}
                        <div 
                          onClick={() => { setBotMode('ai'); handleSaveBotSettings(selectedInstance.id, true, 'ai'); }}
                          style={{ background: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-xl)', border: botMode === 'ai' ? '2px solid var(--primary)' : '1px solid var(--border-light)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', transition: 'all 0.2s ease', transform: botMode === 'ai' ? 'translateY(-2px)' : 'none', boxShadow: botMode === 'ai' ? '0 8px 24px rgba(var(--primary-rgb), 0.15)' : 'none' }}
                        >
                          {botMode === 'ai' && <div style={{ position: 'absolute', top: '16px', left: locale === 'ar' ? '16px' : 'auto', right: locale === 'en' ? '16px' : 'auto', color: 'var(--primary)' }}><CheckCircle2 size={24} /></div>}
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: botMode === 'ai' ? 'var(--primary)' : 'var(--bg-tertiary)', color: botMode === 'ai' ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                            <Sparkles size={24} />
                          </div>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>{locale === 'ar' ? 'الذكاء الاصطناعي' : 'Smart AI'}</h4>
                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{locale === 'ar' ? 'إنشاء ردود ذكية تلقائياً حسب سياق الرسالة.' : 'Generate smart contextual replies automatically.'}</p>
                          </div>
                        </div>

                        {/* Mode: Keywords */}
                        <div 
                          onClick={() => { setBotMode('qa'); handleSaveBotSettings(selectedInstance.id, true, 'qa'); }}
                          style={{ background: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-xl)', border: botMode === 'qa' ? '2px solid var(--primary)' : '1px solid var(--border-light)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', transition: 'all 0.2s ease', transform: botMode === 'qa' ? 'translateY(-2px)' : 'none', boxShadow: botMode === 'qa' ? '0 8px 24px rgba(var(--primary-rgb), 0.15)' : 'none' }}
                        >
                          {botMode === 'qa' && <div style={{ position: 'absolute', top: '16px', left: locale === 'ar' ? '16px' : 'auto', right: locale === 'en' ? '16px' : 'auto', color: 'var(--primary)' }}><CheckCircle2 size={24} /></div>}
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: botMode === 'qa' ? 'var(--primary)' : 'var(--bg-tertiary)', color: botMode === 'qa' ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                            <MessageSquare size={24} />
                          </div>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>{locale === 'ar' ? 'الكلمات المفتاحية' : 'Keywords'}</h4>
                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{locale === 'ar' ? 'الرد باستخدام قواعد وكلمات مفتاحية محددة.' : 'Reply using predefined keyword rules and conditions.'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Content Area */}
                      <div style={{ marginTop: '8px' }}>
                        
                        {botMode === 'off' && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} style={{ background: 'var(--surface)', padding: '48px 24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(160, 174, 192, 0.1)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <PowerOff size={32} />
                            </div>
                            <div>
                              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700 }}>{locale === 'ar' ? 'المجيب التلقائي متوقف' : 'Auto Responder is Disabled'}</h3>
                              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px' }}>{locale === 'ar' ? 'لن يتم إرسال أي رد تلقائي من هذا الجهاز. لتفعيل الردود، اختر الذكاء الاصطناعي أو الكلمات المفتاحية من الأعلى.' : 'No automated replies will be sent from this device. Select AI or Keywords above to enable.'}</p>
                            </div>
                          </motion.div>
                        )}

                        {botMode === 'ai' && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                            {/* Settings Form */}
                            <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
                                <Settings size={22} color="var(--primary)" />
                                {locale === 'ar' ? 'إعدادات الذكاء الاصطناعي' : 'AI Settings'}
                              </h3>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{locale === 'ar' ? 'مزود الخدمة:' : 'Provider:'}</label>
                                  <select value={aiProvider} onChange={(e) => { const provider = e.target.value; setAiProvider(provider); if (provider === 'gemini') setAiModel('gemini-2.5-flash'); else if (provider === 'openai') setAiModel('gpt-4o-mini'); else if (provider === 'claude') setAiModel('claude-3-5-sonnet-latest'); else if (provider === 'deepseek') setAiModel('deepseek-chat'); else if (provider === 'groq') setAiModel('llama-3.3-70b-versatile'); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="claude">Anthropic Claude</option>
                                    <option value="deepseek">DeepSeek AI</option>
                                    <option value="groq">Groq (Llama)</option>
                                  </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{locale === 'ar' ? 'نموذج الذكاء الاصطناعي:' : 'AI Model:'}</label>
                                  <input type="text" value={aiModel} onChange={(e) => setAiModel(e.target.value)} placeholder="model-name" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{locale === 'ar' ? 'مفتاح واجهة التطبيق (API Key):' : 'API Key:'}</label>
                                <input type="password" value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)} placeholder="sk-..." style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'monospace' }} />
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{locale === 'ar' ? 'معلومات وتعليمات العمل (System Prompt):' : 'Business Context (System Prompt):'}</label>
                                <textarea rows={6} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder={locale === 'ar' ? 'اكتب هنا تفاصيل عملك، أسعار الخدمات، أوقات العمل، طريقة التواصل، لكي يجيب المساعد الذكي بدقة...' : 'Write business details, working hours, services, and pricing so the bot replies accurately...'} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }} />
                              </div>

                              <button onClick={() => handleSaveBotSettings(selectedInstance.id)} disabled={savingBotSettings} className="btn btn-primary" style={{ width: '100%', height: '48px', fontSize: '15px' }}>
                                {savingBotSettings ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Save size={18} /> {locale === 'ar' ? 'حفظ إعدادات الذكاء الاصطناعي' : 'Save AI Settings'}</span>}
                              </button>
                            </div>

                            {/* Preview Area */}
                            <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
                              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '24px' }}>
                                <Smartphone size={22} color="var(--primary)" />
                                {locale === 'ar' ? 'اختبر المجيب' : 'Test Auto Responder'}
                              </h3>
                              
                              <div style={{ flex: 1, background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '16px', background: 'rgba(var(--primary-rgb), 0.1)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Bot size={20} /></div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{locale === 'ar' ? 'المساعد الذكي' : 'Smart Assistant'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--primary)' }}>{locale === 'ar' ? 'الذكاء الاصطناعي مفعل' : 'AI Mode Active'}</div>
                                  </div>
                                </div>
                                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '240px', overflowY: 'auto' }}>
                                  <div style={{ alignSelf: 'flex-end', background: 'var(--primary)', color: 'white', padding: '12px 16px', borderRadius: '16px 16px 0 16px', fontSize: '14px', maxWidth: '85%' }}>
                                    {aiTestMessage || (locale === 'ar' ? 'اكتب رسالة لتجربة الرد التلقائي...' : 'Type a message to test the auto-responder...')}
                                  </div>
                                  {testingAI && (
                                    <div style={{ alignSelf: 'flex-start', background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '16px 16px 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                      {locale === 'ar' ? 'جاري التفكير...' : 'Thinking...'}
                                    </div>
                                  )}
                                  {aiTestResponse && !testingAI && (
                                    <div style={{ alignSelf: 'flex-start', background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '16px 16px 16px 0', fontSize: '14px', color: 'var(--text-primary)', maxWidth: '85%' }}>
                                      {aiTestResponse}
                                    </div>
                                  )}
                                </div>
                                <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)', background: 'var(--surface)', display: 'flex', gap: '8px' }}>
                                  <input type="text" value={aiTestMessage} onChange={(e) => setAiTestMessage(e.target.value)} placeholder={locale === 'ar' ? 'اكتب رسالة تجريبية...' : 'Type test message...'} style={{ flex: 1, padding: '10px 16px', borderRadius: '20px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} onKeyDown={(e) => { if (e.key === 'Enter') handleTestAI(); }} />
                                  <button onClick={handleTestAI} disabled={testingAI || !aiTestMessage.trim()} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: testingAI ? 0.5 : 1 }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {botMode === 'qa' && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                            {/* Keywords Header & Stats */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                              <div>
                                <h3 style={{ margin: '0 0 8px 0', fontWeight: 800, fontSize: '20px' }}>{locale === 'ar' ? 'إدارة قواعد الكلمات المفتاحية' : 'Manage Keyword Rules'}</h3>
                                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Package size={16} color="var(--primary)" /> {locale === 'ar' ? 'إجمالي القواعد:' : 'Total Rules:'} <strong style={{ color: 'var(--text-primary)' }}>{faqRules.length}</strong></span>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="var(--success)" /> {locale === 'ar' ? 'النشطة:' : 'Active:'} <strong style={{ color: 'var(--text-primary)' }}>{faqRules.filter(r => r.is_active).length}</strong></span>
                                </div>
                              </div>
                              <button onClick={() => setIsAddRuleModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Plus size={18} /> {locale === 'ar' ? 'إضافة قاعدة جديدة' : 'Add New Rule'}
                              </button>
                            </div>

                            {/* Rules List (Premium Cards/Table) */}
                            {faqRules.length === 0 ? (
                              <div style={{ background: 'var(--surface)', padding: '48px', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-light)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                <MessageSquare size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                                <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{locale === 'ar' ? 'لا توجد قواعد مضافة بعد.' : 'No keyword rules added yet.'}</p>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {faqRules.map(rule => (
                                  <div key={rule.id} style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px', opacity: rule.is_active ? 1 : 0.6, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                    <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>{locale === 'ar' ? 'الكلمة المفتاحية' : 'Keyword'}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <code style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '14px', fontWeight: 700 }}>{rule.keyword}</code>
                                        <span style={{ fontSize: '12px', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-secondary)' }}>{rule.matching_type}</span>
                                      </div>
                                    </div>
                                    <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>{locale === 'ar' ? 'الرد التلقائي' : 'Auto Reply'} ({rule.action_type})</span>
                                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rule.answer}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '24px', cursor: 'pointer' }} onClick={() => handleToggleRuleStatus(rule.id, !rule.is_active)}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: rule.is_active ? 'var(--success)' : 'var(--text-secondary)' }}>{rule.is_active ? (locale === 'ar' ? 'نشطة' : 'Active') : (locale === 'ar' ? 'معطلة' : 'Disabled')}</span>
                                        {rule.is_active ? <ToggleRight size={20} color="var(--success)" /> : <ToggleLeft size={20} color="var(--text-secondary)" />}
                                      </div>
                                      <button onClick={() => handleDeleteFaqRule(rule.id)} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid rgba(235, 87, 87, 0.2)', background: 'rgba(235, 87, 87, 0.05)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Rule Modal */}
                            <AnimatePresence>
                              {isAddRuleModalOpen && (
                                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: 'var(--surface)', width: '100%', maxWidth: '600px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{locale === 'ar' ? 'إضافة قاعدة جديدة' : 'Add New Rule'}</h3>
                                      <button onClick={() => setIsAddRuleModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={24} /></button>
                                    </div>
                                    <form onSubmit={(e) => { handleAddFaqRule(e); if(newKeyword && newAnswer) setIsAddRuleModalOpen(false); }} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                      <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>{locale === 'ar' ? 'الكلمة المفتاحية:' : 'Keyword:'}</label>
                                        <input type="text" required value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder={locale === 'ar' ? 'مثال: أسعار، باقات، موقع' : 'e.g. price, plans, location'} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>{locale === 'ar' ? 'شرط المطابقة:' : 'Condition:'}</label>
                                          <select value={newMatchType} onChange={(e) => setNewMatchType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                            <option value="exact">{locale === 'ar' ? 'مطابقة كاملة' : 'Exact Match'}</option>
                                            <option value="contains">{locale === 'ar' ? 'يحتوي على النص' : 'Contains Keyword'}</option>
                                            <option value="starts_with">{locale === 'ar' ? 'يبدأ بـ' : 'Starts With'}</option>
                                            <option value="ends_with">{locale === 'ar' ? 'ينتهي بـ' : 'Ends With'}</option>
                                            <option value="regex">Regex Expression</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>{locale === 'ar' ? 'نوع الإجراء:' : 'Action Type:'}</label>
                                          <select value={newActionType} onChange={(e) => setNewActionType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                            <option value="text">{locale === 'ar' ? 'إرسال نص' : 'Send Text'}</option>
                                            <option value="image">{locale === 'ar' ? 'إرسال صورة' : 'Send Image'}</option>
                                            <option value="file">{locale === 'ar' ? 'إرسال ملف' : 'Send File'}</option>
                                            <option value="buttons">{locale === 'ar' ? 'إرسال أزرار خيارات' : 'Send Buttons'}</option>
                                            <option value="list">{locale === 'ar' ? 'إرسال قائمة' : 'Send List'}</option>
                                            <option value="handover">{locale === 'ar' ? 'تحويل للموظف المختص' : 'Handover to Agent'}</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>{locale === 'ar' ? 'نص الرد:' : 'Response Text:'}</label>
                                        <textarea required rows={4} value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} placeholder={locale === 'ar' ? 'الرد التلقائي المرسل للعميل...' : 'Auto reply text sent to customer...'} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }} />
                                      </div>
                                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                        <button type="button" onClick={() => setIsAddRuleModalOpen(false)} className="btn btn-outline" style={{ flex: 1, padding: '12px' }}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                                        <button type="submit" disabled={addingRule} className="btn btn-primary" style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                          {addingRule ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : <><Save size={18} /> {locale === 'ar' ? 'حفظ القاعدة' : 'Save Rule'}</>}
                                        </button>
                                      </div>
                                    </form>
                                  </motion.div>
                                </div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )}

                      </div>
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}

          { }


          {activeItem === 'interactive_bot' && !isAdminMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* 1. BRAND IDENTITY & PAGE HEADER */}
              <div style={{
                background: theme === 'dark' ? '#0B0D14' : '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                padding: '32px 24px',
                color: theme === 'dark' ? 'white' : '#1E293B',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: theme === 'dark' ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.04)',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: theme === 'dark' ? 'radial-gradient(circle at 100% 0%, rgba(245,130,50,0.15), transparent 40%)' : 'radial-gradient(circle at 100% 0%, rgba(245,130,50,0.08), transparent 50%)',
                  pointerEvents: 'none'
                }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '28px', fontWeight: 800, margin: 0, color: theme === 'dark' ? 'white' : '#1E293B' }}>
                    <Bot size={32} color="rgba(245,130,50,0.9)" />
                    {locale === 'ar' ? 'المجيب التلقائي' : 'Auto Responder'}
                  </h2>
                  <p style={{ margin: '8px 0 0 0', opacity: 0.7, fontSize: '15px' }}>
                    {locale === 'ar' ? 'أنشئ بوت واتساب ذكي لإدارة رسائل العملاء والردود التلقائية.' : 'Create a smart WhatsApp bot to manage customer messages and auto-replies.'}
                  </p>
                </div>

                {/* Header Status Area */}
                <div style={{
                  display: 'flex',
                  gap: '24px',
                  alignItems: 'center',
                  background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)',
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B' }}>{locale === 'ar' ? 'الجهاز' : 'Device'}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? 'white' : '#1E293B' }}>{selectedInstance ? selectedInstance.instance_name : (locale === 'ar' ? 'غير محدد' : 'None')}</span>
                  </div>
                  
                  <div style={{ width: '1px', height: '24px', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B' }}>{locale === 'ar' ? 'الحالة' : 'Status'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ 
                        width: '8px', height: '8px', borderRadius: '50%', 
                        background: !selectedInstance ? '#6B7280' : (selectedInstance.status === 'connected' ? '#10B981' : '#EF4444'),
                        boxShadow: `0 0 8px ${!selectedInstance ? '#6B7280' : (selectedInstance.status === 'connected' ? '#10B981' : '#EF4444')}`
                      }} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? 'white' : '#1E293B' }}>
                        {!selectedInstance ? (locale === 'ar' ? 'لا يوجد' : 'N/A') : (selectedInstance.status === 'connected' ? (locale === 'ar' ? 'متصل' : 'Connected') : (locale === 'ar' ? 'غير متصل' : 'Disconnected'))}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ width: '1px', height: '24px', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B' }}>{locale === 'ar' ? 'الوضع' : 'Mode'}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? 'white' : '#1E293B' }}>
                      {botMode === 'qa' ? (locale === 'ar' ? 'البوت التفاعلي' : 'Interactive Bot') : (locale === 'ar' ? 'معطل' : 'Disabled')}
                    </span>
                  </div>
                </div>
              </div>

              {instances.length === 0 ? (
                <div style={{ background: theme === 'dark' ? '#0B0D14' : '#FFFFFF', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)', padding: '48px', borderRadius: 'var(--radius-xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(245,130,50,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone size={32} color="rgba(245,130,50,0.9)" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: theme === 'dark' ? 'white' : '#1E293B' }}>{locale === 'ar' ? 'لم يتم اختيار جهاز' : 'No device selected'}</h3>
                  <p style={{ color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B', fontSize: '15px', margin: 0, maxWidth: '400px' }}>
                    {locale === 'ar' ? 'اختر جهاز واتساب لتفعيل المجيب التلقائي وإدارة الردود.' : 'Select a WhatsApp device to enable auto-responder and manage replies.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>

                  {/* Right/Left Column: Settings & Options */}
                  <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>

                    {/* 3. DEVICE SELECTION CARD */}
                    <div style={{ background: theme === 'dark' ? '#0B0D14' : '#FFFFFF', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: theme === 'dark' ? 'white' : '#1E293B', fontSize: '16px' }}>
                          <Smartphone size={18} color="rgba(245,130,50,0.9)" />
                          {locale === 'ar' ? 'الجهاز النشط' : 'Active Device'}
                        </h3>
                        
                        <div style={{ position: 'relative' }}>
                          <select
                            value={selectedInstance?.id || ''}
                            onChange={(e) => {
                              const inst = instances.find(i => i.id === Number(e.target.value));
                              setSelectedInstance(inst || null);
                            }}
                            style={{ 
                              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                              opacity: 0, cursor: 'pointer', zIndex: 2 
                            }}
                          >
                            <option value="">{locale === 'ar' ? '-- اختر جهازاً --' : '-- Choose Device --'}</option>
                            {instances.map(inst => (
                              <option key={inst.id} value={inst.id}>
                                {inst.instance_name} - {inst.status === 'connected' ? 'متصل' : 'غير متصل'}
                              </option>
                            ))}
                          </select>
                          <button style={{ 
                            background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F3F5', 
                            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)', 
                            color: theme === 'dark' ? 'white' : '#1E293B', 
                            padding: '8px 16px', 
                            borderRadius: '8px', 
                            fontSize: '13px', 
                            fontWeight: 600,
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            {locale === 'ar' ? 'تغيير الجهاز' : 'Change Device'} <ChevronDown size={14} />
                          </button>
                        </div>
                      </div>

                      {selectedInstance ? (
                        <div style={{ 
                          background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8F9FA', 
                          border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)', 
                          padding: '16px', 
                          borderRadius: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: theme === 'dark' ? 'white' : '#1E293B', fontWeight: 600, fontSize: '15px' }}>{selectedInstance.instance_name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: selectedInstance.status === 'connected' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: selectedInstance.status === 'connected' ? '#10B981' : '#EF4444' }} />
                              <span style={{ fontSize: '12px', fontWeight: 600, color: selectedInstance.status === 'connected' ? '#10B981' : '#EF4444' }}>
                                {selectedInstance.status === 'connected' ? (locale === 'ar' ? 'متصل' : 'Connected') : (locale === 'ar' ? 'غير متصل' : 'Disconnected')}
                              </span>
                            </div>
                          </div>
                          {selectedInstance.phone_number && (
                            <div style={{ fontSize: '13px', color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={14} /> {selectedInstance.phone_number}
                            </div>
                          )}
                          
                          {selectedInstance.status !== 'connected' && (
                            <div style={{ marginTop: '4px', padding: '10px 12px', background: 'rgba(235, 87, 87, 0.1)', border: '1px solid rgba(235, 87, 87, 0.2)', borderRadius: '8px', color: '#EB5757', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span>{locale === 'ar' ? 'الجهاز غير متصل، لن يعمل المجيب حتى إعادة الاتصال.' : 'Device disconnected, the bot will not work until the device is connected.'}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8F9FA', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                          <span style={{ color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B', fontSize: '14px' }}>{locale === 'ar' ? 'يرجى اختيار جهاز للبدء' : 'Please select a device to start'}</span>
                        </div>
                      )}
                    </div>


                    {selectedInstance && (
                      <>
                        {/* 6. SETTINGS AREA - Mode Selection */}
                        <div style={{ background: theme === 'dark' ? '#0B0D14' : '#FFFFFF', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)', paddingBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: theme === 'dark' ? 'white' : '#1E293B', fontSize: '16px' }}>
                              <Settings size={18} color="rgba(245,130,50,0.9)" />
                              {locale === 'ar' ? 'إعدادات المجيب' : 'Responder Settings'}
                            </h3>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            {/* Disabled Mode */}
                            <div 
                              onClick={() => setBotMode('off')}
                              style={{ 
                                padding: '16px', background: botMode === 'off' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', 
                                border: `1px solid ${botMode === 'off' ? 'rgba(245,130,50,0.4)' : 'rgba(255,255,255,0.05)'}`, 
                                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                boxShadow: botMode === 'off' ? '0 0 12px rgba(245,130,50,0.1)' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#E9ECEF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <PowerOff size={20} color={botMode === 'off' ? 'rgba(245,130,50,0.9)' : 'var(--text-secondary)'} />
                                </div>
                                <div>
                                  <div style={{ color: theme === 'dark' ? 'white' : '#1E293B', fontWeight: 600, fontSize: '15px' }}>{locale === 'ar' ? 'معطل' : 'Disabled'}</div>
                                  <div style={{ color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B', fontSize: '13px' }}>{locale === 'ar' ? 'إيقاف الردود التلقائية' : 'Stop auto-replies'}</div>
                                </div>
                              </div>
                              {botMode === 'off' && <CheckCircle2 size={20} color="rgba(245,130,50,0.9)" />}
                            </div>

                            {/* Interactive Bot Mode */}
                            <div 
                              onClick={() => setBotMode('qa')}
                              style={{ 
                                padding: '16px', background: botMode === 'qa' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', 
                                border: `1px solid ${botMode === 'qa' ? 'rgba(245,130,50,0.4)' : 'rgba(255,255,255,0.05)'}`, 
                                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                boxShadow: botMode === 'qa' ? '0 0 12px rgba(245,130,50,0.1)' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#E9ECEF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Zap size={20} color={botMode === 'qa' ? 'rgba(245,130,50,0.9)' : 'var(--text-secondary)'} />
                                </div>
                                <div>
                                  <div style={{ color: theme === 'dark' ? 'white' : '#1E293B', fontWeight: 600, fontSize: '15px' }}>{locale === 'ar' ? 'البوت التفاعلي' : 'Interactive Bot'}</div>
                                  <div style={{ color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B', fontSize: '13px' }}>{locale === 'ar' ? 'إعدادات الردود التلقائية والقواعد' : 'Rule-based precise replies'}</div>
                                </div>
                              </div>
                              {botMode === 'qa' && <CheckCircle2 size={20} color="rgba(245,130,50,0.9)" />}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', opacity: botMode === 'qa' ? 1 : 0.4, pointerEvents: botMode === 'qa' ? 'auto' : 'none' }}>
                            <div>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: theme === 'dark' ? 'var(--text-secondary)' : '#475569' }}><Bot size={14} /> {locale === 'ar' ? 'اسم البوت:' : 'Bot Name:'}</label>
                              <input type="text" value={interactiveBotName} onChange={e => setInteractiveBotName(e.target.value)} placeholder={locale === 'ar' ? "مثال: المساعد الذكي" : "e.g. Smart Assistant"} style={{ width: '100%', padding: '10px 14px', background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8F9FA', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', color: theme === 'dark' ? 'white' : '#1E293B', borderRadius: '8px' }} />
                            </div>
                            {botMode === 'qa' && (
                              <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: theme === 'dark' ? 'var(--text-secondary)' : '#475569' }}><KeyRound size={14} /> {locale === 'ar' ? 'كلمات التشغيل (مفصولة بفاصلة):' : 'Trigger Words:'}</label>
                                <input type="text" value={interactiveTrigger} onChange={e => setInteractiveTrigger(e.target.value)} placeholder="مرحبا, السلام عليكم, القائمة" style={{ width: '100%', padding: '10px 14px', background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8F9FA', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', color: theme === 'dark' ? 'white' : '#1E293B', borderRadius: '8px' }} />
                              </div>
                            )}
                            <div style={{ gridColumn: '1 / -1' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: theme === 'dark' ? 'var(--text-secondary)' : '#475569' }}><MessageCircle size={14} /> {locale === 'ar' ? 'الرسالة الترحيبية:' : 'Welcome Message:'}</label>
                              <textarea rows={3} value={interactiveWelcome} onChange={e => setInteractiveWelcome(e.target.value)} placeholder={locale === 'ar' ? "أهلاً بك في خدمة العملاء، الرجاء اختيار أحد الأرقام التالية:" : "Welcome! Please select an option:"} style={{ width: '100%', padding: '10px 14px', background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8F9FA', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', color: theme === 'dark' ? 'white' : '#1E293B', borderRadius: '8px', resize: 'vertical' }} />
                            </div>
                            {botMode === 'qa' && (
                              <>
                                <div>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: theme === 'dark' ? 'var(--text-secondary)' : '#475569' }}><AlertCircle size={14} /> {locale === 'ar' ? 'رسالة الخيار الخاطئ:' : 'Invalid Option Message:'}</label>
                                  <input type="text" value={interactiveInvalid} onChange={e => setInteractiveInvalid(e.target.value)} placeholder={locale === 'ar' ? "عذراً، الخيار غير صحيح." : "Sorry, invalid option."} style={{ width: '100%', padding: '10px 14px', background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8F9FA', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', color: theme === 'dark' ? 'white' : '#1E293B', borderRadius: '8px' }} />
                                </div>
                                <div>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: theme === 'dark' ? 'var(--text-secondary)' : '#475569' }}><FileText size={14} /> {locale === 'ar' ? 'نص التذييل (اختياري):' : 'Footer Text:'}</label>
                                  <input type="text" value={interactiveFooter} onChange={e => setInteractiveFooter(e.target.value)} placeholder="DarkFalcon API" style={{ width: '100%', padding: '10px 14px', background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8F9FA', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', color: theme === 'dark' ? 'white' : '#1E293B', borderRadius: '8px' }} />
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Options List (Only for Keywords) */}
                        {botMode === 'qa' && (
                          <div style={{ background: theme === 'dark' ? '#0B0D14' : '#FFFFFF', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                              <h3 style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: theme === 'dark' ? 'white' : '#1E293B', fontSize: '16px' }}>
                                <ClipboardList size={18} color="rgba(245,130,50,0.9)" />
                                {locale === 'ar' ? 'قائمة الخيارات' : 'Menu Options'}
                              </h3>
                              <span style={{ background: 'rgba(245,130,50,0.15)', color: 'rgba(245,130,50,0.9)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                                {faqRules.length} {locale === 'ar' ? 'خيارات' : 'Options'}
                              </span>
                            </div>

                            {/* Add New Option Form */}
                            <div style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8F9FA', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)' }}>
                              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: theme === 'dark' ? 'white' : '#1E293B' }}>
                                <Plus size={16} color="rgba(245,130,50,0.9)" /> {locale === 'ar' ? 'إضافة خيار جديد للقائمة' : 'Add New Option'}
                              </h4>
                              <form onSubmit={handleAddFaqRule} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '12px', alignItems: 'end' }}>
                                <div>
                                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: theme === 'dark' ? 'var(--text-secondary)' : '#475569' }}>{locale === 'ar' ? 'رقم الخيار:' : 'Number:'}</label>
                                  <input type="text" required value={newKeyword} onChange={(e) => { setNewKeyword(e.target.value); setNewMatchType('exact'); }} placeholder="1" style={{ width: '100%', padding: '10px', background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', color: theme === 'dark' ? 'white' : '#1E293B', borderRadius: '6px', textAlign: 'center', fontWeight: 700 }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: theme === 'dark' ? 'var(--text-secondary)' : '#475569' }}>{locale === 'ar' ? 'اسم الخيار:' : 'Option Name:'}</label>
                                  <input type="text" required value={newActionPayload} onChange={(e) => setNewActionPayload(e.target.value)} placeholder={locale === 'ar' ? "الاستعلام عن الأسعار" : "Inquire Prices"} style={{ width: '100%', padding: '10px', background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', color: theme === 'dark' ? 'white' : '#1E293B', borderRadius: '6px' }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: theme === 'dark' ? 'var(--text-secondary)' : '#475569' }}>{locale === 'ar' ? 'نوع الإجراء:' : 'Action Type:'}</label>
                                  <select value={newActionType} onChange={(e) => setNewActionType(e.target.value)} style={{ width: '100%', padding: '10px', background: theme === 'dark' ? '#1A1D24' : '#FFFFFF', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', color: theme === 'dark' ? 'white' : '#1E293B', borderRadius: '6px' }}>
                                    <option value="text">{locale === 'ar' ? 'رد نصي' : 'Text Reply'}</option>
                                    <option value="image">{locale === 'ar' ? 'إرسال صورة' : 'Send Image'}</option>
                                    <option value="file">{locale === 'ar' ? 'إرسال ملف' : 'Send File'}</option>
                                    <option value="webhook">{locale === 'ar' ? 'Webhook' : 'Webhook'}</option>
                                    <option value="handover">{locale === 'ar' ? 'تحويل للدعم' : 'Support Handover'}</option>
                                  </select>
                                </div>
                                <div style={{ gridColumn: '1 / span 2' }}>
                                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: theme === 'dark' ? 'var(--text-secondary)' : '#475569' }}>{locale === 'ar' ? 'محتوى الرد:' : 'Content / payload:'}</label>
                                  <input type="text" required value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} placeholder={locale === 'ar' ? "أدخل النص أو رابط الملف هنا..." : "Enter text or link..."} style={{ width: '100%', padding: '10px', background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', color: theme === 'dark' ? 'white' : '#1E293B', borderRadius: '6px' }} />
                                </div>
                                <button type="submit" disabled={addingRule} style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#E9ECEF', color: theme === 'dark' ? 'white' : '#1E293B', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
                                  <Plus size={16} /> {locale === 'ar' ? 'إضافة للقائمة' : 'Add to Menu'}
                                </button>
                              </form>
                            </div>

                            {/* Options Cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {faqRules.length === 0 ? (
                                <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B' }}>
                                  <ClipboardList size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                                  <p style={{ margin: 0 }}>{locale === 'ar' ? 'لا توجد خيارات مضافة. قم بإضافة خيارات لإنشاء القائمة.' : 'No options added yet.'}</p>
                                </div>
                              ) : (
                                faqRules.map((rule, index) => (
                                  <div key={rule.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', padding: '16px', background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8F9FA', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', transition: 'all 0.2s', opacity: rule.is_active ? 1 : 0.5 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B' }}><ArrowUp size={16} /></button>
                                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B' }}><ArrowDown size={16} /></button>
                                    </div>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245,130,50,0.15)', color: 'rgba(245,130,50,0.9)', border: '1px solid rgba(245,130,50,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', flexShrink: 0 }}>
                                      {rule.keyword}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: theme === 'dark' ? 'white' : '#1E293B' }}>{rule.action_payload || (locale === 'ar' ? 'بدون اسم' : 'Unnamed Option')}</h5>
                                      <p style={{ margin: 0, fontSize: '13px', color: theme === 'dark' ? 'var(--text-secondary)' : '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                                        {rule.answer}
                                      </p>
                                    </div>
                                    <div style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#E9ECEF', color: theme === 'dark' ? 'var(--text-secondary)' : '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                                      {rule.action_type === 'text' ? 'رد نصي' : rule.action_type === 'image' ? 'صورة' : rule.action_type === 'file' ? 'ملف' : rule.action_type === 'webhook' ? 'Webhook' : 'تحويل للدعم'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                      <button onClick={() => handleToggleRuleStatus(rule.id, !rule.is_active)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.is_active ? '#10B981' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                                        {rule.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                      </button>
                                      <button style={{ padding: '6px', background: 'transparent', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', borderRadius: '6px', color: theme === 'dark' ? 'white' : '#1E293B', cursor: 'pointer' }}><Pencil size={14} /></button>
                                      <button onClick={() => handleDeleteFaqRule(rule.id)} style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}

                        {/* Save Button */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: theme === 'dark' ? '#0B0D14' : '#FFFFFF', padding: '16px', borderRadius: 'var(--radius-xl)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)' }}>
                          <button
                            onClick={() => {
                              handleSaveBotSettings(selectedInstance.id);
                              if (botMode === 'qa' && faqRules.length > 0) {
                                alert(locale === 'ar' ? 'تم حفظ التعديلات بنجاح' : 'Saved successfully');
                              }
                            }}
                            disabled={savingBotSettings || (botMode === 'qa' && faqRules.length === 0)}
                            style={{
                              width: '100%',
                              height: '52px',
                              fontSize: '16px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px',
                              background: (savingBotSettings || (botMode === 'qa' && faqRules.length === 0)) ? 'rgba(255,255,255,0.05)' : 'rgba(245,130,50,0.15)',
                              color: (savingBotSettings || (botMode === 'qa' && faqRules.length === 0)) ? 'rgba(255,255,255,0.3)' : 'rgba(245,130,50,0.9)',
                              border: (savingBotSettings || (botMode === 'qa' && faqRules.length === 0)) ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(245,130,50,0.4)',
                              borderRadius: '12px',
                              cursor: (savingBotSettings || (botMode === 'qa' && faqRules.length === 0)) ? 'not-allowed' : 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {savingBotSettings ? '...' : <><Save size={20} /> {locale === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}</>}
                          </button>
                          {botMode === 'qa' && faqRules.length === 0 && (
                            <div style={{ marginTop: '12px', fontSize: '13px', color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertCircle size={14} />
                              {locale === 'ar' ? 'أضف خيارًا واحدًا على الأقل لتتمكن من الحفظ.' : 'Add at least one option to save.'}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* 4. CHAT PREVIEW DESIGN */}
                  <div style={{ flex: '0 0 auto', width: '100%', maxWidth: '380px', margin: '0 auto' }}>
                    <div style={{ 
                      background: theme === 'dark' ? '#0B0D14' : '#FFFFFF', 
                      borderRadius: '24px', 
                      padding: '8px', 
                      border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)', 
                      boxShadow: '0 24px 48px rgba(0,0,0,0.5)', 
                      position: 'relative', 
                      height: '650px', 
                      display: 'flex', 
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}>
                      {/* Preview Header */}
                      <div style={{ 
                        background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8F9FA', 
                        padding: '16px', 
                        borderRadius: '16px 16px 0 0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)'
                      }}>
                        <div style={{ width: '40px', height: '40px', background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#E9ECEF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Bot size={24} color="white" />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: theme === 'dark' ? 'white' : '#1E293B' }}>{interactiveBotName || (locale === 'ar' ? 'المجيب التفاعلي' : 'Interactive Bot')}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: botMode === 'qa' && selectedInstance?.status === 'connected' ? '#10B981' : '#6B7280' }} />
                            <span style={{ fontSize: '12px', color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B' }}>
                              {botMode === 'qa' && selectedInstance?.status === 'connected' ? (locale === 'ar' ? 'يعمل' : 'Active') : (locale === 'ar' ? 'غير متصل' : 'Offline')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Chat Body */}
                      <div style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '16px', 
                        padding: '16px',
                        background: theme === 'dark' ? '#0B0D14' : '#FFFFFF'
                      }}>
                        <div style={{ alignSelf: 'center', background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F3F5', padding: '6px 14px', borderRadius: '12px', fontSize: '11px', color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)' }}>
                          {locale === 'ar' ? 'المعاينة المباشرة' : 'Live Preview'}
                        </div>

                        {/* Trigger User Message */}
                        <div style={{ 
                          alignSelf: 'flex-start', 
                          background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#E9ECEF', 
                          padding: '12px 16px', 
                          borderRadius: '16px 16px 16px 4px', 
                          fontSize: '14px', 
                          color: theme === 'dark' ? 'white' : '#1E293B', 
                          maxWidth: '85%',
                          border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)'
                        }}>
                          {interactiveTrigger ? interactiveTrigger.split(',')[0].trim() : (locale === 'ar' ? 'مرحبا' : 'Hello')}
                        </div>

                        {/* Bot Response Message */}
                        {botMode === 'qa' && selectedInstance?.status === 'connected' && (
                          <div style={{ 
                            alignSelf: 'flex-end', 
                            background: theme === 'dark' ? 'rgba(245,130,50,0.1)' : '#FFF7ED', padding: '12px 16px', 
                            borderRadius: '16px 16px 4px 16px', 
                            fontSize: '14px', 
                            color: theme === 'dark' ? 'white' : '#1E293B', 
                            maxWidth: '85%',
                            border: '1px solid rgba(245,130,50,0.2)'
                          }}>
                            <p style={{ margin: '0 0 12px 0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                              {interactiveWelcome || (locale === 'ar' ? 'أهلاً بك، كيف يمكنني مساعدتك؟' : 'Welcome, how can I help you?')}
                            </p>

                            {botMode === 'qa' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)', paddingTop: '12px' }}>
                                {faqRules.length > 0 ? faqRules.map((rule) => (
                                  <div key={rule.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 800, color: 'rgba(245,130,50,0.9)' }}>{rule.keyword} -</span>
                                    <span style={{ fontWeight: 600, color: theme === 'dark' ? 'white' : '#1E293B' }}>{rule.action_payload || rule.answer}</span>
                                  </div>
                                )) : (
                                  <div style={{ fontStyle: 'italic', color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B', fontSize: '12px' }}>
                                    {locale === 'ar' ? '[سيتم عرض قائمة الخيارات هنا]' : '[Menu options will appear here]'}
                                  </div>
                                )}
                              </div>
                            )}

                            {interactiveFooter && (
                              <div style={{ marginTop: '12px', fontSize: '12px', color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B', borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)', paddingTop: '8px' }}>
                                {interactiveFooter}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Preview Invalid Option Simulation (Only QA) */}
                        {botMode === 'qa' && selectedInstance?.status === 'connected' && interactiveInvalid && (
                          <>
                            <div style={{ 
                              alignSelf: 'flex-start', 
                              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#E9ECEF', 
                              padding: '12px 16px', 
                              borderRadius: '16px 16px 16px 4px', 
                              fontSize: '14px', 
                              color: theme === 'dark' ? 'white' : '#1E293B', 
                              maxWidth: '85%',
                              border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)',
                              marginTop: '8px' 
                            }}>
                              99
                            </div>
                            <div style={{ 
                              alignSelf: 'flex-end', 
                              background: theme === 'dark' ? 'rgba(245,130,50,0.1)' : '#FFF7ED', padding: '12px 16px', 
                              borderRadius: '16px 16px 4px 16px', 
                              fontSize: '14px', 
                              color: theme === 'dark' ? 'white' : '#1E293B', 
                              maxWidth: '85%',
                              border: '1px solid rgba(245,130,50,0.2)',
                              marginTop: '8px' 
                            }}>
                              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5', color: theme === 'dark' ? '#F87171' : '#EF4444' }}>
                                {interactiveInvalid}
                              </p>
                            </div>
                          </>
                        )}

                      </div>

                      {/* Fake Input */}
                      <div style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#F8F9FA', padding: '12px', display: 'flex', gap: '10px', alignItems: 'center', borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)' }}>
                        <div style={{ flex: 1, background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#E9ECEF', height: '40px', borderRadius: '20px', padding: '0 16px', display: 'flex', alignItems: 'center', color: theme === 'dark' ? 'var(--text-tertiary)' : '#64748B', fontSize: '13px', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)' }}>
                          {locale === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
                        </div>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(245,130,50,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,130,50,0.9)', border: '1px solid rgba(245,130,50,0.3)' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeItem === 'chatbot' && !isAdminMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              { }
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                <h3 style={{ marginBottom: '14px', fontWeight: 700 }}>{locale === 'ar' ? 'سجل الحجوزات المسجلة عبر الشات بوت (نظام الحجوزات)' : 'Chatbot Booking Registrations Log'}</h3>

                {instances.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>{locale === 'ar' ? 'يرجى ربط جهاز أولاً لعرض الحجوزات.' : 'Please add a device session to view booking registrations.'}</p>
                ) : (
                  <div>
                    { }
                    <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
                      <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                        {locale === 'ar' ? 'اختر الجهاز لعرض حجوزاته المخصصة:' : 'Select WhatsApp device to filter bookings:'}
                      </label>
                      <select
                        value={selectedInstance?.id || ''}
                        onChange={(e) => {
                          const inst = instances.find(i => i.id === Number(e.target.value));
                          setSelectedInstance(inst || null);
                        }}
                        style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '6px' }}
                      >
                        <option value="">{locale === 'ar' ? '-- كل الأجهزة --' : '-- All Devices --'}</option>
                        {instances.map(inst => (
                          <option key={inst.id} value={inst.id}>
                            {inst.instance_name} ({inst.phone_number || 'Disconnected'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>{locale === 'ar' ? 'رقم العميل' : 'Customer Phone'}</th>
                            <th>{locale === 'ar' ? 'الاسم' : 'Name'}</th>
                            <th>{locale === 'ar' ? 'رقم الجوال' : 'Phone'}</th>
                            <th>{locale === 'ar' ? 'العنوان' : 'Address'}</th>
                            <th>{locale === 'ar' ? 'العمر' : 'Age'}</th>
                            <th>{locale === 'ar' ? 'حالة الحجز' : 'Status'}</th>
                            <th>{locale === 'ar' ? 'تاريخ التسجيل' : 'Date'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.filter(b => !selectedInstance || b.instance === selectedInstance.id).length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>{locale === 'ar' ? 'لا توجد حجوزات مسجلة حالياً.' : 'No booking records found.'}</td>
                            </tr>
                          ) : (
                            bookings.filter(b => !selectedInstance || b.instance === selectedInstance.id).map(b => (
                              <tr key={b.id}>
                                <td>{b.customer_phone}</td>
                                <td>{b.name || '-'}</td>
                                <td>{b.phone || '-'}</td>
                                <td>{b.address || '-'}</td>
                                <td>{b.age || '-'}</td>
                                <td>
                                  <span className={styles.statusBadge} style={{
                                    background: b.status === 'completed' ? 'var(--success-bg)' : 'rgba(242,153,74,0.1)'
                                  }}>
                                    {b.status}
                                  </span>
                                </td>
                                <td>{new Date(b.created_at).toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          { }
          {activeItem === 'logs' && !isAdminMode && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>{locale === 'ar' ? 'سجل عمليات الـ API وتوثيق الاستخدام' : 'API Operations Audit Logs'}</h3>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input type="text" placeholder={locale === 'ar' ? 'بحث باسم الطريقة أو رابط الـ endpoint...' : 'Search logs by endpoint or status...'} value={logSearchQuery} onChange={(e) => setLogSearchQuery(e.target.value)} style={{ flex: 1, padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>{locale === 'ar' ? 'الجهاز' : 'Device'}</th>
                      <th>{locale === 'ar' ? 'العملية (Method)' : 'Method'}</th>
                      <th>{locale === 'ar' ? 'الـ Endpoint' : 'Endpoint'}</th>
                      <th>{locale === 'ar' ? 'الحالة (Status)' : 'Status'}</th>
                      <th>{locale === 'ar' ? 'النتيجة (Outcome)' : 'Outcome'}</th>
                      <th>{locale === 'ar' ? 'عنوان الـ IP' : 'IP Location'}</th>
                      <th>{locale === 'ar' ? 'الوقت والتاريخ' : 'Timestamp'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>{locale === 'ar' ? 'لا يوجد سجلات عمليات لعرضها.' : 'No audit logs.'}</td>
                      </tr>
                    ) : (
                      apiLogs.filter(log => log.endpoint.toLowerCase().includes(logSearchQuery.toLowerCase()) || log.method.toLowerCase().includes(logSearchQuery.toLowerCase()))
                        .map(log => (
                          <tr key={log.id}>
                            <td>{log.instance_name || 'System/User'}</td>
                            <td><strong style={{ color: '#27ae60' }}>{log.method}</strong></td>
                            <td style={{ maxWidth: '150px', wordBreak: 'break-all', whiteSpace: 'normal' }}><code>{log.endpoint}</code></td>
                            <td>
                              <span style={{
                                padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700,
                                background: log.status_code >= 400 ? 'rgba(235,87,87,0.1)' : 'var(--success-bg)',
                                color: log.status_code >= 400 ? '#EB5757' : '#27ae60'
                              }}>
                                {log.status_code}
                              </span>
                            </td>
                            <td style={{ maxWidth: '200px', wordBreak: 'break-word', whiteSpace: 'normal' }}>{log.outcome}</td>
                            <td>{log.ip_address}</td>
                            <td>{new Date(log.created_at).toLocaleString()}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          { }
          {activeItem === 'billing' && !isAdminMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <UserCurrentPlanOverview
                subscription={subscription}
                locale={locale}
                renderPlanIcon={renderPlanIcon}
              />

              <div style={{
                position: 'relative',
                background: '#080A12',
                borderRadius: '24px',
                padding: '40px 24px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '24px'
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'radial-gradient(circle at 80% 5%, rgba(124,58,237,0.18), transparent 35%), radial-gradient(circle at 15% 35%, rgba(14,165,233,0.12), transparent 30%), radial-gradient(circle at 55% 100%, rgba(249,115,22,0.10), transparent 35%)',
                  pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '40px' }}>
                  <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '100px', fontSize: '13px', color: '#94A3B8', marginBottom: '16px' }}>
                    {locale === 'ar' ? 'خطط مرنة لجميع أحجام الأعمال' : 'Flexible plans for all businesses'}
                  </div>
                  <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                    {locale === 'ar' ? (
                      <>
                        اختر الباقة المناسبة <span style={{ background: 'linear-gradient(to right, #a855f7, #38bdf8, #fb923c)', WebkitBackgroundClip: 'text', color: 'transparent' }}>لنمو أعمالك</span>
                      </>
                    ) : (
                      <>
                        Choose the right plan to <span style={{ background: 'linear-gradient(to right, #a855f7, #38bdf8, #fb923c)', WebkitBackgroundClip: 'text', color: 'transparent' }}>grow your business</span>
                      </>
                    )}
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: '15px', maxWidth: '500px', margin: '0 auto' }}>
                    {locale === 'ar' ? 'خطط مرنة تمنحك الأدوات التي تحتاجها لإدارة محادثات عملائك وتطوير تجربة التواصل.' : 'Flexible plans that give you the tools you need to manage your customer conversations and evolve communication.'}
                  </p>
                </div>

                <div className={styles.plansGrid} style={{ position: 'relative', zIndex: 1 }}>
                  {plans.length === 0 ? (
                    <p style={{ color: '#fff', textAlign: 'center' }}>{locale === 'ar' ? 'لا توجد باقات مفعلة حالياً.' : 'No plans configured.'}</p>
                  ) : (
                    plans.map((p, index) => {
                      const isCurrentPlan = subscription?.plan_id === p.id;
                      const hasPendingInvoice = invoices && invoices.some(inv => inv.plan_id === p.id && inv.status === 'pending');

                      return (
                        <UserPlanCard
                          key={p.id}
                          plan={p}
                          index={index}
                          locale={locale}
                          isCurrentPlan={isCurrentPlan}
                          hasPendingInvoice={hasPendingInvoice}
                          renderPlanIcon={renderPlanIcon}
                          onSubscribe={openSubscribeModal}
                        />
                      );
                    })
                  )}
                </div>
              </div>

              {/* Transactions History */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                <h3 style={{ marginBottom: '14px', fontWeight: 700 }}>{locale === 'ar' ? 'سجل الفواتير السابقة' : 'Billing Transactions Invoices'}</h3>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{locale === 'ar' ? 'المبلغ المدفوع' : 'Amount'}</th>
                        <th>{locale === 'ar' ? 'حالة الدفع' : 'Status'}</th>
                        <th>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                        <th>{locale === 'ar' ? 'تحميل الفاتورة' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>{locale === 'ar' ? 'لا يوجد فواتير مدفوعة.' : 'No invoices.'}</td>
                        </tr>
                      ) : (
                        invoices.map(inv => (
                          <tr key={inv.id}>
                            <td>#{inv.id}</td>
                            <td><strong>{inv.amount} SAR</strong></td>
                            <td>
                              <span className={styles.statusBadge} style={{ background: 'var(--success-bg)', color: '#27ae60' }}>
                                {inv.status}
                              </span>
                            </td>
                            <td>{new Date(inv.created_at).toLocaleString()}</td>
                            <td>
                              <a href={`${API_BASE_URL}/api/v1/billing/invoices/${inv.id}/download/`} download className="btn btn-xs btn-outline">
                                {locale === 'ar' ? 'تحميل فاتورة PDF' : 'Download Invoice PDF'}
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeItem === 'settings' && !isAdminMode && (
            <div className={styles.settingsGrid}>
              { }
              <div className="settings-container">
                <h3 style={{ fontWeight: 700 }}>{locale === 'ar' ? 'تعديل البريد الإلكتروني وكلمة المرور' : 'Modify Credentials'}</h3>

                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>{locale === 'ar' ? 'البريد الإلكتروني:' : 'Email address:'}</label>
                    <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>{locale === 'ar' ? 'كلمة مرور جديدة (اتركها فارغة إذا لم تكن ترغب بالتعديل):' : 'New Password:'}</label>
                    <input type="password" autoComplete="new-password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="******" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                  </div>
                  <button type="submit" className="btn btn-primary w-full">
                    {locale === 'ar' ? 'تعديل البيانات' : 'Update Credentials'}
                  </button>
                </form>

                <h3 style={{ fontWeight: 700, marginTop: '20px' }}>{locale === 'ar' ? 'إعدادات الحماية والأمان الإضافية' : 'Extra Security Parameters'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label className="security-option-label">
                    <span>{locale === 'ar' ? 'تفعيل المصادقة الثنائية (2FA)' : 'Enable Two-Factor Authentication'}</span>
                    <input type="checkbox" className="security-checkbox" checked={twoFactor} onChange={(e) => { setTwoFactor(e.target.checked); handleToggleSecurity('2fa', e.target.checked); }} />
                  </label>

                  <div className="security-option-label" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                      <span>{locale === 'ar' ? 'تفعيل التحقق بخطوتين (كلمة مرور)' : 'Enable 2-Step Verification'}</span>
                      <input type="checkbox" className="security-checkbox" checked={twoStepEnabled} onChange={(e) => { setTwoStepEnabled(e.target.checked); handleToggleSecurity('2step', e.target.checked); }} />
                    </label>
                    {twoStepEnabled && (
                      <div className="two-step-input-group">
                        <input type="password" placeholder={locale === 'ar' ? 'الرمز السري بخطوتين...' : 'Enter 2-step password...'} value={twoStepPassword} onChange={(e) => setTwoStepPassword(e.target.value)} className="two-step-input" />
                        <button onClick={() => handleToggleSecurity('2step', true)} className="btn btn-primary btn-sm two-step-btn">
                          {locale === 'ar' ? 'حفظ الرمز' : 'Save Passcode'}
                        </button>
                      </div>
                    )}
                  </div>

                  <label className="security-option-label">
                    <span>{locale === 'ar' ? 'تقييد ومنع الدخول من عناوين IP إضافية' : 'Restrict Login to Authorized IP only'}</span>
                    <input type="checkbox" className="security-checkbox" checked={restrictIp} onChange={(e) => { setRestrictIp(e.target.checked); handleToggleSecurity('ip', e.target.checked); }} />
                  </label>
                </div>
              </div>

              { }
              <div className="settings-container">
                <h3 style={{ fontWeight: 700 }}>{locale === 'ar' ? 'الأجهزة النشطة وسجل الدخول' : 'Active Sessions & Login Logs'}</h3>

                <h5>{locale === 'ar' ? 'الجلسات المسجلة حالياً:' : 'Active Registered Sessions:'}</h5>
                <div className={`${styles.tableWrapper} mobile-table-stack`} style={{ maxHeight: '250px', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                  <table className={styles.table} style={{ fontSize: '12px' }}>
                    <tbody>
                      {sessionLogs.map(s => (
                        <tr key={s.id}>
                          <td>{s.ip_address}</td>
                          <td>{s.browser_agent ? s.browser_agent.substring(0, 30) : '-'}...</td>
                          <td>{new Date(s.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h5>{locale === 'ar' ? 'سجل محاولات الدخول:' : 'Login history Log:'}</h5>
                <div className={`${styles.tableWrapper} mobile-table-stack`} style={{ maxHeight: '250px', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                  <table className={styles.table} style={{ fontSize: '12px' }}>
                    <tbody>
                      {loginHistory.map(lh => (
                        <tr key={lh.id}>
                          <td>{lh.ip_address}</td>
                          <td>
                            <span style={{ color: lh.status === 'success' ? '#27ae60' : '#eb5757' }}>
                              {lh.status}
                            </span>
                          </td>
                          <td>{new Date(lh.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <style jsx>{`
                .settings-container {
                  background: var(--surface);
                  border: 1px solid var(--border-light);
                  padding: 24px;
                  border-radius: var(--radius-xl);
                  display: flex;
                  flex-direction: column;
                  gap: 20px;
                }
                .security-option-label {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  background: var(--bg-tertiary);
                  padding: 16px;
                  border-radius: 8px;
                  gap: 12px;
                  cursor: pointer;
                  margin: 0;
                }
                .security-checkbox {
                  width: 20px;
                  height: 20px;
                  flex-shrink: 0;
                  cursor: pointer;
                  margin: 0;
                }
                .two-step-input-group {
                  display: flex;
                  gap: 8px;
                  margin-top: 4px;
                }
                .two-step-input {
                  flex: 1;
                  padding: 10px 14px;
                  background: var(--bg-primary);
                  border: 1px solid var(--border-light);
                  border-radius: 6px;
                  min-width: 0;
                }
                .two-step-btn {
                  white-space: nowrap;
                  padding: 10px 16px;
                  height: auto;
                }
                @media (max-width: 600px) {
                  .settings-container {
                    padding: 16px !important;
                  }
                  .two-step-input-group {
                    flex-direction: column;
                  }
                  .two-step-btn {
                    width: 100%;
                  }
                  .mobile-table-stack table {
                    width: 100%;
                    border-collapse: collapse;
                  }
                  .mobile-table-stack thead {
                    display: none;
                  }
                  .mobile-table-stack tr {
                    display: flex;
                    flex-direction: column;
                    border-bottom: 1px solid var(--border-light);
                    padding: 12px 0;
                    gap: 6px;
                  }
                  .mobile-table-stack tr:last-child {
                    border-bottom: none;
                  }
                  .mobile-table-stack td {
                    border: none;
                    padding: 0 12px;
                    font-size: 13px;
                  }
                }
              `}</style>
            </div>
          )}

          { }
          {activeItem === 'profile' && !isAdminMode && (
            <UserProfileDashboard onNavigate={setActiveItem} />
          )}

          {activeItem === 'support' && !isAdminMode && (
            <SupportCenter />
          )}

          { }
          { }
          { }

          { }
          {activeItem === 'admin_overview' && isAdminMode && (
            <AdminDashboardOverview onNavigateToCustomers={() => setActiveItem('admin_clients')} />
          )}

          {activeItem === 'admin_clients' && isAdminMode && (
            <AdminUsersManager />
          )}

          { }
          {activeItem === 'admin_sessions' && isAdminMode && (
            <AdminSessionsManager
              adminSessions={adminSessions}
              locale={locale}
              handleTerminateSession={handleTerminateSession}
              fetchAdminData={fetchAdminData}
            />
          )}

          { }
          {activeItem === 'admin_plans' && isAdminMode && (
            <SubscriptionPlansManager
              locale={locale}
              adminPlans={adminPlans}
              invoices={invoices}
              planSearch={planSearch}
              setPlanSearch={setPlanSearch}
              planFilter={planFilter}
              setPlanFilter={setPlanFilter}
              planSort={planSort}
              setPlanSort={setPlanSort}
              handleEditPlan={handleEditPlan}
              handleTogglePlan={handleTogglePlan}
              handleDeletePlan={handleDeletePlan}
              resetPlanForm={resetPlanForm}
              setIsPlanModalOpen={setIsPlanModalOpen}
              renderPlanIcon={renderPlanIcon}
            />
          )}

          {false && isAdminMode && (() => {
            // ── local helpers for the premium plans UI ──────────────────
            const planAccent = (icon: string) => {
              switch (icon) {
                case 'vip': return { color: '#E8833A', color2: '#D4712E', label: locale === 'ar' ? 'ماسية' : 'Diamond', badge: 'BEST VALUE' };
                case 'gold': return { color: '#F4B740', color2: '#D4972E', label: locale === 'ar' ? 'ذهبية' : 'Gold', badge: 'POPULAR' };
                case 'silver': return { color: '#A68B5B', color2: '#8B7248', label: locale === 'ar' ? 'فضية' : 'Silver', badge: 'STARTER' };
                case 'diamond': return { color: '#E8833A', color2: '#A68B5B', label: locale === 'ar' ? 'بلاتينية' : 'Platinum', badge: 'POPULAR' };
                case 'max': return { color: '#27C281', color2: '#1DA66D', label: 'Max', badge: 'ENTERPRISE' };
                case 'plus': return { color: '#27C281', color2: '#1A8F5C', label: 'Enterprise', badge: 'ENTERPRISE' };
                default: return { color: '#9A9A9A', color2: '#7A7A7A', label: locale === 'ar' ? 'أساسية' : 'Basic', badge: 'BASIC' };
              }
            };
            const badgeColor: Record<string, string> = {
              'BEST VALUE': 'linear-gradient(135deg,#E8833A,#D4712E)',
              'POPULAR': 'linear-gradient(135deg,#F4B740,#D4972E)',
              'ENTERPRISE': 'linear-gradient(135deg,#27C281,#1DA66D)',
              'STARTER': 'linear-gradient(135deg,#A68B5B,#8B7248)',
              'BASIC': 'rgba(154,154,154,0.3)',
            };

            // ── derived stats ────────────────────────────────────────────
            const activePlansCount = adminPlans.filter(p => p.is_active).length;
            const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
            const monthlyRevenue = paidInvoices.reduce((s: number, i: any) => s + parseFloat(i.amount || 0), 0);
            const annualRevenue = monthlyRevenue * 12;
            const uniqueSubscribers = new Set(paidInvoices.map((i: any) => i.user)).size;

            // ── search & filter state (hoisted as refs via closure) ──────




            const filtered = adminPlans
              .filter(p => {
                if (planFilter === 'active' && !p.is_active) return false;
                if (planFilter === 'disabled' && p.is_active) return false;
                if (planSearch) {
                  const q = planSearch.toLowerCase();
                  return p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
                }
                return true;
              })
              .sort((a: any, b: any) => {
                if (planSort === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
                if (planSort === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
                return (a.order ?? 0) - (b.order ?? 0);
              });

            const bestSellingPlan = adminPlans.reduce((best: any, p: any) => {
              const pSubs = invoices.filter((i: any) => i.plan === p.id && i.status === 'paid').length;
              const bSubs = best ? invoices.filter((i: any) => i.plan === best.id && i.status === 'paid').length : 0;
              return pSubs > bSubs ? p : best;
            }, null as any);

            const statCards = [
              { label: locale === 'ar' ? 'إجمالي الباقات' : 'Total Plans', value: adminPlans.length, icon: <Package size={20} color="#E8833A" />, accent: '#E8833A', pct: adminPlans.length > 0 ? 100 : 0 },
              { label: locale === 'ar' ? 'الباقات المفعّلة' : 'Active Plans', value: activePlansCount, icon: <CheckCircle2 size={20} color="#27C281" />, accent: '#27C281', pct: adminPlans.length > 0 ? Math.round((activePlansCount / adminPlans.length) * 100) : 0 },
              { label: locale === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices', value: invoices.length, icon: <FileText size={20} color="#F4B740" />, accent: '#F4B740', pct: invoices.length > 0 ? 100 : 0 },
              { label: locale === 'ar' ? 'المشتركون الفريدون' : 'Unique Subscribers', value: uniqueSubscribers, icon: <Users size={20} color="#A68B5B" />, accent: '#A68B5B', pct: invoices.length > 0 ? Math.round((uniqueSubscribers / Math.max(invoices.length, 1)) * 100) : 0 },
              { label: locale === 'ar' ? 'الإيرادات المُحصَّلة' : 'Collected Revenue', value: `${monthlyRevenue.toFixed(0)} SAR`, icon: <Coins size={20} color="#E8833A" />, accent: '#E8833A', pct: monthlyRevenue > 0 ? 75 : 0 },
              { label: locale === 'ar' ? 'الإسقاط السنوي' : 'Annual Projection', value: `${annualRevenue.toFixed(0)} SAR`, icon: <TrendingUp size={20} color="#27C281" />, accent: '#27C281', pct: annualRevenue > 0 ? 90 : 0 },
            ];

            const featureDef = [
              { key: 'interactive_bot', label: locale === 'ar' ? 'بوت تفاعلي' : 'Interactive Bot', icon: <Bot size={14} /> },
              { key: 'ai_reply', label: locale === 'ar' ? 'ردود ذكاء اصطناعي' : 'AI Replies', icon: <Sparkles size={14} /> },
              { key: 'broadcasts', label: locale === 'ar' ? 'إشعارات جماعية' : 'Broadcasts', icon: <Megaphone size={14} /> },
              { key: 'api_access', label: 'API Access', icon: <Zap size={14} /> },
              { key: 'webhooks', label: 'Webhooks', icon: <LinkIcon size={14} /> },
            ];

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', fontFamily: "'Cairo', 'IBM Plex Sans Arabic', sans-serif" }}>

                {/* ── keyframes & premium styles injection ─────────────────────────────── */}
                <style>{`
                  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
                  @keyframes pmFadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
                  @keyframes pmHeroFade { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
                  @keyframes pmCountPop { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
                  @keyframes pmProgressGrow { from { width: 0%; } }
                  @keyframes pmShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                  @keyframes pmPriceHover { 0% { transform: scale(1); } 50% { transform: scale(1.04); } 100% { transform: scale(1); } }
                  @keyframes pmRipple { 0% { transform: scale(0); opacity: 0.5; } 100% { transform: scale(4); opacity: 0; } }
                  .plans-page { font-family: 'Cairo', 'IBM Plex Sans Arabic', sans-serif; }

                  /* ── Hero ── */
                  .pm-hero-card {
                    background: linear-gradient(135deg, #1E1E24 0%, #1a1a1f 50%, #1E1E24 100%);
                    border: 1px solid #33333D;
                    border-radius: 22px;
                    padding: 36px 40px;
                    position: relative;
                    overflow: hidden;
                    animation: pmHeroFade 0.4s cubic-bezier(.4,0,.2,1);
                  }
                  .pm-hero-card::before {
                    content: '';
                    position: absolute;
                    top: -80px;
                    right: -80px;
                    width: 260px;
                    height: 260px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(232,131,58,0.08) 0%, transparent 70%);
                    pointer-events: none;
                  }

                  /* ── Plan cards ── */
                  .plan-card-pm {
                    background: #1E1E24;
                    border-radius: 22px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    transition: transform 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.22s cubic-bezier(.4,0,.2,1), border-color 0.22s ease;
                    cursor: default;
                  }
                  .plan-card-pm:hover {
                    transform: translateY(-6px);
                  }
                  .plan-card-pm.is-inactive { opacity: 0.5; filter: grayscale(0.3); }

                  /* ── Action buttons ── */
                  .pm-action-btn {
                    display: flex; align-items: center; justify-content: center; gap: 6px;
                    padding: 10px 16px; border-radius: 12px; font-size: 12.5px; font-weight: 600;
                    cursor: pointer; position: relative; overflow: hidden;
                    transition: transform 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s ease, filter 0.18s ease, background 0.18s ease;
                  }
                  .pm-action-btn:hover { transform: translateY(-2px) scale(1.03); filter: brightness(1.12); }
                  .pm-action-btn:active { transform: scale(0.96); }
                  .pm-action-btn .pm-ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.2);
                    animation: pmRipple 0.5s ease-out forwards;
                    pointer-events: none;
                  }

                  /* ── Stat cards ── */
                  .pm-stat-card {
                    background: #1E1E24;
                    border: 1px solid #33333D;
                    border-radius: 18px;
                    padding: 22px 20px;
                    display: flex; flex-direction: column; gap: 14px;
                    transition: transform 0.22s cubic-bezier(.4,0,.2,1), border-color 0.22s ease, box-shadow 0.22s ease;
                    position: relative; overflow: hidden;
                  }
                  .pm-stat-card:hover {
                    transform: translateY(-5px);
                    border-color: #E8833A55;
                    box-shadow: 0 12px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(232,131,58,0.15);
                  }

                  /* ── Mini usage cards ── */
                  .pm-mini-card {
                    background: rgba(232,131,58,0.04);
                    border: 1px solid #33333D;
                    border-radius: 14px;
                    padding: 14px 10px;
                    text-align: center;
                    flex: 1;
                    transition: border-color 0.2s, background 0.2s, transform 0.2s;
                  }
                  .pm-mini-card:hover {
                    border-color: #E8833A44;
                    background: rgba(232,131,58,0.08);
                    transform: translateY(-2px);
                  }

                  /* ── Feature chips ── */
                  .pm-feature-chip {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 6px 14px; border-radius: 20px;
                    font-size: 12px; font-weight: 500;
                    transition: all 0.18s ease;
                    border: 1px solid transparent;
                  }
                  .pm-feature-chip.on {
                    background: rgba(232,131,58,0.08);
                    border-color: rgba(232,131,58,0.2);
                    color: #F0EDE8;
                  }
                  .pm-feature-chip.off {
                    background: rgba(154,154,154,0.06);
                    border-color: rgba(154,154,154,0.1);
                    color: #9A9A9A;
                    opacity: 0.5;
                  }

                  /* ── Search & filters ── */
                  .pm-search-input {
                    background: rgba(240,237,232,0.04);
                    border: 1px solid #33333D;
                    border-radius: 14px;
                    padding: 12px 18px 12px 44px;
                    color: #F0EDE8;
                    font-size: 14.5px;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    width: 100%;
                    font-family: 'Cairo', sans-serif;
                  }
                  .pm-search-input:focus { border-color: #E8833A88; box-shadow: 0 0 0 3px rgba(232,131,58,0.1); }
                  .pm-search-input::placeholder { color: #9A9A9A; }
                  .pm-select {
                    background: rgba(240,237,232,0.04);
                    border: 1px solid #33333D;
                    border-radius: 14px;
                    padding: 12px 16px;
                    color: #F0EDE8;
                    font-size: 13.5px;
                    outline: none;
                    cursor: pointer;
                    font-family: 'Cairo', sans-serif;
                    transition: border-color 0.2s;
                  }
                  .pm-select:focus { border-color: #E8833A88; }

                  /* ── Toolbar ── */
                  .pm-toolbar-sticky {
                    background: rgba(30,30,36,0.85);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid #33333D;
                    border-radius: 22px;
                    padding: 18px 24px;
                    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    transition: box-shadow 0.2s;
                  }

                  /* ── Progress bar ── */
                  .pm-progress-bar {
                    height: 5px;
                    border-radius: 10px;
                    background: rgba(240,237,232,0.06);
                    overflow: hidden;
                    margin-top: 6px;
                  }
                  .pm-progress-fill {
                    height: 100%;
                    border-radius: 10px;
                    background: linear-gradient(90deg, #E8833A, #F4B740);
                    animation: pmProgressGrow 0.8s cubic-bezier(.4,0,.2,1);
                    transition: width 0.5s ease;
                  }

                  /* ── Price section ── */
                  .pm-price-section {
                    transition: transform 0.25s cubic-bezier(.4,0,.2,1);
                  }
                  .pm-price-section:hover {
                    animation: pmPriceHover 0.5s cubic-bezier(.4,0,.2,1);
                  }

                  /* ── Responsive ── */
                  @media (max-width: 1200px) {
                    .pm-stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
                  }
                  @media (max-width: 768px) {
                    .pm-plans-grid { grid-template-columns: 1fr !important; }
                    .pm-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .pm-hero-card { padding: 24px 20px !important; }
                    .pm-hero-inner { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; }
                    .pm-toolbar-sticky { flex-direction: column !important; align-items: stretch !important; }
                    .pm-search-input { width: 100% !important; }
                  }
                  @media (max-width: 480px) {
                    .pm-stats-grid { grid-template-columns: 1fr !important; }
                    .pm-hero-card { padding: 20px 16px !important; }
                  }
                `}</style>

                {/* ═══ HERO SECTION ═══════════════════════════════════════════ */}
                <PremiumCardWrapper className="pm-hero-card" style={{ padding: 0 }}>
                  <div className="pm-hero-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flex: 1 }}>
                      {/* Glass Icon Container */}
                      <div style={{
                        width: 56, height: 56, borderRadius: '16px', flexShrink: 0,
                        background: 'rgba(232,131,58,0.1)',
                        border: '1px solid rgba(232,131,58,0.2)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(232,131,58,0.15)',
                      }}>
                        <Package size={26} color="#E8833A" />
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#F0EDE8', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                          {locale === 'ar' ? 'إدارة الباقات' : 'Plans Management'}
                        </h2>
                        <p style={{ margin: '6px 0 0', fontSize: '14.5px', color: '#9A9A9A', lineHeight: 1.5, maxWidth: '480px' }}>
                          {locale === 'ar'
                            ? 'أنشئ وأدر باقات الاشتراك بمرونة كاملة — تحكم في الأسعار والمميزات وحدود الاستخدام'
                            : 'Create and manage subscription plans — control pricing, features, and usage limits'}
                        </p>
                        {/* Mini stat inside hero */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(39,194,129,0.08)', border: '1px solid rgba(39,194,129,0.2)',
                            borderRadius: '20px', padding: '6px 16px',
                          }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#27C281' }} />
                            <span style={{ fontSize: '12.5px', color: '#27C281', fontWeight: 600 }}>
                              {activePlansCount} {locale === 'ar' ? 'باقة نشطة' : 'Active'}
                            </span>
                          </div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(232,131,58,0.08)', border: '1px solid rgba(232,131,58,0.2)',
                            borderRadius: '20px', padding: '6px 16px',
                          }}>
                            <span style={{ fontSize: '12.5px', color: '#E8833A', fontWeight: 600 }}>
                              {adminPlans.length} {locale === 'ar' ? 'إجمالي' : 'Total'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <PremiumButton
                      variant="primary"
                      onClick={() => { resetPlanForm(); setIsPlanModalOpen(true); }}
                      icon={<PlusCircle size={17} />} iconPosition="left"
                    >
                      {locale === 'ar' ? 'إنشاء باقة جديدة' : 'New Plan'}
                    </PremiumButton>
                  </div>
                </PremiumCardWrapper>

                {/* ═══ STATS ROW ════════════════════════════════════════ */}
                <div className="pm-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px' }}>
                  {statCards.map((s, idx) => (
                    <PremiumCardWrapper key={idx} className="pm-stat-card" style={{ animationDelay: `${idx * 60}ms`, animation: `pmFadeInUp 0.4s cubic-bezier(.4,0,.2,1) ${idx * 60}ms both`, padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: '12px', fontSize: '18px',
                          background: `${s.accent}15`,
                          border: `1px solid ${s.accent}25`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>{s.icon}</div>
                        {/* Mini trend arrow */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '3px',
                          padding: '3px 8px', borderRadius: '8px',
                          background: 'rgba(39,194,129,0.1)',
                          fontSize: '10px', fontWeight: 600, color: '#27C281',
                        }}>
                          ↑
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9A9A9A', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#F0EDE8', lineHeight: 1, animation: `pmCountPop 0.5s cubic-bezier(.4,0,.2,1) ${idx * 80 + 200}ms both` }}>{s.value}</div>
                      </div>
                      {/* Progress bar */}
                      <div className="pm-progress-bar">
                        <div className="pm-progress-fill" style={{ width: `${s.pct}%`, animationDelay: `${idx * 100 + 300}ms` }} />
                      </div>
                    </PremiumCardWrapper>
                  ))}
                </div>

                {/* ═══ SEARCH & FILTER TOOLBAR ════════════════════════════== */}
                <div className="pm-toolbar-sticky">
                  <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9A9A9A' }} />
                    <input
                      type="text"
                      className="pm-search-input"
                      placeholder={locale === 'ar' ? 'البحث باسم الباقة أو الوصف...' : 'Search by plan name or description...'}
                      value={planSearch}
                      onChange={e => setPlanSearch(e.target.value)}
                      style={{ paddingLeft: locale === 'ar' ? '18px' : '44px', paddingRight: locale === 'ar' ? '44px' : '18px' }}
                    />
                  </div>
                  <select className="pm-select" value={planFilter} onChange={e => setPlanFilter(e.target.value as any)}>
                    <option value="all">{locale === 'ar' ? 'كل الحالات' : 'All Status'}</option>
                    <option value="active">{locale === 'ar' ? 'مفعّلة فقط' : 'Active Only'}</option>
                    <option value="disabled">{locale === 'ar' ? 'معطّلة فقط' : 'Disabled Only'}</option>
                  </select>
                  <select className="pm-select" value={planSort} onChange={e => setPlanSort(e.target.value as any)}>
                    <option value="default">{locale === 'ar' ? 'الترتيب الافتراضي' : 'Default Order'}</option>
                    <option value="price_asc">{locale === 'ar' ? 'السعر: الأقل أولاً' : 'Price: Low → High'}</option>
                    <option value="price_desc">{locale === 'ar' ? 'السعر: الأعلى أولاً' : 'Price: High → Low'}</option>
                  </select>
                  <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#9A9A9A', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8833A', display: 'inline-block' }} />
                    {filtered.length} {locale === 'ar' ? 'باقة' : 'plans'}
                  </div>
                </div>

                {/* ═══ PLANS GRID ═════════════════════════════════════== */}
                {filtered.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '80px 20px',
                    background: '#1E1E24', borderRadius: '22px',
                    border: '1px solid #33333D',
                  }}>
                    <div style={{ fontSize: '52px', marginBottom: '16px', animation: 'pmFadeInUp 0.4s ease both' }}>📦</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0EDE8', marginBottom: '8px' }}>
                      {locale === 'ar' ? 'لا توجد باقات مطابقة' : 'No plans found'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#9A9A9A' }}>
                      {locale === 'ar' ? 'عدّل معايير البحث أو أنشئ باقة جديدة' : 'Adjust your search or create a new plan'}
                    </div>
                  </div>
                ) : (
                  <div className="pm-plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                    {filtered.map((p: any, cardIdx: number) => {
                      const accent = planAccent(p.icon);
                      const topGrad = `linear-gradient(90deg, ${accent.color}, ${accent.color2})`;
                      const features = featureDef.map(f => ({ ...f, enabled: !!(p as any)[f.key] }));
                      const isBestSeller = bestSellingPlan && bestSellingPlan.id === p.id;
                      const usagePercent = p.is_messages_unlimited ? 0 : (p.message_limit > 0 ? Math.min(Math.round((p.message_limit / 10000) * 100), 100) : 0);

                      return (
                        <PremiumCardWrapper
                          key={p.id}
                          className={`plan-card-pm${p.is_active ? '' : ' is-inactive'}`}
                          style={{
                            border: `1px solid #33333D`,
                            boxShadow: p.is_active
                              ? `0 16px 40px rgba(0,0,0,0.3), 0 0 0 1px ${accent.color}15`
                              : '0 4px 16px rgba(0,0,0,0.15)',
                            animation: `pmFadeInUp 0.4s cubic-bezier(.4,0,.2,1) ${cardIdx * 80}ms both`,
                            padding: 0
                          }}
                        >
                          {/* ─── Colored Top Border ─── */}
                          <div style={{ height: '4px', background: topGrad, borderRadius: '22px 22px 0 0' }} />

                          {/* ─── Best Seller Ribbon ─── */}
                          {isBestSeller && p.is_active && (
                            <div style={{
                              position: 'absolute', top: '18px', right: locale === 'ar' ? 'auto' : '-6px', left: locale === 'ar' ? '-6px' : 'auto',
                              background: 'linear-gradient(135deg, #F4B740, #D4972E)',
                              color: '#141418', fontSize: '10px', fontWeight: 800,
                              padding: '4px 14px 4px 12px', borderRadius: locale === 'ar' ? '0 8px 8px 0' : '8px 0 0 8px',
                              letterSpacing: '0.5px', textTransform: 'uppercase',
                              boxShadow: '0 4px 12px rgba(244,183,64,0.3)',
                              zIndex: 2,
                            }}>
                              <Star size={12} fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'text-top', margin: '0 3px' }} /> {locale === 'ar' ? 'الأكثر مبيعاً' : 'BEST SELLER'}
                            </div>
                          )}

                          {/* ─── Card Body ─────────── */}
                          <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px', flex: 1 }}>

                            {/* ── HEADER ── */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                {/* Icon Circle */}
                                <div style={{
                                  width: 52, height: 52, borderRadius: '16px', flexShrink: 0,
                                  background: `linear-gradient(135deg, ${accent.color}18, ${accent.color2}0C)`,
                                  border: `1px solid ${accent.color}30`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                }}>
                                  {React.cloneElement(renderPlanIcon(p.icon) as React.ReactElement<any>, { size: 24, color: accent.color })}
                                </div>
                                <div>
                                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0EDE8', lineHeight: 1.1 }}>{p.name}</div>
                                  <div style={{ fontSize: '12px', color: '#9A9A9A', marginTop: '4px' }}>{accent.label}</div>
                                </div>
                              </div>

                              {/* Badges column */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                                {p.is_active ? (
                                  <span style={{
                                    padding: '5px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                                    letterSpacing: '0.6px',
                                    background: 'rgba(39,194,129,0.12)', border: '1px solid rgba(39,194,129,0.3)',
                                    color: '#27C281', textTransform: 'uppercase' as const,
                                  }}>{locale === 'ar' ? 'نشطة' : 'ACTIVE'}</span>
                                ) : (
                                  <span style={{
                                    padding: '5px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                                    letterSpacing: '0.5px', background: 'rgba(154,154,154,0.12)',
                                    border: '1px solid rgba(154,154,154,0.3)', color: '#9A9A9A',
                                  }}>{locale === 'ar' ? 'معطّلة' : 'DISABLED'}</span>
                                )}
                                {p.is_active && p.support_type === 'vip' && (
                                  <span style={{
                                    padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                                    background: 'rgba(232,131,58,0.12)', border: '1px solid rgba(232,131,58,0.3)',
                                    color: '#E8833A',
                                  }}>VIP ⚡</span>
                                )}
                                <span style={{
                                  padding: '4px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: 700,
                                  letterSpacing: '0.6px', background: badgeColor[accent.badge] || 'rgba(154,154,154,0.3)',
                                  color: '#fff', textTransform: 'uppercase' as const,
                                }}>{accent.badge}</span>
                              </div>
                            </div>

                            {/* ── PRICE ── */}
                            <div className="pm-price-section" style={{
                              background: `linear-gradient(135deg, ${accent.color}08, ${accent.color2}04)`,
                              border: `1px solid ${accent.color}18`,
                              borderRadius: '18px',
                              padding: '16px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                                <span style={{ fontSize: '56px', fontWeight: 900, color: accent.color, lineHeight: 1, letterSpacing: '-3px', fontFamily: "'Cairo', sans-serif" }}>
                                  {parseFloat(p.price).toFixed(0)}
                                </span>
                                <div style={{ paddingBottom: '8px' }}>
                                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#9A9A9A' }}>SAR</div>
                                  <div style={{ fontSize: '12px', color: '#9A9A9A', marginTop: '1px' }}>/ {p.duration_days} {locale === 'ar' ? 'يوم' : 'days'}</div>
                                </div>
                              </div>
                              {p.description && (
                                <div style={{ fontSize: '13px', color: '#9A9A9A', marginTop: '10px', lineHeight: 1.6 }}>{p.description}</div>
                              )}
                            </div>

                            {/* ── USAGE PROGRESS ── */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                  {locale === 'ar' ? 'سعة الاستخدام' : 'USAGE CAPACITY'}
                                </span>
                                <span style={{ fontSize: '11px', color: '#E8833A', fontWeight: 700 }}>
                                  {p.is_messages_unlimited ? '∞' : `${usagePercent}%`}
                                </span>
                              </div>
                              <div className="pm-progress-bar" style={{ height: '6px' }}>
                                <div className="pm-progress-fill" style={{ width: p.is_messages_unlimited ? '100%' : `${usagePercent}%` }} />
                              </div>
                            </div>

                            {/* ── USAGE MINI CARDS ── */}
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9A9A9A', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                {locale === 'ar' ? 'حدود الاستخدام' : 'USAGE LIMITS'}
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {[
                                  { label: locale === 'ar' ? 'الرسائل' : 'Messages', value: p.is_messages_unlimited ? '∞' : (p.message_limit?.toLocaleString() ?? '—'), icon: <MessageCircle size={18} color={accent.color} />, tip: locale === 'ar' ? 'عدد الرسائل المسموح بها' : 'Allowed messages count' },
                                  { label: locale === 'ar' ? 'الأجهزة' : 'Devices', value: p.is_devices_unlimited ? '∞' : (p.device_limit ?? '—'), icon: <Smartphone size={18} color={accent.color} />, tip: locale === 'ar' ? 'عدد الأجهزة المتصلة' : 'Connected devices limit' },
                                  { label: locale === 'ar' ? 'الأرقام' : 'Numbers', value: p.is_numbers_unlimited ? '∞' : (p.number_limit ?? '—'), icon: <Phone size={18} color={accent.color} />, tip: locale === 'ar' ? 'عدد الأرقام المسموحة' : 'Allowed numbers' },
                                ].map((m, mi) => (
                                  <div key={mi} className="pm-mini-card" title={m.tip}>
                                    <div style={{ fontSize: '16px', marginBottom: '6px' }}>{m.icon}</div>
                                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#F0EDE8', lineHeight: 1 }}>{m.value}</div>
                                    <div style={{ fontSize: '10px', color: '#9A9A9A', marginTop: '5px', fontWeight: 500 }}>{m.label}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* ── FEATURES (as chips) ── */}
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9A9A9A', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                {locale === 'ar' ? 'المميزات' : 'FEATURES'}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {features.map(f => (
                                  <div key={f.key} className={`pm-feature-chip ${f.enabled ? 'on' : 'off'}`}>
                                    <span style={{ fontSize: '12px' }}>{f.enabled ? '✓' : '✗'}</span>
                                    <span style={{ fontSize: '11px' }}>{f.icon}</span>
                                    <span style={{ fontSize: '11.5px', fontWeight: f.enabled ? 600 : 400 }}>{f.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* ── ACTION BAR ── */}
                            <div style={{
                              display: 'flex', gap: '8px', marginTop: 'auto',
                              paddingTop: '18px', borderTop: '1px solid #33333D',
                            }}>
                              {/* Edit */}
                              <PremiumButton
                                variant="secondary"
                                onClick={() => handleEditPlan(p)}
                                style={{ flex: 1, background: 'rgba(232,131,58,0.08)', color: '#E8833A', border: '1px solid rgba(232,131,58,0.25)' }}
                                icon={<Pencil size={13} />} iconPosition="left"
                                title={locale === 'ar' ? 'تعديل' : 'Edit'}
                              >
                                {locale === 'ar' ? 'تعديل' : 'Edit'}
                              </PremiumButton>

                              {/* Toggle */}
                              <PremiumButton
                                variant="secondary"
                                onClick={() => handleTogglePlan(p.id, p.is_active)}
                                style={{
                                  flex: 1,
                                  background: p.is_active ? 'rgba(244,183,64,0.08)' : 'rgba(39,194,129,0.08)',
                                  color: p.is_active ? '#F4B740' : '#27C281',
                                  border: `1px solid ${p.is_active ? 'rgba(244,183,64,0.25)' : 'rgba(39,194,129,0.25)'}`,
                                }}
                                icon={<Power size={13} />} iconPosition="left"
                                title={p.is_active ? (locale === 'ar' ? 'تعطيل' : 'Disable') : (locale === 'ar' ? 'تفعيل' : 'Activate')}
                              >
                                {p.is_active ? (locale === 'ar' ? 'تعطيل' : 'Disable') : (locale === 'ar' ? 'تفعيل' : 'Activate')}
                              </PremiumButton>

                              {/* Delete */}
                              <PremiumButton
                                variant="secondary"
                                onClick={() => handleDeletePlan(p.id)}
                                style={{ padding: '10px 14px', background: 'rgba(239,83,80,0.06)', color: '#EF5350', border: '1px solid rgba(239,83,80,0.2)' }}
                                icon={<Trash2 size={13} />} iconPosition="left"
                                title={locale === 'ar' ? 'حذف' : 'Delete'}
                              />
                            </div>
                          </div>
                        </PremiumCardWrapper>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {activeItem === 'admin_payments' && isAdminMode && (
            <AdminPaymentsManager invoices={invoices} locale={locale} handleAction={handleReviewInvoice} />
          )}

          { }
          {activeItem === 'admin_notifications' && isAdminMode && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>{locale === 'ar' ? 'إرسال تنبيهات جماعية لكافة المستخدمين بالمنصة' : 'Broadcast system-wide alert notifications'}</h3>

              <form onSubmit={handleBroadcastAlert} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '600px' }}>
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>{locale === 'ar' ? 'عنوان الإشعار:' : 'Notification Title:'}</label>
                  <input type="text" required value={bcTitle} onChange={(e) => setBcTitle(e.target.value)} placeholder="مثال: صيانة دورية للمنصة" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>{locale === 'ar' ? 'قناة الإرسال:' : 'Notification type:'}</label>
                  <select value={bcType} onChange={(e) => setBcType(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
                    <option value="update">{locale === 'ar' ? 'إشعار المنصة (تحديث بالسيستم)' : 'Platform System Update alert'}</option>
                    <option value="expiry">{locale === 'ar' ? 'تحذير انتهاء الباقة' : 'Subscription warning'}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>{locale === 'ar' ? 'محتوى الرسالة:' : 'Notification content details:'}</label>
                  <textarea rows={6} required value={bcContent} onChange={(e) => setBcContent(e.target.value)} placeholder="اكتب تفاصيل الإشعار هنا للمستخدمين..." style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  {locale === 'ar' ? 'إرسال البث الجماعي الآن ⚡' : 'Broadcast Alert Notification ⚡'}
                </button>
              </form>
            </div>
          )}

          { }
          {activeItem === 'admin_tickets' && isAdminMode && (
            <AdminSupportInbox />
          )}


          { }
          {activeItem === 'admin_agreements' && isAdminMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>{locale === 'ar' ? 'إدارة اتفاقيات وبنود شروط الخدمة للعملاء' : 'Platform Consent Agreements Builder'}</h3>

                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>{locale === 'ar' ? 'حالة التفعيل' : 'Active Status'}</th>
                      <th>{locale === 'ar' ? 'تاريخ الإنشاء' : 'Created at'}</th>
                      <th>{locale === 'ar' ? 'تصدير التقارير' : 'Consents signatures report'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.map(agr => (
                      <tr key={agr.id}>
                        <td style={{ fontWeight: 700 }}>{agr.title}</td>
                        <td>{agr.is_active ? 'Active' : 'Inactive'}</td>
                        <td>{new Date(agr.created_at).toLocaleDateString()}</td>
                        <td>
                          <a href={`${API_BASE_URL}/api/v1/whatsapp/admin/agreements/${agr.id}/signatures/pdf/`} download className="btn btn-xs btn-outline">
                            {locale === 'ar' ? 'تصدير PDF الفورية للموقعين' : 'Download signed consents PDF'}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              { }
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                <h3 style={{ marginBottom: '14px', fontWeight: 700 }}>{locale === 'ar' ? 'سجل تواقيع موافقات العملاء المسجلين' : 'Client Consent Signatures tracker Log'}</h3>

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>{locale === 'ar' ? 'العميل' : 'Client Email'}</th>
                        <th>{locale === 'ar' ? 'الاسم بالكامل' : 'Signed Full Name'}</th>
                        <th>{locale === 'ar' ? 'الجوال المصدّق' : 'Verified phone'}</th>
                        <th>{locale === 'ar' ? 'الاتفاقية' : 'Agreement'}</th>
                        <th>{locale === 'ar' ? 'عنوان الـ IP' : 'Consent signing IP'}</th>
                        <th>{locale === 'ar' ? 'تاريخ التوقيع' : 'Signed Timestamp'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminSignatures.map(sig => (
                        <tr key={sig.id}>
                          <td>{sig.email}</td>
                          <td>{sig.full_name}</td>
                          <td>{sig.phone_number}</td>
                          <td>{sig.agreement_title}</td>
                          <td>{sig.ip_address}</td>
                          <td>{new Date(sig.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          { }
          {activeItem === 'admin_settings' && isAdminMode && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: 'var(--radius-xl)', maxWidth: '600px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>{locale === 'ar' ? 'إعدادات النظام والربط العام' : 'System-wide credentials configuration'}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>SMTP Host Server:</label>
                  <input type="text" defaultValue="smtp.mailtrap.io" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>SMTP Port:</label>
                  <input type="text" defaultValue="2525" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Telegram Bot Token alert:</label>
                  <input type="password" value="tlg_bot_xxxxxx" readOnly style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Stripe Payment API gateway Key:</label>
                  <input type="password" value="sk_test_xxxxxx" readOnly style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                </div>

                <button onClick={() => alert('Settings Saved!')} className="btn btn-primary" style={{ marginTop: '10px' }}>
                  {locale === 'ar' ? 'حفظ التعديلات' : 'Save Credentials'}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      { }
      { }
      { }

      { }
      {isAgreementModalOpen && selectedAgreement && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '600px', padding: '28px', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              {locale === 'ar' ? `اتفاقية استخدام الخدمة: ${selectedAgreement.title}` : `Service Consent Terms: ${selectedAgreement.title}`}
            </h3>

            { }
            <div style={{
              background: 'var(--bg-tertiary)', padding: '14px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6',
              maxHeight: '200px', overflow: 'auto', marginBottom: '18px', color: 'var(--text-secondary)'
            }}>
              {selectedAgreement.content}
            </div>

            <form onSubmit={handleSignAgreement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{locale === 'ar' ? 'الاسم بالكامل:' : 'Full Name:'}</label>
                <input type="text" required value={consentName} onChange={(e) => setConsentName(e.target.value)} placeholder="اكتب اسمك الثلاثي" style={{ width: '100%', padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{locale === 'ar' ? 'البريد الإلكتروني:' : 'Email Address:'}</label>
                <input type="email" required value={consentEmail} onChange={(e) => setConsentEmail(e.target.value)} placeholder="email@example.com" style={{ width: '100%', padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{locale === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}</label>
                <input type="text" required value={consentPhone} onChange={(e) => setConsentPhone(e.target.value)} placeholder="+966500000000" style={{ width: '100%', padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
              </div>

              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', marginTop: '6px' }}>
                <input type="checkbox" checked={consentAccepted} onChange={(e) => setConsentAccepted(e.target.checked)} />
                <span>{locale === 'ar' ? 'أوافق على جميع الشروط والأحكام الخاصة باتفاقية الاستخدام الموضحة أعلاه.' : 'I accept the terms and conditions outlined in the agreement above.'}</span>
              </label>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsAgreementModalOpen(false)} className="btn btn-outline">
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary w-full">
                  {locale === 'ar' ? 'الموافقة والتوقيع ✍' : 'Agree & Sign ✍'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      { }
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '500px', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
              {locale === 'ar' ? 'إضافة جهاز / مثيل واتساب جديد بالمنصة' : 'Connect New WhatsApp Device'}
            </h3>

            <form onSubmit={handleCreateInstance} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  {locale === 'ar' ? 'اسم الجهاز (للتمييز فقط):' : 'Device / Instance Name:'}
                </label>
                <input type="text" value={newInstanceName} onChange={(e) => setNewInstanceName(e.target.value)} placeholder="Sales Line, Support Phone" required style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  {locale === 'ar' ? 'نوع الاتصال (الربط spec):' : 'Connection Type:'}
                </label>
                <select value={newInstanceType} onChange={(e) => setNewInstanceType(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
                  <option value="web_qr">{locale === 'ar' ? 'واتساب ويب - مسح كود QR (مستحسن)' : 'WhatsApp Web - QR Scan (Recommended)'}</option>
                  <option value="meta">{locale === 'ar' ? 'واجهة Meta Cloud API الرسمية' : 'Meta Cloud API Official'}</option>
                </select>
              </div>

              {newInstanceType === 'meta' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-light)', padding: '16px', borderRadius: '4px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px' }}>Phone Number ID:</label>
                    <input type="text" value={newPhoneId} onChange={(e) => setNewPhoneId(e.target.value)} required style={{ width: '100%', padding: '6px', background: 'var(--bg-primary)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px' }}>WABA Account ID:</label>
                    <input type="text" value={newWabaId} onChange={(e) => setNewWabaId(e.target.value)} required style={{ width: '100%', padding: '6px', background: 'var(--bg-primary)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px' }}>Meta Access Token:</label>
                    <input type="text" value={newAccessToken} onChange={(e) => setNewAccessToken(e.target.value)} required style={{ width: '100%', padding: '6px', background: 'var(--bg-primary)' }} />
                  </div>
                </div>
              )}

              {createError && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{createError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <PremiumButton
                  variant="outline"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreatingInstance}
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </PremiumButton>
                <PremiumButton
                  variant="primary"
                  type="button"
                  onClick={handleCreateInstance}
                  loading={isCreatingInstance}
                >
                  {locale === 'ar' ? 'تأكيد الإضافة' : 'Confirm Device'}
                </PremiumButton>
              </div>
            </form>
          </div>
        </div>
      )}

      { }

      {isPlanModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,8,15,0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{
            background: '#1E1E24',
            border: '1px solid #33333D',
            borderRadius: '24px',
            width: '100%', maxWidth: '720px', maxHeight: '92vh',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,131,58,0.15)',
          }}>
            <style>{`
              .pm-modal-input {
                width: 100%; padding: 11px 14px;
                background: rgba(240,237,232,0.04);
                border: 1px solid #33333D;
                border-radius: 12px;
                color: #F0EDE8; font-size: 14.5px;
                outline: none; box-sizing: border-box;
                transition: border-color 0.2s, box-shadow 0.2s;
                font-family: 'Cairo', sans-serif;
              }
              .pm-modal-input:focus { border-color: rgba(232,131,58,0.6); box-shadow: 0 0 0 3px rgba(232,131,58,0.1); }
              .pm-modal-input:disabled { opacity: 0.4; cursor: not-allowed; }
              .pm-modal-select {
                width: 100%; padding: 11px 14px;
                background: rgba(240,237,232,0.04);
                border: 1px solid #33333D;
                border-radius: 12px;
                color: #F0EDE8; font-size: 14.5px;
                outline: none; cursor: pointer; box-sizing: border-box;
                font-family: 'Cairo', sans-serif;
                transition: border-color 0.2s;
              }
              .pm-modal-select:focus { border-color: rgba(232,131,58,0.6); }
              .pm-sec-label {
                font-size: 11.5px; font-weight: 800; letter-spacing: 1px;
                text-transform: uppercase; color: #9A9A9A; margin-bottom: 14px;
                display: flex; align-items: center; gap: 8px;
              }
              .pm-sec-label::before {
                content: ''; display: block; width: 4px; height: 14px;
                border-radius: 2px; background: linear-gradient(135deg,#E8833A,#F4B740);
              }
              .pm-feat-check {
                display: flex; align-items: center; gap: 10px;
                padding: 12px 14px; border-radius: 14px; cursor: pointer;
                border: 1px solid; transition: all 0.18s;
              }
              .pm-limit-item {
                display: flex; align-items: center; gap: 10px;
                padding: 12px 14px; border-radius: 14px;
                background: rgba(232,131,58,0.03); border: 1px solid #33333D;
              }
            `}</style>

            {/* ── Header ── */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #33333D', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(232,131,58,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg,#E8833A,#D4712E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(232,131,58,0.3)' }}>
                  {editingPlanId ? <Pencil size={18} color="#fff" /> : <PlusCircle size={18} color="#fff" />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#F0EDE8' }}>
                    {editingPlanId ? (locale === 'ar' ? 'تعديل بيانات الباقة' : 'Edit Plan') : (locale === 'ar' ? 'إنشاء باقة جديدة' : 'Create New Plan')}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9A9A9A' }}>
                    {editingPlanId ? (locale === 'ar' ? 'عدّل تفاصيل الباقة وحفظها' : 'Modify plan details and save') : (locale === 'ar' ? 'اضبط جميع التفاصيل وأطلق الباقة' : 'Configure all details and launch')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                style={{ background: 'rgba(240,237,232,0.05)', border: '1px solid #33333D', borderRadius: '10px', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9A9A9A', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,83,80,0.1)'; (e.currentTarget as HTMLElement).style.color = '#EF5350'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,83,80,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(240,237,232,0.05)'; (e.currentTarget as HTMLElement).style.color = '#9A9A9A'; (e.currentTarget as HTMLElement).style.borderColor = '#33333D'; }}
              >
                <XCircle size={17} />
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div style={{ padding: '28px', overflowY: 'auto', flex: 1 }}>
              <form id="planForm" onSubmit={handleAddPlan} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* ① Basic Info */}
                <div>
                  <div className="pm-sec-label">{locale === 'ar' ? 'البيانات الأساسية' : 'Basic Information'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12.5px', color: '#9A9A9A', display: 'block', marginBottom: '6px', fontWeight: 700 }}>{locale === 'ar' ? 'اسم الباقة' : 'Plan Name'}</label>
                      <input type="text" required className="pm-modal-input" value={adminPlanName} onChange={(e) => setAdminPlanName(e.target.value)} placeholder="Starter, Max, VIP..." />
                    </div>
                    <div>
                      <label style={{ fontSize: '12.5px', color: '#9A9A9A', display: 'block', marginBottom: '6px', fontWeight: 700 }}>{locale === 'ar' ? 'السعر (SAR)' : 'Price (SAR)'}</label>
                      <input type="number" step="0.01" required className="pm-modal-input" value={adminPlanPrice} onChange={(e) => setAdminPlanPrice(e.target.value)} placeholder="99.00" />
                    </div>
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12.5px', color: '#9A9A9A', display: 'block', marginBottom: '6px', fontWeight: 700 }}>{locale === 'ar' ? 'وصف الباقة' : 'Description'}</label>
                    <input type="text" className="pm-modal-input" value={adminPlanDesc} onChange={(e) => setAdminPlanDesc(e.target.value)} placeholder={locale === 'ar' ? 'وصف قصير يظهر تحت اسم الباقة' : 'Short description'} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12.5px', color: '#9A9A9A', display: 'block', marginBottom: '6px', fontWeight: 700 }}>{locale === 'ar' ? 'مدة الاشتراك (أيام)' : 'Duration (Days)'}</label>
                    <input type="number" required className="pm-modal-input" value={adminPlanDays} onChange={(e) => setAdminPlanDays(e.target.value)} style={{ maxWidth: '200px' }} />
                  </div>
                </div>

                {/* ② Usage Limits */}
                <div>
                  <div className="pm-sec-label">{locale === 'ar' ? 'حدود الاستخدام' : 'Usage Limits'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { icon: <MessageCircle size={14} style={{ flexShrink: 0, marginTop: '2px', color: '#9A9A9A' }} />, lbl: locale === 'ar' ? 'الرسائل' : 'Messages', val: adminPlanMsgs, setVal: setAdminPlanMsgs, unlimited: adminPlanUnlimitedMsgs, setUnlimited: setAdminPlanUnlimitedMsgs },
                      { icon: <Smartphone size={14} style={{ flexShrink: 0, marginTop: '2px', color: '#9A9A9A' }} />, lbl: locale === 'ar' ? 'الأجهزة' : 'Devices', val: adminPlanDevices, setVal: setAdminPlanDevices, unlimited: adminPlanUnlimitedDevices, setUnlimited: setAdminPlanUnlimitedDevices },
                      { icon: <Phone size={14} style={{ flexShrink: 0, marginTop: '2px', color: '#9A9A9A' }} />, lbl: locale === 'ar' ? 'الأرقام' : 'Numbers', val: adminPlanNumbers, setVal: setAdminPlanNumbers, unlimited: adminPlanUnlimitedNumbers, setUnlimited: setAdminPlanUnlimitedNumbers },
                    ].map((row, ri) => (
                      <div key={ri} className="pm-limit-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                          {row.icon}
                          <span style={{ fontSize: '13.5px', color: '#F0EDE8', fontWeight: 600 }}>{row.lbl}</span>
                        </div>
                        <input type="number" disabled={row.unlimited} value={row.val} onChange={(e) => row.setVal(e.target.value)} className="pm-modal-input" style={{ width: '110px', textAlign: 'center', opacity: row.unlimited ? 0.3 : 1 }} />
                        <div onClick={() => row.setUnlimited(!row.unlimited)} style={{ width: 42, height: 24, borderRadius: '12px', cursor: 'pointer', background: row.unlimited ? 'linear-gradient(135deg,#E8833A,#F4B740)' : 'rgba(240,237,232,0.1)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                          <div style={{ position: 'absolute', top: '2px', width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: row.unlimited ? '20px' : '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: row.unlimited ? '#E8833A' : '#9A9A9A', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '64px' }}>∞ {locale === 'ar' ? 'غير محدود' : 'Unlimited'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ③ Features */}
                <div>
                  <div className="pm-sec-label">{locale === 'ar' ? 'المميزات المتاحة' : 'Available Features'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
                    {[
                      { key: 'interactive_bot', icon: <Bot size={13} />, label: locale === 'ar' ? 'البوت التفاعلي' : 'Interactive Bot' },
                      { key: 'ai_reply', icon: <Sparkles size={13} />, label: locale === 'ar' ? 'ردود AI' : 'AI Replies' },
                      { key: 'webhooks', icon: <LinkIcon size={13} />, label: 'Webhooks' },
                      { key: 'api_access', icon: <Zap size={13} />, label: locale === 'ar' ? 'واجهة API' : 'API Access' },
                      { key: 'broadcasts', icon: <Megaphone size={13} />, label: locale === 'ar' ? 'إشعارات جماعية' : 'Broadcasts' },
                    ].map(feat => {
                      const on = adminPlanFeatures[feat.key as keyof typeof adminPlanFeatures];
                      return (
                        <label key={feat.key} className="pm-feat-check" style={{ borderColor: on ? 'rgba(232,131,58,0.4)' : '#33333D', background: on ? 'rgba(232,131,58,0.08)' : 'rgba(240,237,232,0.02)' }}>
                          <input type="checkbox" checked={on} onChange={(e) => setAdminPlanFeatures({ ...adminPlanFeatures, [feat.key]: e.target.checked })} style={{ display: 'none' }} />
                          <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: on ? 'linear-gradient(135deg,#E8833A,#F4B740)' : 'rgba(240,237,232,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${on ? 'rgba(232,131,58,0.6)' : 'rgba(240,237,232,0.1)'}` }}>
                            {on && <Check size={11} color="#fff" />}
                          </div>
                          <span style={{ fontSize: '12px', marginRight: '4px' }}>{feat.icon}</span>
                          <span style={{ fontSize: '13px', color: on ? '#F0EDE8' : '#9A9A9A', fontWeight: on ? 700 : 500 }}>{feat.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* ④ Status & Support */}
                <div>
                  <div className="pm-sec-label">{locale === 'ar' ? 'الحالة والدعم الفني' : 'Status & Support'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12.5px', color: '#9A9A9A', display: 'block', marginBottom: '6px', fontWeight: 700 }}>{locale === 'ar' ? 'نوع الدعم' : 'Support Type'}</label>
                      <select className="pm-modal-select" value={adminPlanSupport} onChange={(e) => setAdminPlanSupport(e.target.value)}>
                        <option value="regular">{locale === 'ar' ? 'عادي (Regular)' : 'Regular'}</option>
                        <option value="priority">{locale === 'ar' ? 'أولوية (Priority)' : 'Priority'}</option>
                        <option value="vip">{locale === 'ar' ? 'VIP مميز' : 'VIP'}</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12.5px', color: '#9A9A9A', display: 'block', marginBottom: '6px', fontWeight: 700 }}>{locale === 'ar' ? 'حالة الباقة' : 'Plan Status'}</label>
                      <select className="pm-modal-select" value={adminPlanIsActive ? 'active' : 'disabled'} onChange={(e) => setAdminPlanIsActive(e.target.value === 'active')} style={{ color: adminPlanIsActive ? '#27C281' : '#9A9A9A' }}>
                        <option value="active">{locale === 'ar' ? 'مفعّلة — ظاهرة للعملاء' : 'Active — Visible'}</option>
                        <option value="disabled">{locale === 'ar' ? 'معطّلة — مخفية' : 'Disabled — Hidden'}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ⑤ Visual Identity */}
                <div>
                  <div className="pm-sec-label">{locale === 'ar' ? 'الهوية البصرية' : 'Visual Identity'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12.5px', color: '#9A9A9A', display: 'block', marginBottom: '6px', fontWeight: 700 }}>{locale === 'ar' ? 'الأيقونة' : 'Icon'}</label>
                      <select className="pm-modal-select" value={adminPlanIcon} onChange={(e) => setAdminPlanIcon(e.target.value)}>
                        <option value="basic">Package (Basic)</option>
                        <option value="vip">Crown (VIP / Diamond)</option>
                        <option value="max">Zap (Max)</option>
                        <option value="plus">Plus (Plus)</option>
                        <option value="gold">Medal (Gold)</option>
                        <option value="silver">Shield (Silver)</option>
                        <option value="diamond">Gem (Platinum)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12.5px', color: '#9A9A9A', display: 'block', marginBottom: '6px', fontWeight: 700 }}>{locale === 'ar' ? 'تدرج اللون' : 'Color Gradient'}</label>
                      <select className="pm-modal-select" value={adminPlanGradient} onChange={(e) => setAdminPlanGradient(e.target.value)}>
                        <option value="linear-gradient(135deg, #E8833A, #F4B740)">Orange / Gold</option>
                        <option value="linear-gradient(135deg, #F4B740, #D4972E)">Gold</option>
                        <option value="linear-gradient(135deg, #A68B5B, #8B7248)">Silver / Bronze</option>
                        <option value="linear-gradient(135deg, #27C281, #1DA66D)">Green</option>
                        <option value="linear-gradient(135deg, #333333, #000000)">Dark</option>
                      </select>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #33333D', background: '#1E1E24' }}>
                    <div style={{ height: '4px', background: adminPlanGradient }} />
                    <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: 46, height: 46, borderRadius: '14px', background: adminPlanGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                        {renderPlanIcon(adminPlanIcon)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#F0EDE8' }}>{adminPlanName || (locale === 'ar' ? 'اسم الباقة' : 'Plan Name')}</div>
                        <div style={{ fontSize: '12px', color: '#9A9A9A', marginTop: '4px' }}>{adminPlanDesc || (locale === 'ar' ? 'وصف مختصر' : 'Short description')}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#F0EDE8', lineHeight: 1, fontFamily: "'Cairo', sans-serif" }}>{adminPlanPrice || '0'} <span style={{ fontSize: '12px', color: '#9A9A9A' }}>SAR</span></div>
                        <div style={{ fontSize: '12px', color: '#9A9A9A', marginTop: '4px' }}>/ {adminPlanDays || '30'} {locale === 'ar' ? 'يوم' : 'days'}</div>
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* ── Footer ── */}
            <div style={{ padding: '20px 28px', borderTop: '1px solid #33333D', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(240,237,232,0.02)' }}>
              <button type="button" onClick={() => setIsPlanModalOpen(false)} style={{ padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', background: 'rgba(240,237,232,0.05)', border: '1px solid #33333D', color: '#F0EDE8', fontSize: '13.5px', fontWeight: 700, transition: 'all 0.2s', fontFamily: "'Cairo', sans-serif" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(240,237,232,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(240,237,232,0.05)'; }}
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" form="planForm" disabled={savingAdminPlan} style={{ padding: '12px 32px', borderRadius: '12px', cursor: savingAdminPlan ? 'not-allowed' : 'pointer', background: savingAdminPlan ? 'rgba(232,131,58,0.5)' : 'linear-gradient(135deg,#E8833A,#D4712E)', border: 'none', color: '#fff', fontSize: '13.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: savingAdminPlan ? 'none' : '0 8px 24px rgba(232,131,58,0.3)', transition: 'all 0.2s cubic-bezier(.4,0,.2,1)', fontFamily: "'Cairo', sans-serif" }}
                onMouseEnter={e => { if (!savingAdminPlan) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(232,131,58,0.4)'; } }}
                onMouseLeave={e => { if (!savingAdminPlan) { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(232,131,58,0.3)'; } }}
              >
                {savingAdminPlan ? (
                  <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} /> {locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</>
                ) : (
                  <>{editingPlanId ? <Save size={16} /> : <PlusCircle size={16} />} {editingPlanId ? (locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (locale === 'ar' ? 'إنشاء الباقة' : 'Create Plan')}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSubscribeModalOpen && selectedSubscribePlan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8, 10, 18, 0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px', animation: 'fadeInUpPricing 0.3s ease-out' }}>
          <div style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: selectedSubscribePlan.is_popular ? 'linear-gradient(90deg, #a855f7, #fb923c)' : 'linear-gradient(90deg, #38bdf8, #8b5cf6)' }} />

            <div style={{ padding: '24px 24px 16px', textAlign: 'center', position: 'relative' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Package size={20} color={selectedSubscribePlan.is_popular ? '#fb923c' : '#38bdf8'} />
                {locale === 'ar' ? 'تأكيد الاشتراك والتحويل' : 'Subscription & Transfer'}
              </h3>
            </div>

            <div style={{ padding: '0 24px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Plan Details Summary */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '2px' }}>{locale === 'ar' ? 'الباقة المختارة' : 'Selected Package'}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{selectedSubscribePlan.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '2px' }}>{locale === 'ar' ? 'المبلغ' : 'Amount'}</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: selectedSubscribePlan.is_popular ? '#fb923c' : '#38bdf8' }}>
                    {selectedSubscribePlan.price} <span style={{ fontSize: '12px' }}>SAR</span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#94A3B8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{locale === 'ar' ? 'البنك:' : 'Bank:'}</span> <strong style={{ color: '#fff' }}>{locale === 'ar' ? 'البنك الأهلي (SNB)' : 'SNB Bank'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{locale === 'ar' ? 'اسم الحساب:' : 'Account Name:'}</span> <strong style={{ color: '#fff' }}>{locale === 'ar' ? 'مؤسسة الصقر المظلم' : 'Dark Falcon Foundation'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{locale === 'ar' ? 'رقم الحساب:' : 'Account Number:'}</span> <strong style={{ color: '#fff', fontSize: '14px' }}>12345678901234</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{locale === 'ar' ? 'الآيبان:' : 'IBAN:'}</span> <strong style={{ color: '#fff', fontSize: '12px' }}>SA12345678901234567890</strong></div>
                </div>
              </div>

              {/* Upload Receipt */}
              <form id="subscribeForm" onSubmit={handleSubscribeSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FileUp size={18} color="#94A3B8" />
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#E2E8F0' }}>
                      {locale === 'ar' ? 'إرفاق إيصال التحويل' : 'Upload Receipt'}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setReceiptFile(e.target.files ? e.target.files[0] : null)}
                    style={{ width: '100%', color: '#94A3B8', fontSize: '12px' }}
                  />
                </div>
              </form>
            </div>

            <div style={{ padding: '0 24px 20px', display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setIsSubscribeModalOpen(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#E2E8F0', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" form="subscribeForm" disabled={isSubscribing || !receiptFile} style={{ flex: 2, padding: '12px', background: isSubscribing || !receiptFile ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, #38bdf8, #8b5cf6)', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', color: '#fff', cursor: (isSubscribing || !receiptFile) ? 'not-allowed' : 'pointer', boxShadow: isSubscribing || !receiptFile ? 'none' : '0 8px 16px rgba(139, 92, 246, 0.3)', transition: 'all 0.2s' }}>
                {isSubscribing ? (
                  <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} /> {locale === 'ar' ? 'جاري الإرسال...' : 'Sending...'}</>
                ) : (
                  locale === 'ar' ? 'تأكيد وإرسال الطلب' : 'Confirm Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#27ae60',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '30px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          zIndex: 99999,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeUp 0.3s ease-out'
        }}>
          <CheckCircle size={20} />
          {toastMsg}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={executeDeleteInstance}
        title={locale === 'ar' ? 'حذف الجلسة' : 'Delete Session'}
        message={locale === 'ar' ? 'هل أنت متأكد من حذف هذه الجلسة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this session permanently? This action cannot be undone.'}
        type="danger"
        isLoading={isDeleting}
        error={deleteError}
        confirmText={locale === 'ar' ? 'نعم، احذف' : 'Yes, Delete'}
        cancelText={locale === 'ar' ? 'إلغاء' : 'Cancel'}
      />
    </div>
  );
}
