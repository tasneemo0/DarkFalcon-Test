'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/context';
import { apiFetch } from '@/lib/api';
import {
  Search, RefreshCcw, Download, User, Edit, Shield, FileText, Trash2,
  ShieldOff, Crown, X, ChevronLeft, ChevronRight, CheckCircle, Eye, Lock,
  Users, Activity, UserCheck, UserX, Bell, Zap, LayoutGrid, AlignJustify,
  Check, TrendingUp, Smartphone, Plus, MoreHorizontal, AlertTriangle,
  Columns, Star, UserPlus, UserMinus, Filter, MoreVertical, Edit2, Power, PowerOff,
  ArrowRight, ArrowLeft
} from 'lucide-react';
import { ExportCustomersModal } from './modals/ExportCustomersModal';
import { SendNotificationModal } from './modals/SendNotificationModal';
import { RefreshCustomersModal } from './modals/RefreshCustomersModal';
import { ActivityReportModal } from './modals/ActivityReportModal';
import * as LucideIcons from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const renderIcon = (iconName: string, size: number = 20) => {
  const IconComponent = (LucideIcons as any)[iconName];
  if (!IconComponent) return <LucideIcons.Shield size={size} />;
  return <IconComponent size={size} />;
};

/** Generate a deterministic gradient from a string */
function gradientFromString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    ['#E8833A', '#A68B5B'],
    ['#F59E0B', '#E8833A'],
    ['#22C55E', '#16A34A'],
    ['#8B5CF6', '#6D28D9'],
    ['#EC4899', '#DB2777'],
    ['#14B8A6', '#0D9488'],
    ['#3B82F6', '#1D4ED8'],
    ['#F97316', '#EA580C'],
  ];
  return palettes[Math.abs(hash) % palettes.length];
}

function Avatar({ name, email, size = 42 }: { name?: string; email: string; size?: number }) {
  const label = (name || email)[0]?.toUpperCase() || '?';
  const [c1, c2] = gradientFromString(email);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.38, color: '#fff',
      flexShrink: 0, border: '2px solid rgba(255,255,255,0.12)',
      boxShadow: `0 4px 12px ${c1}40`,
      transition: 'transform 0.2s cubic-bezier(.4,0,.2,1), box-shadow 0.2s',
    }}
      className="aum-avatar"
    >
      {label}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function AdminUsersManager() {
  const { locale, token, logout } = useApp();
  const isAr = locale === 'ar';

  /* ── Toast ────────────────────────────────────────────────────── */
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMsg(msg);
    setToastType(type);
  };

  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(''), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  /* ── Data State ───────────────────────────────────────────────── */
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, new_this_month: 0 });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Filters & Pagination ─────────────────────────────────────── */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ── UI State ─────────────────────────────────────────────────── */
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /* ── Modals & Drawers ─────────────────────────────────────────── */
  const [drawerUser, setDrawerUser] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [statusUser, setStatusUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');
  const [drawerTab, setDrawerTab] = useState('basic');
  const [assigningAdmin, setAssigningAdmin] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);

  /* ── Forms ────────────────────────────────────────────────────── */
  const [statusReason, setStatusReason] = useState('');
  const [newStatus, setNewStatus] = useState('');

  /* ── Page entrance animation ──────────────────────────────────── */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  /* ─────────────────────────────────────────────────────────────── */
  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await apiFetch(endpoint, { ...options, headers });
    return response.json();
  };

  const fetchUsers = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const qs = new URLSearchParams();
      if (search) qs.append('search', search);
      if (statusFilter !== 'all') qs.append('status', statusFilter);
      if (typeFilter !== 'all') qs.append('type', typeFilter);
      qs.append('page', page.toString());
      const res = await fetchWithAuth(`/api/v1/admin/clients/?${qs.toString()}`);
      if (res.results) {
        setUsers(res.results);
        if (res.stats) setStats(res.stats);
        if (res.count) setTotalPages(Math.ceil(res.count / 20));
      } else {
        showToast(isAr ? 'فشل تحميل البيانات' : 'Failed to load data', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(isAr ? 'خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, statusFilter, typeFilter, page]);

  useEffect(() => {
    if (assigningAdmin && roles.length === 0) {
      fetchWithAuth('/api/v1/admin/roles/').then(res => {
        setRoles(res?.results || (Array.isArray(res) ? res : []));
      });
    }
  }, [assigningAdmin]);

  /* ─────────────────────────────────────────────────────────────── */
  const handleImpersonate = async (user: any) => {
    try {
      const res = await fetchWithAuth(`/api/v1/admin/clients/${user.id}/impersonate/`, { method: 'POST' });
      if (res.tokens && res.user) {
        localStorage.setItem('df-admin-token', localStorage.getItem('df-token') || '');
        localStorage.setItem('df-admin-user', localStorage.getItem('df-user') || '');

        localStorage.setItem('df-token', res.tokens.access);
        localStorage.setItem('df-user', JSON.stringify(res.user));

        window.location.href = '/dashboard';
      } else {
        showToast(res.error || (isAr ? 'فشل الدخول' : 'Failed to impersonate'), 'error');
      }
    } catch { showToast(isAr ? 'فشل الدخول' : 'Failed to impersonate', 'error'); }
  };

  const handleChangeStatus = async () => {
    if (!statusUser) return;
    try {
      const res = await fetchWithAuth(`/api/v1/admin/clients/${statusUser.id}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: statusReason })
      });
      if (res.message) {
        showToast(res.message, 'success');
        setStatusUser(null);
        fetchUsers();
      } else {
        showToast(res.error || 'Error', 'error');
      }
    } catch { showToast('Error', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      const res = await fetchWithAuth(`/api/v1/admin/clients/${deleteUser.id}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hard_delete: deleteType === 'hard' })
      });
      if (res.message) {
        showToast(res.message, 'success');
        setDeleteUser(null);
        fetchUsers();
      } else {
        showToast(res.error || 'Error', 'error');
      }
    } catch { showToast('Error', 'error'); }
  };

  const submitAssignRole = async (userId: number, roleId: number | null) => {
    try {
      let url = '', method = '', body: string | null = null;
      if (roleId === null) {
        url = `/api/v1/admin/managers/${userId}/remove-admin/`;
        method = 'DELETE';
      } else if (assigningAdmin?.admin_role) {
        url = `/api/v1/admin/managers/${userId}/change-role/`;
        method = 'PATCH';
        body = JSON.stringify({ role_id: roleId });
      } else {
        url = `/api/v1/admin/managers/assign-role/`;
        method = 'POST';
        body = JSON.stringify({ user_id: userId, role_id: roleId });
      }
      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body ? { body } : {})
      });
      if (res && !res.error) {
        showToast(isAr ? 'تم تعيين الرتبة بنجاح' : 'Role assigned successfully', 'success');
        setAssigningAdmin(null);
        fetchUsers();
      } else {
        showToast(res.error || (isAr ? 'حدث خطأ' : 'Error'), 'error');
      }
    } catch { showToast(isAr ? 'حدث خطأ' : 'Error', 'error'); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      const res = await fetchWithAuth(`/api/v1/admin/clients/${editUser.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editUser.email,
          profile: {
            full_name: editUser.profile?.full_name,
            phone_number: editUser.profile?.phone_number,
            account_type: editUser.profile?.account_type,
            internal_notes: editUser.profile?.internal_notes
          }
        })
      });
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast(isAr ? 'تم تحديث البيانات بنجاح' : 'Data updated successfully', 'success');
        setEditUser(null);
        fetchUsers();
      }
    } catch { showToast('Error', 'error'); }
  };

  /* ── Bulk selection helpers ───────────────────────────────────── */
  const allSelected = users.length > 0 && users.every(u => selectedIds.has(u.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(users.map(u => u.id)));
  };
  const toggleOne = (id: number) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  /* ── Row height from density ──────────────────────────────────── */
  const rowPad = density === 'compact' ? '10px 16px' : '18px 20px';

  /* ─────────────────────────────────────────────────────────────────────────
     STATUS / TYPE CONFIGS
  ───────────────────────────────────────────────────────────────────────── */
  const statusConfig: Record<string, { color: string; bg: string; dot: string; labelAr: string; labelEn: string; pulse?: boolean }> = {
    active: { color: '#22C55E', bg: '#22C55E18', dot: '#22C55E', labelAr: 'نشط', labelEn: 'Active', pulse: true },
    suspended: { color: '#F59E0B', bg: '#F59E0B18', dot: '#F59E0B', labelAr: 'موقوف', labelEn: 'Suspended' },
    banned: { color: '#EF4444', bg: '#EF444418', dot: '#EF4444', labelAr: 'محظور', labelEn: 'Banned' },
    pending: { color: '#A68B5B', bg: '#A68B5B18', dot: '#A68B5B', labelAr: 'بانتظار التحقق', labelEn: 'Pending' },
  };
  const typeConfig: Record<string, { color: string; bg: string; icon: string; labelAr: string; labelEn: string }> = {
    professional: { color: '#8B5CF6', bg: '#8B5CF618', icon: '⚡', labelAr: 'احترافي', labelEn: 'Professional' },
    company: { color: '#E8833A', bg: '#E8833A18', icon: '🏢', labelAr: 'شركة', labelEn: 'Company' },
    ordinary: { color: '#9A9A9A', bg: '#9A9A9A18', icon: '👤', labelAr: 'عادي', labelEn: 'Ordinary' },
  };

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div
      className="aum-root"
      style={{
        display: 'flex', flexDirection: 'column', gap: '28px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(12px)',
        transition: 'opacity 0.35s cubic-bezier(.4,0,.2,1), transform 0.35s cubic-bezier(.4,0,.2,1)',
      }}
    >
      {/* ════════════════════════════════════════════════════════════
          GLOBAL STYLES
      ════════════════════════════════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap');

        .aum-root { font-family: var(--font-family-arabic, 'Tajawal', 'Inter', sans-serif); }

        /* ── Keyframes ── */
        @keyframes aum-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aum-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes aum-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.5); }
        }
        @keyframes aum-ripple {
          0%   { transform: scale(0); opacity: 0.4; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes aum-scaleIn {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes aum-slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes aum-slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes aum-toastIn {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes aum-heroGlow {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.7; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes aum-counter {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Cards ── */
        .aum-stat-card {
          background: var(--surface);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 24px;
          display: flex; flex-direction: column; gap: 16px;
          position: relative; overflow: hidden;
          transition: transform 0.22s cubic-bezier(.4,0,.2,1),
                      box-shadow 0.22s cubic-bezier(.4,0,.2,1),
                      border-color 0.22s;
          cursor: default;
        }
        .aum-stat-card::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 80% 0%, var(--aum-card-glow, transparent) 0%, transparent 70%);
          pointer-events: none;
          transition: opacity 0.3s;
        }
        .aum-stat-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.14), 0 8px 16px rgba(0,0,0,0.08);
          border-color: var(--aum-card-border, var(--border-light));
        }

        /* ── Quick Actions ── */
        .aum-qa-card {
          background: var(--surface);
          border: 1px solid var(--border-light);
          border-radius: 16px;
          padding: 20px 18px;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          cursor: pointer; flex: 1; min-width: 110px;
          position: relative; overflow: hidden;
          transition: transform 0.2s cubic-bezier(.4,0,.2,1),
                      border-color 0.2s, box-shadow 0.2s;
          text-align: center;
        }
        .aum-qa-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.12);
        }
        .aum-qa-card:active { transform: scale(0.97); }

        /* ── Ripple ── */
        .aum-ripple-container { position: relative; overflow: hidden; }
        .aum-ripple-container .aum-ripple-effect {
          position: absolute; border-radius: 50%;
          background: rgba(255,255,255,0.3);
          pointer-events: none;
          animation: aum-ripple 0.55s ease-out forwards;
        }

        /* ── Table rows ── */
        .aum-tr {
          border-bottom: 1px solid var(--border-light);
          transition: background 0.18s cubic-bezier(.4,0,.2,1),
                      box-shadow 0.18s;
        }
        .aum-tr:hover {
          background: var(--surface-hover, rgba(232,131,58,0.04)) !important;
          box-shadow: inset 3px 0 0 var(--primary);
        }
        .aum-tr.selected {
          background: rgba(232,131,58,0.07) !important;
          box-shadow: inset 3px 0 0 var(--primary);
        }

        /* ── Action Icon Buttons ── */
        .aum-icon-btn {
          width: 34px; height: 34px; border-radius: 10px;
          border: 1px solid var(--border-light);
          background: var(--bg-tertiary, rgba(255,255,255,0.05));
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: transform 0.18s cubic-bezier(.4,0,.2,1),
                      box-shadow 0.18s, background 0.18s, border-color 0.18s;
          position: relative;
        }
        .aum-icon-btn:hover { transform: scale(1.12); }
        .aum-icon-btn:active { transform: scale(0.94); }
        .aum-icon-btn.view:hover  { background: rgba(59,130,246,0.15);  border-color: #3B82F6; box-shadow: 0 0 12px rgba(59,130,246,0.25); }
        .aum-icon-btn.edit:hover  { background: rgba(232,131,58,0.15);  border-color: #E8833A; box-shadow: 0 0 12px rgba(232,131,58,0.25); }
        .aum-icon-btn.crown:hover { background: rgba(245,158,11,0.15);  border-color: #F59E0B; box-shadow: 0 0 12px rgba(245,158,11,0.25); }
        .aum-icon-btn.shield:hover{ background: rgba(34,197,94,0.15);   border-color: #22C55E; box-shadow: 0 0 12px rgba(34,197,94,0.25); }
        .aum-icon-btn.delete:hover{ background: rgba(239,68,68,0.15);   border-color: #EF4444; box-shadow: 0 0 12px rgba(239,68,68,0.25); }
        .aum-icon-btn.details:hover{ background: rgba(139,92,246,0.15); border-color: #8B5CF6; box-shadow: 0 0 12px rgba(139,92,246,0.25); }

        /* ── Tooltip ── */
        .aum-tooltip-wrap { position: relative; }
        .aum-tooltip-wrap .aum-tooltip {
          position: absolute; bottom: calc(100% + 8px); left: 50%;
          transform: translateX(-50%);
          background: #1a1a2e; color: #fff;
          font-size: 11px; font-weight: 600; white-space: nowrap;
          padding: 5px 9px; border-radius: 7px;
          pointer-events: none; opacity: 0;
          transition: opacity 0.18s;
          z-index: 100;
        }
        .aum-tooltip-wrap:hover .aum-tooltip { opacity: 1; }

        /* ── Badge Pulse dot ── */
        .aum-dot-pulse { animation: aum-pulse 2s ease-in-out infinite; }

        /* ── Skeleton ── */
        .aum-skeleton {
          background: linear-gradient(90deg,
            var(--bg-tertiary, #26262e) 25%,
            var(--surface-hover, #2e2e38) 50%,
            var(--bg-tertiary, #26262e) 75%);
          background-size: 400px 100%;
          animation: aum-shimmer 1.4s ease-in-out infinite;
          border-radius: 8px;
        }

        /* ── Search input ── */
        .aum-search:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(232,131,58,0.18); }

        /* ── Select ── */
        .aum-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239A9A9A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: left 10px center; padding-left: 32px; }

        /* ── Stagger cards ── */
        .aum-stagger-1 { animation: aum-fadeUp 0.4s cubic-bezier(.4,0,.2,1) 0.05s both; }
        .aum-stagger-2 { animation: aum-fadeUp 0.4s cubic-bezier(.4,0,.2,1) 0.12s both; }
        .aum-stagger-3 { animation: aum-fadeUp 0.4s cubic-bezier(.4,0,.2,1) 0.19s both; }
        .aum-stagger-4 { animation: aum-fadeUp 0.4s cubic-bezier(.4,0,.2,1) 0.26s both; }

        /* ── Bulk bar ── */
        .aum-bulk-bar {
          animation: aum-fadeUp 0.25s cubic-bezier(.4,0,.2,1) both;
        }

        /* ── Avatar hover ── */
        .aum-avatar:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(0,0,0,0.25) !important; }

        /* ── Progress fill ── */
        .aum-progress-fill {
          height: 100%; border-radius: 99px;
          transition: width 1.2s cubic-bezier(.4,0,.2,1);
        }

        /* ── Form controls ── */
        .aum-input {
          width: 100%; padding: 11px 14px;
          background: var(--bg-primary);
          border: 1.5px solid var(--border-light);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          font-family: inherit;
        }
        .aum-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(232,131,58,0.15); }
        .aum-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; display: block; }

        /* ── Modal overlay ── */
        .aum-modal-overlay {
          position: fixed; inset: 0; z-index: 1100;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .aum-modal-box {
          background: var(--surface);
          border: 1px solid var(--border-light);
          border-radius: 24px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.35);
          animation: aum-scaleIn 0.25s cubic-bezier(.4,0,.2,1) both;
          overflow: hidden;
        }

        /* ── Drawer ── */
        .aum-drawer {
          width: 100%; max-width: 580px;
          background: var(--bg-primary);
          height: 100%;
          display: flex; flex-direction: column;
          animation: aum-slideInRight 0.3s cubic-bezier(.4,0,.2,1) both;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .aum-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .aum-qa-row { flex-wrap: wrap !important; }
          .aum-hero-inner { flex-direction: column !important; align-items: flex-start !important; }
          .aum-toolbar { flex-direction: column !important; }
          .aum-toolbar-filters { flex-wrap: wrap !important; }
        }
        @media (max-width: 600px) {
          .aum-stats-grid { grid-template-columns: 1fr !important; }
          .aum-table-wrap { overflow-x: auto; }
        }

        /* ── Density badge ── */
        .aum-density-btn {
          padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 600;
          border: 1px solid var(--border-light);
          background: transparent; cursor: pointer; color: var(--text-secondary);
          display: flex; align-items: center; gap: 5px;
          transition: background 0.18s, color 0.18s, border-color 0.18s;
        }
        .aum-density-btn.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }

        /* Light mode overrides for table head */
        [data-theme="light"] .aum-th { background: #F5F0EB !important; }

        /* ── Hero glow orb ── */
        .aum-hero-orb {
          position: absolute; border-radius: 50%;
          filter: blur(60px); pointer-events: none;
          animation: aum-heroGlow 4s ease-in-out infinite;
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════
          TOAST
      ════════════════════════════════════════════════════════════ */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '28px', left: '50%',
          transform: 'translateX(-50%)',
          background: toastType === 'success' ? 'linear-gradient(135deg,#166534,#14532d)' :
            toastType === 'error' ? 'linear-gradient(135deg,#7f1d1d,#991b1b)' :
              'linear-gradient(135deg,#1e1e2e,#2d2d3e)',
          color: '#fff', padding: '12px 22px', borderRadius: '14px',
          zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '14px', fontWeight: 600,
          animation: 'aum-toastIn 0.28s cubic-bezier(.4,0,.2,1) both',
          border: `1px solid ${toastType === 'success' ? '#22c55e40' : toastType === 'error' ? '#ef444440' : '#ffffff20'}`,
          backdropFilter: 'blur(12px)',
        }}>
          {toastType === 'success' ? <Check size={16} color="#4ade80" /> :
            toastType === 'error' ? <X size={16} color="#f87171" /> :
              <Bell size={16} color="#fbbf24" />}
          {toastMsg}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        {/* Glow orbs */}
        <div className="aum-hero-orb" style={{ width: 260, height: 260, top: -80, right: -60, background: 'rgba(232,131,58,0.12)' }} />
        <div className="aum-hero-orb" style={{ width: 180, height: 180, bottom: -60, left: -40, background: 'rgba(166,139,91,0.08)', animationDelay: '2s' }} />

        <div className="aum-hero-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
          {/* Left: icon + text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '18px', flexShrink: 0,
              background: 'linear-gradient(135deg, #E8833A, #A68B5B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(232,131,58,0.35)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <Users size={30} color="#fff" />
            </div>
            <div>
              <h2 style={{
                margin: '0 0 6px 0', fontSize: 'clamp(20px, 3vw, 28px)',
                fontWeight: 900, lineHeight: 1.1,
                background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {isAr ? 'إدارة العملاء' : 'Client Management'}
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400 }}>
                {isAr
                  ? 'تحكم في حسابات العملاء، حالتهم، باقاتهم، وصلاحياتهم'
                  : 'Control accounts, statuses, plans, and permissions'}
              </p>
              {!loading && (
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {[
                    { label: isAr ? 'إجمالي' : 'Total', value: stats.total, color: '#E8833A' },
                    { label: isAr ? 'نشط' : 'Active', value: stats.active, color: '#22C55E' },
                    { label: isAr ? 'موقوف' : 'Suspended', value: stats.suspended, color: '#F59E0B' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'block' }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.label}:</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: search + buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isAr ? 'right' : 'left']: '13px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="aum-search"
                placeholder={isAr ? 'بحث سريع...' : 'Quick search...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1.5px solid var(--border-light)',
                  borderRadius: '12px',
                  padding: `10px ${isAr ? '13px' : '40px'} 10px ${isAr ? '40px' : '13px'}`,
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  width: '260px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={fetchUsers}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '10px 18px', borderRadius: '12px',
                  border: '1.5px solid var(--border-light)',
                  background: 'transparent', cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600,
                  transition: 'all 0.2s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
              >
                <RefreshCcw size={15} />
                {isAr ? 'تحديث' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          STATS CARDS
      ════════════════════════════════════════════════════════════ */}
      <div className="aum-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          {
            icon: <Users size={22} color="#E8833A" />,
            iconBg: 'rgba(232,131,58,0.15)', glow: 'rgba(232,131,58,0.12)', border: 'rgba(232,131,58,0.25)',
            title: isAr ? 'إجمالي العملاء' : 'Total Clients',
            value: stats.total, pct: 100, trend: '+12%', trendUp: true,
            badge: isAr ? 'الكل' : 'All', badgeBg: 'rgba(232,131,58,0.15)', badgeColor: '#E8833A',
            barColor: '#E8833A', cls: 'aum-stagger-1',
          },
          {
            icon: <UserCheck size={22} color="#22C55E" />,
            iconBg: 'rgba(34,197,94,0.15)', glow: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.25)',
            title: isAr ? 'النشطين' : 'Active',
            value: stats.active,
            pct: stats.total ? Math.round((stats.active / stats.total) * 100) : 0,
            trend: '+8%', trendUp: true,
            badge: isAr ? 'نشط' : 'Active', badgeBg: 'rgba(34,197,94,0.12)', badgeColor: '#22C55E',
            barColor: '#22C55E', cls: 'aum-stagger-2',
          },
          {
            icon: <UserX size={22} color="#F59E0B" />,
            iconBg: 'rgba(245,158,11,0.15)', glow: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)',
            title: isAr ? 'الموقوفون' : 'Suspended',
            value: stats.suspended,
            pct: stats.total ? Math.round((stats.suspended / stats.total) * 100) : 0,
            trend: '-3%', trendUp: false,
            badge: isAr ? 'موقوف' : 'Susp.', badgeBg: 'rgba(245,158,11,0.12)', badgeColor: '#F59E0B',
            barColor: '#F59E0B', cls: 'aum-stagger-3',
          },
          {
            icon: <TrendingUp size={22} color="#8B5CF6" />,
            iconBg: 'rgba(139,92,246,0.15)', glow: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.25)',
            title: isAr ? 'جدد هذا الشهر' : 'New This Month',
            value: stats.new_this_month, pct: 70, trend: '+24%', trendUp: true,
            badge: isAr ? 'شهر' : 'Month', badgeBg: 'rgba(139,92,246,0.12)', badgeColor: '#8B5CF6',
            barColor: '#8B5CF6', cls: 'aum-stagger-4',
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`aum-stat-card ${s.cls}`}
            style={{ '--aum-card-glow': s.glow, '--aum-card-border': s.border } as React.CSSProperties}
          >
            {loading ? (
              <>
                <div className="aum-skeleton" style={{ width: 44, height: 44 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="aum-skeleton" style={{ width: '60%', height: 14 }} />
                  <div className="aum-skeleton" style={{ width: '40%', height: 28 }} />
                </div>
                <div className="aum-skeleton" style={{ height: 5, width: '100%' }} />
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '12px',
                    background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {s.icon}
                  </div>
                  <span style={{
                    padding: '3px 9px', borderRadius: '20px',
                    background: s.badgeBg, color: s.badgeColor,
                    fontSize: '11px', fontWeight: 700,
                  }}>
                    {s.badge}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '4px' }}>{s.title}</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-1px', animation: 'aum-counter 0.5s ease both' }}><AnimatedNumber value={s.value} delay={i * 0.1} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: s.trendUp ? '#22C55E' : '#EF4444' }}>
                      {s.trend}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{isAr ? 'من الشهر الماضي' : 'vs last month'}</span>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{isAr ? 'النسبة' : 'Share'}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: s.badgeColor }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'var(--border-light)', overflow: 'hidden' }}>
                    <div className="aum-progress-fill" style={{ width: `${s.pct}%`, background: `linear-gradient(90deg, ${s.barColor}, ${s.barColor}aa)` }} />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          QUICK ACTIONS
      ════════════════════════════════════════════════════════════ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Zap size={16} color="var(--primary)" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
          </span>
        </div>
        <div className="aum-qa-row" style={{ display: 'flex', gap: '12px' }}>
          {[
            { icon: <Download size={20} color="#E8833A" />, iconBg: 'rgba(232,131,58,0.12)', label: isAr ? 'تصدير CSV' : 'Export CSV', border: 'rgba(232,131,58,0.2)', onClick: () => setIsExportModalOpen(true) },
            { icon: <Bell size={20} color="#8B5CF6" />, iconBg: 'rgba(139,92,246,0.12)', label: isAr ? 'إرسال إشعار' : 'Send Notification', border: 'rgba(139,92,246,0.2)', onClick: () => setIsNotifyModalOpen(true) },
            { icon: <RefreshCcw size={20} color="#22C55E" />, iconBg: 'rgba(34,197,94,0.12)', label: isAr ? 'تحديث البيانات' : 'Refresh Data', border: 'rgba(34,197,94,0.2)', onClick: () => setIsRefreshModalOpen(true) },
            { icon: <Activity size={20} color="#F59E0B" />, iconBg: 'rgba(245,158,11,0.12)', label: isAr ? 'تقرير النشاط' : 'Activity Report', border: 'rgba(245,158,11,0.2)', onClick: () => setIsActivityModalOpen(true) },
          ].map((qa, qi) => (
            <RippleCard
              key={qi}
              className="aum-qa-card"
              style={{ borderColor: qa.border }}
              onClick={qa.onClick}
            >
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: qa.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {qa.icon}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{qa.label}</span>
            </RippleCard>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          FILTERS TOOLBAR  (Sticky)
      ════════════════════════════════════════════════════════════ */}
      <div
        className="aum-toolbar"
        style={{
          position: 'sticky', top: '0', zIndex: 50,
          background: 'var(--surface)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px', padding: '14px 18px',
          display: 'flex', gap: '12px', alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Filters left */}
        <div className="aum-toolbar-filters" style={{ display: 'flex', gap: '10px', flex: 1, alignItems: 'center' }}>
          {/* Full search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isAr ? 'right' : 'left']: '12px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="aum-search"
              placeholder={isAr ? 'بحث بالاسم أو البريد أو الهاتف...' : 'Search by name, email or phone...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                border: '1.5px solid var(--border-light)',
                borderRadius: '12px',
                padding: `10px ${isAr ? '12px' : '38px'} 10px ${isAr ? '38px' : '12px'}`,
                color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Status select */}
          <select
            className="aum-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              background: 'var(--bg-primary)', border: '1.5px solid var(--border-light)',
              borderRadius: '12px', padding: '10px 14px 10px 34px', color: 'var(--text-primary)',
              fontSize: '13px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <option value="all">{isAr ? 'كل الحالات' : 'All Status'}</option>
            <option value="active">{isAr ? 'نشط' : 'Active'}</option>
            <option value="suspended">{isAr ? 'موقوف' : 'Suspended'}</option>
            <option value="banned">{isAr ? 'محظور' : 'Banned'}</option>
            <option value="pending">{isAr ? 'بانتظار التحقق' : 'Pending'}</option>
          </select>

          {/* Type select */}
          <select
            className="aum-select"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{
              background: 'var(--bg-primary)', border: '1.5px solid var(--border-light)',
              borderRadius: '12px', padding: '10px 14px 10px 34px', color: 'var(--text-primary)',
              fontSize: '13px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <option value="all">{isAr ? 'كل الأنواع' : 'All Types'}</option>
            <option value="ordinary">{isAr ? 'عادي' : 'Ordinary'}</option>
            <option value="professional">{isAr ? 'احترافي' : 'Professional'}</option>
            <option value="company">{isAr ? 'شركة' : 'Company'}</option>
          </select>
        </div>

        {/* Right: density + refresh + export */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          {/* Density toggles */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-primary)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-light)' }}>
            <button className={`aum-density-btn ${density === 'comfortable' ? 'active' : ''}`} onClick={() => setDensity('comfortable')}>
              <LayoutGrid size={13} />
            </button>
            <button className={`aum-density-btn ${density === 'compact' ? 'active' : ''}`} onClick={() => setDensity('compact')}>
              <AlignJustify size={13} />
            </button>
          </div>

          <button
            onClick={fetchUsers}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', borderRadius: '12px',
              border: '1.5px solid var(--border-light)', background: 'transparent', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600,
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            <RefreshCcw size={14} />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>

          <button
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', borderRadius: '12px',
              border: '1.5px solid var(--border-light)', background: 'transparent', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600,
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#22C55E'; (e.currentTarget as HTMLElement).style.color = '#22C55E'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            <Download size={14} />
            {isAr ? 'تصدير' : 'Export'}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          BULK ACTION BAR
      ════════════════════════════════════════════════════════════ */}
      {selectedIds.size > 0 && (
        <div
          className="aum-bulk-bar"
          style={{
            background: 'linear-gradient(135deg, rgba(232,131,58,0.12), rgba(166,139,91,0.08))',
            border: '1.5px solid rgba(232,131,58,0.3)',
            borderRadius: '14px', padding: '12px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(232,131,58,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={16} color="#E8833A" />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isAr ? `تم تحديد ${selectedIds.size} عميل` : `${selectedIds.size} client${selectedIds.size > 1 ? 's' : ''} selected`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{ padding: '7px 14px', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {isAr ? 'إلغاء التحديد' : 'Deselect All'}
            </button>
            <button
              style={{ padding: '7px 14px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={13} />
              {isAr ? 'حذف المحدد' : 'Delete Selected'}
            </button>
            <button
              style={{ padding: '7px 14px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)', color: '#F59E0B', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Shield size={13} />
              {isAr ? 'تغيير الحالة' : 'Change Status'}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TABLE
      ════════════════════════════════════════════════════════════ */}
      <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div className="aum-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="saasResponsiveTable"  style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {/* Checkbox */}
                <th className="aum-th" style={{ width: 48, padding: '14px 16px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-light)', textAlign: 'center', position: 'sticky', top: 0, zIndex: 2 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </th>
                {[
                  { label: isAr ? 'العميل' : 'Client', w: 'auto' },
                  { label: isAr ? 'تاريخ التسجيل' : 'Registered', w: 160 },
                  { label: isAr ? 'نوع الحساب' : 'Type', w: 130 },
                  { label: isAr ? 'الحالة' : 'Status', w: 120 },
                  { label: isAr ? 'أجهزة واتساب' : 'WA Devices', w: 120 },
                  { label: isAr ? 'إجراءات' : 'Actions', w: 200 },
                ].map((th, ti) => (
                  <th
                    key={ti}
                    className="aum-th"
                    style={{
                      padding: '14px 16px',
                      background: 'var(--bg-tertiary)',
                      borderBottom: '1px solid var(--border-light)',
                      textAlign: isAr ? 'right' : 'left',
                      color: 'var(--text-secondary)',
                      fontWeight: 600, fontSize: '12px',
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      position: 'sticky', top: 0, zIndex: 2,
                      width: th.w !== 'auto' ? th.w : undefined,
                    }}
                  >
                    {th.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* ── SKELETON ── */}
              {loading ? Array.from({ length: 5 }).map((_, ri) => (
                <tr key={ri} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '18px 16px', textAlign: 'center' }}>
                    <div className="aum-skeleton" style={{ width: 16, height: 16, borderRadius: 4 }} />
                  </td>
                  <td style={{ padding: '18px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="aum-skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div className="aum-skeleton" style={{ width: 140, height: 14 }} />
                        <div className="aum-skeleton" style={{ width: 100, height: 12 }} />
                      </div>
                    </div>
                  </td>
                  {[120, 90, 90, 80, 180].map((w, wi) => (
                    <td key={wi} style={{ padding: '18px 16px' }}>
                      <div className="aum-skeleton" style={{ width: w, height: 14 }} />
                    </td>
                  ))}
                </tr>
              )) : users.length === 0 ? (
                /* ── EMPTY STATE ── */
                <tr>
                  <td colSpan={7} style={{ padding: '80px 40px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      {/* Inline SVG Illustration */}
                      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="60" cy="60" r="56" fill="var(--bg-tertiary)" />
                        <circle cx="60" cy="44" r="18" fill="var(--border-light)" />
                        <path d="M26 96c0-18.8 15.2-34 34-34h0c18.8 0 34 15.2 34 34" stroke="var(--border-light)" strokeWidth="3" strokeLinecap="round" fill="none" />
                        <circle cx="88" cy="88" r="18" fill="var(--surface)" stroke="var(--border-light)" strokeWidth="2" />
                        <path d="M82 88h12M88 82v12" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                          {isAr ? 'لا يوجد عملاء مطابقون' : 'No clients found'}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {isAr ? 'جرّب تغيير معايير البحث أو الفلترة' : 'Try adjusting your search or filter criteria'}
                        </div>
                      </div>
                      <button
                        onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); fetchUsers(); }}
                        style={{
                          padding: '10px 22px', borderRadius: '12px',
                          background: 'var(--primary)', color: '#fff', border: 'none',
                          fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                          boxShadow: '0 4px 16px rgba(232,131,58,0.3)',
                          transition: 'transform 0.18s, box-shadow 0.18s',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(232,131,58,0.4)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(232,131,58,0.3)'; }}
                      >
                        {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : users.map((user, ui) => {
                const statusKey = user.profile?.account_status || 'active';
                const typeKey = user.profile?.account_type || 'ordinary';
                const sc = statusConfig[statusKey] || statusConfig.active;
                const tc = typeConfig[typeKey] || typeConfig.ordinary;
                const isSel = selectedIds.has(user.id);

                return (
                  <tr
                    key={user.id}
                    className={`aum-tr ${isSel ? 'selected' : ''}`}
                    style={{ background: 'transparent', animation: `aum-fadeUp 0.3s cubic-bezier(.4,0,.2,1) ${ui * 40}ms both` }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: rowPad, textAlign: 'center', width: 48 }}>
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleOne(user.id)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                      />
                    </td>

                    {/* Client info */}
                    <td style={{ padding: rowPad }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <Avatar name={user.profile?.full_name} email={user.email} size={density === 'comfortable' ? 44 : 34} />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '2px' }}>
                            {user.profile?.full_name || (isAr ? 'غير متوفر' : 'N/A')}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '220px', wordBreak: 'break-all' }} title={user.email}>
                            {user.email}
                          </div>
                          {user.profile?.phone_number && density !== 'compact' && (
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                              {user.profile.phone_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Registered date */}
                    <td style={{ padding: rowPad }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(user.date_joined))}
                      </div>
                      {density !== 'compact' && (
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          {new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(user.date_joined))}
                        </div>
                      )}
                    </td>

                    {/* Account type */}
                    <td style={{ padding: rowPad }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                        background: tc.bg, color: tc.color,
                        border: `1px solid ${tc.color}33`,
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                      }}>
                        <span>{tc.icon}</span>
                        {isAr ? tc.labelAr : tc.labelEn}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: rowPad }}>
                      <span style={{
                        padding: '5px 11px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                        color: sc.color, background: sc.bg,
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        border: `1px solid ${sc.color}33`,
                      }}>
                        <span
                          className={sc.pulse ? 'aum-dot-pulse' : ''}
                          style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, display: 'block' }}
                        />
                        {isAr ? sc.labelAr : sc.labelEn}
                      </span>
                    </td>

                    {/* WA Devices */}
                    <td style={{ padding: rowPad }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                        background: 'rgba(34,197,94,0.08)', color: '#22C55E',
                        border: '1px solid rgba(34,197,94,0.2)',
                      }}>
                        <Smartphone size={12} />
                        {user.whatsapp_instances_count || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: rowPad }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {/* View */}
                        <div className="aum-tooltip-wrap">
                          <button className="aum-icon-btn view" onClick={() => { setDrawerUser(user); setDrawerTab('basic'); }}>
                            <Eye size={15} color="#3B82F6" />
                          </button>
                          <div className="aum-tooltip">{isAr ? 'عرض التفاصيل' : 'View Details'}</div>
                        </div>
                        {/* Edit */}
                        <div className="aum-tooltip-wrap">
                          <button className="aum-icon-btn edit" onClick={() => setEditUser({ ...user })}>
                            <Edit size={15} color="#E8833A" />
                          </button>
                          <div className="aum-tooltip">{isAr ? 'تعديل البيانات' : 'Edit'}</div>
                        </div>
                        {/* Crown / Role */}
                        <div className="aum-tooltip-wrap">
                          <button className="aum-icon-btn crown" onClick={() => setAssigningAdmin(user)}>
                            <Crown size={15} color={(user.is_superuser || user.profile?.admin_role) ? '#F59E0B' : '#9A9A9A'} />
                          </button>
                          <div className="aum-tooltip">{isAr ? 'تعيين رتبة' : 'Assign Role'}</div>
                        </div>
                        {/* Shield / Status */}
                        <div className="aum-tooltip-wrap">
                          <button className="aum-icon-btn shield" onClick={() => { setStatusUser(user); setNewStatus(user.profile?.account_status || 'active'); setStatusReason(user.profile?.status_reason || ''); }}>
                            <Shield size={15} color="#22C55E" />
                          </button>
                          <div className="aum-tooltip">{isAr ? 'تغيير الحالة' : 'Change Status'}</div>
                        </div>
                        {/* Impersonate */}
                        <div className="aum-tooltip-wrap">
                          <button className="aum-icon-btn details" onClick={() => handleImpersonate(user)}>
                            <FileText size={15} color="#8B5CF6" />
                          </button>
                          <div className="aum-tooltip">{isAr ? 'دخول كعميل' : 'Impersonate'}</div>
                        </div>
                        {/* Delete */}
                        <div className="aum-tooltip-wrap">
                          <button className="aum-icon-btn delete" onClick={() => setDeleteUser(user)}>
                            <Trash2 size={15} color="#EF4444" />
                          </button>
                          <div className="aum-tooltip">{isAr ? 'حذف الحساب' : 'Delete'}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{
                  width: 36, height: 36, borderRadius: '10px', border: '1.5px solid var(--border-light)',
                  background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: 'var(--text-secondary)', opacity: page === 1 ? 0.4 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.18s',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 36, height: 36, borderRadius: '10px', fontWeight: p === page ? 700 : 500,
                      border: `1.5px solid ${p === page ? 'var(--primary)' : 'var(--border-light)'}`,
                      background: p === page ? 'var(--primary)' : 'transparent',
                      cursor: 'pointer',
                      color: p === page ? '#fff' : 'var(--text-secondary)',
                      fontSize: '13px',
                      transition: 'all 0.18s',
                      fontFamily: 'inherit',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{
                  width: 36, height: 36, borderRadius: '10px', border: '1.5px solid var(--border-light)',
                  background: 'transparent', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  color: 'var(--text-secondary)', opacity: page === totalPages ? 0.4 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.18s',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          DRAWER
      ════════════════════════════════════════════════════════════ */}
      {drawerUser && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', justifyContent: isAr ? 'flex-start' : 'flex-end', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setDrawerUser(null); }}
        >
          <div className="aum-drawer">
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{isAr ? 'تفاصيل العميل' : 'Client Details'}</h3>
              <button onClick={() => setDrawerUser(null)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', cursor: 'pointer', width: 36, height: 36, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s' }}>
                <X size={18} />
              </button>
            </div>

            {/* User Hero */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', background: 'var(--surface)', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Avatar name={drawerUser.profile?.full_name} email={drawerUser.email} size={72} />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800 }}>{drawerUser.profile?.full_name || (isAr ? 'غير متوفر' : 'N/A')}</h4>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>{drawerUser.email}</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'var(--bg-tertiary)', fontSize: '11px', fontWeight: 700 }}>ID #{drawerUser.id}</span>
                  {drawerUser.is_superuser && (
                    <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontSize: '11px', fontWeight: 700 }}>
                      ⭐ {isAr ? 'سوبر أدمن' : 'Super Admin'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ padding: '0 24px', borderBottom: '1px solid var(--border-light)', background: 'var(--surface)', overflowX: 'auto', display: 'flex', gap: '4px' }}>
              {[
                { id: 'basic', label: isAr ? 'البيانات الأساسية' : 'Basic Data' },
                { id: 'plan', label: isAr ? 'الباقة' : 'Plan' },
                { id: 'invoices', label: isAr ? 'الفواتير' : 'Invoices' },
                { id: 'devices', label: isAr ? 'الأجهزة' : 'Devices' },
                { id: 'usage', label: isAr ? 'الاستهلاك' : 'Usage' },
                { id: 'logs', label: isAr ? 'سجل النشاط' : 'Activity' },
                { id: 'permissions', label: isAr ? 'الصلاحيات' : 'Permissions' },
                { id: 'security', label: isAr ? 'الأمان' : 'Security' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDrawerTab(tab.id)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: '14px 12px', fontSize: '13px', fontWeight: drawerTab === tab.id ? 700 : 500,
                    color: drawerTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                    borderBottom: drawerTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                    marginBottom: '-1px', whiteSpace: 'nowrap', transition: 'color 0.18s',
                    fontFamily: 'inherit',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {drawerTab === 'basic' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px' }}>
                    <h5 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} color="var(--primary)" />
                      {isAr ? 'البيانات الأساسية' : 'Basic Information'}
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {[
                        { label: isAr ? 'رقم الهاتف' : 'Phone', value: drawerUser.profile?.phone_number },
                        { label: isAr ? 'الشركة' : 'Company', value: drawerUser.profile?.company_name },
                        { label: isAr ? 'نوع الحساب' : 'Type', value: drawerUser.profile?.account_type === 'professional' ? (isAr ? 'احترافي' : 'Professional') : drawerUser.profile?.account_type === 'company' ? (isAr ? 'شركة' : 'Company') : (isAr ? 'عادي' : 'Ordinary') },
                        { label: isAr ? 'تاريخ الانضمام' : 'Joined', value: new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(drawerUser.date_joined)) },
                      ].map((row, ri) => (
                        <div key={ri}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 600 }}>{row.label}</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.value || (isAr ? 'غير متوفر' : 'N/A')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700 }}>{isAr ? 'ملاحظات إدارية' : 'Internal Notes'}</h5>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {drawerUser.profile?.internal_notes || (isAr ? 'لا توجد ملاحظات.' : 'No notes.')}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Zap size={24} color="var(--primary)" />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                    {isAr ? 'قريباً...' : 'Coming Soon'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {isAr ? 'سيتم ربط هذه البيانات مع الـ API قريباً' : 'This section will be connected to the API soon'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          EDIT MODAL
      ════════════════════════════════════════════════════════════ */}
      {editUser && (
        <div className="aum-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditUser(null); }}>
          <div className="aum-modal-box" style={{ width: '95%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(232,131,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit size={18} color="#E8833A" />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{isAr ? 'تعديل بيانات العميل' : 'Edit Client'}</h3>
              </div>
              <button onClick={() => setEditUser(null)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', cursor: 'pointer', width: 36, height: 36, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {[
                { label: isAr ? 'الاسم الكامل' : 'Full Name', type: 'text', value: editUser.profile?.full_name || '', onChange: (v: string) => setEditUser({ ...editUser, profile: { ...editUser.profile, full_name: v } }) },
                { label: isAr ? 'البريد الإلكتروني' : 'Email', type: 'email', value: editUser.email || '', onChange: (v: string) => setEditUser({ ...editUser, email: v }) },
                { label: isAr ? 'رقم الهاتف' : 'Phone Number', type: 'text', value: editUser.profile?.phone_number || '', onChange: (v: string) => setEditUser({ ...editUser, profile: { ...editUser.profile, phone_number: v } }) },
              ].map((f, fi) => (
                <div key={fi}>
                  <label className="aum-label">{f.label}</label>
                  <input type={f.type} className="aum-input" value={f.value} onChange={e => f.onChange(e.target.value)} />
                </div>
              ))}
              <div>
                <label className="aum-label">{isAr ? 'نوع الحساب' : 'Account Type'}</label>
                <select className="aum-input aum-select" value={editUser.profile?.account_type || 'ordinary'} onChange={e => setEditUser({ ...editUser, profile: { ...editUser.profile, account_type: e.target.value } })}>
                  <option value="ordinary">{isAr ? 'عادي' : 'Ordinary'}</option>
                  <option value="professional">{isAr ? 'احترافي' : 'Professional'}</option>
                  <option value="company">{isAr ? 'شركة' : 'Company'}</option>
                </select>
              </div>
              <div>
                <label className="aum-label">{isAr ? 'ملاحظات إدارية (مخفية عن العميل)' : 'Internal Notes (hidden from client)'}</label>
                <textarea className="aum-input" value={editUser.profile?.internal_notes || ''} onChange={e => setEditUser({ ...editUser, profile: { ...editUser.profile, internal_notes: e.target.value } })} rows={3} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #E8833A, #A68B5B)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(232,131,58,0.3)', transition: 'transform 0.18s, box-shadow 0.18s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(232,131,58,0.4)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(232,131,58,0.3)'; }}
                >
                  {isAr ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditUser(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border-light)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          STATUS MODAL
      ════════════════════════════════════════════════════════════ */}
      {statusUser && (
        <div className="aum-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setStatusUser(null); }}>
          <div className="aum-modal-box" style={{ width: '95%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} color="#22C55E" />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{isAr ? 'تغيير حالة الحساب' : 'Change Status'}</h3>
              </div>
              <button onClick={() => setStatusUser(null)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', cursor: 'pointer', width: 36, height: 36, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Status selector as cards */}
              <div>
                <label className="aum-label">{isAr ? 'الحالة الجديدة' : 'New Status'}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  {[
                    { value: 'active', labelAr: '✅ نشط', labelEn: '✅ Active', color: '#22C55E' },
                    { value: 'suspended', labelAr: '⏸ موقوف', labelEn: '⏸ Suspended', color: '#F59E0B' },
                    { value: 'banned', labelAr: '🚫 محظور', labelEn: '🚫 Banned', color: '#EF4444' },
                    { value: 'pending', labelAr: '⏳ بانتظار التحقق', labelEn: '⏳ Pending', color: '#A68B5B' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setNewStatus(opt.value)}
                      style={{
                        padding: '10px 14px', borderRadius: '12px', cursor: 'pointer',
                        border: `1.5px solid ${newStatus === opt.value ? opt.color : 'var(--border-light)'}`,
                        background: newStatus === opt.value ? `${opt.color}18` : 'transparent',
                        color: newStatus === opt.value ? opt.color : 'var(--text-secondary)',
                        fontSize: '13px', fontWeight: 600, transition: 'all 0.18s',
                        fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      }}
                    >
                      {newStatus === opt.value && <Check size={13} />}
                      {isAr ? opt.labelAr : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="aum-label">{isAr ? 'سبب الإجراء (يسجل في النظام)' : 'Reason (logged in audit)'}</label>
                <textarea
                  className="aum-input"
                  value={statusReason}
                  onChange={e => setStatusReason(e.target.value)}
                  rows={3}
                  placeholder={isAr ? 'مثال: مخالفة الشروط، عدم الدفع...' : 'e.g. Terms violation...'}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleChangeStatus} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #E8833A, #A68B5B)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(232,131,58,0.3)' }}>
                  {isAr ? 'تأكيد التغيير' : 'Confirm Change'}
                </button>
                <button onClick={() => setStatusUser(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border-light)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          DELETE MODAL
      ════════════════════════════════════════════════════════════ */}
      {deleteUser && (
        <div className="aum-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteUser(null); }}>
          <div className="aum-modal-box" style={{ width: '95%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '28px', textAlign: 'center', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid rgba(239,68,68,0.25)' }}>
                <AlertTriangle size={28} color="#EF4444" />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 800 }}>
                {isAr ? 'تأكيد حذف الحساب' : 'Confirm Delete Account'}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                {isAr ? 'هذا الإجراء لا يمكن التراجع عنه.' : 'This action cannot be undone.'}
              </p>
              {/* User info */}
              <div style={{ margin: '16px auto 0', padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', maxWidth: 280 }}>
                <Avatar name={deleteUser.profile?.full_name} email={deleteUser.email} size={32} />
                <div style={{ textAlign: isAr ? 'right' : 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{deleteUser.profile?.full_name || deleteUser.email}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{deleteUser.email}</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Delete type radios */}
              {[
                { value: 'soft', title: isAr ? 'إيقاف الحساب (Soft Delete)' : 'Deactivate Account (Soft)', desc: isAr ? 'يبقى في قاعدة البيانات ولكن موقوف.' : 'Stays in DB but suspended.', color: '#E8833A' },
                { value: 'hard', title: isAr ? 'حذف نهائي (Hard Delete)' : 'Permanent Delete', desc: isAr ? 'يحذف كل البيانات نهائياً. للـ Super Admin فقط.' : 'Deletes all data permanently. Super Admin only.', color: '#EF4444' },
              ].map(opt => (
                <label
                  key={opt.value}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', border: `1.5px solid ${deleteType === opt.value ? opt.color : 'var(--border-light)'}`, borderRadius: '14px', cursor: 'pointer', transition: 'all 0.18s', background: deleteType === opt.value ? `${opt.color}08` : 'transparent' }}
                >
                  <input type="radio" name="del_type" checked={deleteType === opt.value} onChange={() => setDeleteType(opt.value as 'soft' | 'hard')} style={{ accentColor: opt.color, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: opt.value === 'hard' ? '#EF4444' : 'var(--text-primary)' }}>{opt.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button onClick={handleDelete} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
                  {isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
                </button>
                <button onClick={() => setDeleteUser(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border-light)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          ASSIGN ROLE MODAL
      ════════════════════════════════════════════════════════════ */}
      {assigningAdmin && (
        <div className="aum-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setAssigningAdmin(null); }}>
          <div className="aum-modal-box" style={{ width: '95%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Crown size={18} color="#F59E0B" />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                  {assigningAdmin.admin_role || assigningAdmin.is_superuser ? (isAr ? 'تغيير الرتبة الإدارية' : 'Change Admin Role') : (isAr ? 'تعيين كمدير' : 'Assign Admin Role')}
                </h3>
              </div>
              <button onClick={() => setAssigningAdmin(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', width: 36, height: 36, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Target user */}
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Avatar name={assigningAdmin.profile?.full_name} email={assigningAdmin.email} size={48} />
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '16px', fontWeight: 700 }}>{assigningAdmin.profile?.full_name || (isAr ? 'بدون اسم' : 'No Name')}</h4>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{assigningAdmin.email}</span>
                </div>
              </div>

              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                {isAr ? 'اختر الرتبة التي تريد تعيينها لتحديد صلاحياته في لوحة التحكم.' : 'Choose a role to define their permissions in the admin panel.'}
              </p>

              {/* Roles list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                {roles.filter(r => r.is_active).map(role => (
                  <button
                    key={role.id}
                    onClick={() => submitAssignRole(assigningAdmin.id, role.id)}
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                      border: `1.5px solid ${assigningAdmin.admin_role?.id === role.id ? role.color : 'var(--border-light)'}`,
                      background: assigningAdmin.admin_role?.id === role.id ? `${role.color}12` : 'var(--bg-tertiary)',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      transition: 'all 0.2s', fontFamily: 'inherit',
                      textAlign: isAr ? 'right' : 'left',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = role.color; (e.currentTarget as HTMLElement).style.background = `${role.color}10`; }}
                    onMouseLeave={e => { if (assigningAdmin.admin_role?.id !== role.id) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)'; } }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '11px', background: `${role.color}20`, color: role.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {renderIcon(role.icon, 18)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{role.name_ar}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{role.name_en}</div>
                    </div>
                    {assigningAdmin.admin_role?.id === role.id && <CheckCircle size={18} color={role.color} />}
                  </button>
                ))}

                {assigningAdmin?.admin_role && (
                  <button
                    onClick={() => submitAssignRole(assigningAdmin.id, null)}
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                      border: '1.5px dashed rgba(239,68,68,0.35)',
                      background: 'rgba(239,68,68,0.05)',
                      color: '#EF4444', fontSize: '13px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'all 0.2s', fontFamily: 'inherit', marginTop: '4px',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.05)'; }}
                  >
                    <Lock size={15} />
                    {isAr ? 'إزالة كافة الصلاحيات الإدارية' : 'Remove All Admin Permissions'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ExportCustomersModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} token={token || ''} />
      <SendNotificationModal isOpen={isNotifyModalOpen} onClose={() => setIsNotifyModalOpen(false)} token={token || ''} />
      <RefreshCustomersModal isOpen={isRefreshModalOpen} onClose={() => setIsRefreshModalOpen(false)} onRefresh={async () => { await fetchUsers(); }} lastUpdated={new Date().toLocaleTimeString('ar-SA')} totalCustomers={stats?.total || 0} />
      <ActivityReportModal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} token={token || ''} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   RIPPLE CARD  –  small wrapper that adds the ripple effect
───────────────────────────────────────────────────────────────────────────── */
function RippleCard({
  children, className, style, onClick,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 1.5;
    const span = document.createElement('span');
    span.className = 'aum-ripple-effect';
    span.style.cssText = `width:${size}px;height:${size}px;left:${x - size / 2}px;top:${y - size / 2}px`;
    el.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
    onClick?.();
  }, [onClick]);

  return (
    <div ref={ref} className={`aum-ripple-container ${className || ''}`} style={style} onClick={handleClick}>
      {children}
    </div>
  );
}
