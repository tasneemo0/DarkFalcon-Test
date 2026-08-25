'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { API_BASE_URL } from '@/lib/api';
import {
  Users, Shield, Plus, Edit2, Trash2, CheckCircle, XCircle, Settings, X,
  ShieldAlert, Key, Save, Phone, Eye, MessageCircle, FileText, Zap, Bell,
  Search, RefreshCw, RefreshCcw, UserPlus, ShieldCheck, Database, Briefcase, Lock, Award, Star, Activity, AlertTriangle, ChevronLeft, Mail, ChevronDown, Loader2
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { motion, Variants } from 'framer-motion';
import { PremiumStatCard, PremiumCardWrapper } from '@/components/dashboard/PremiumCard';
import { PremiumButton } from '@/components/dashboard/PremiumButton';

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const ICONS_LIST = [
  'Shield', 'Key', 'Users', 'Settings', 'Database', 'FileText',
  'Briefcase', 'Lock', 'Award', 'Star', 'Zap', 'Activity', 'ShieldCheck'
];

const PRESET_COLORS = [
  { name: 'برتقالي رئيسي', value: '#e8833a' },
  { name: 'برتقالي', value: '#f97316' },
  { name: 'أزرق', value: '#3b82f6' },
  { name: 'أخضر', value: '#10b981' },
  { name: 'أحمر', value: '#ef4444' },
  { name: 'ذهبي', value: '#f59e0b' },
];

const PERMISSION_GROUPS = [
  {
    title: 'إدارة العمليات الرئيسية',
    permissions: [
      { id: 'manage_clients', labelAr: 'إدارة العملاء', labelEn: 'Client Management', icon: <Users size={18} /> },
      { id: 'manage_sessions', labelAr: 'إدارة الجلسات', labelEn: 'Session Management', icon: <Phone size={18} /> },
      { id: 'manage_plans', labelAr: 'إدارة الباقات', labelEn: 'Plan Management', icon: <Zap size={18} /> },
    ]
  },
  {
    title: 'المالية والدعم',
    permissions: [
      { id: 'manage_payments', labelAr: 'إدارة المدفوعات', labelEn: 'Payment Management', icon: <FileText size={18} /> },
      { id: 'manage_tickets', labelAr: 'تذاكر الدعم الفني', labelEn: 'Support Tickets', icon: <MessageCircle size={18} /> },
    ]
  },
  {
    title: 'الإعدادات والنظام',
    permissions: [
      { id: 'manage_settings', labelAr: 'إعدادات النظام', labelEn: 'System Settings', icon: <Settings size={18} /> },
      { id: 'manage_admins', labelAr: 'إدارة الأدمن والرتب', labelEn: 'Admins & Roles', icon: <Key size={18} /> },
      { id: 'manage_agreements', labelAr: 'إدارة الاتفاقيات الشروط', labelEn: 'Consent Agreements', icon: <Shield size={18} /> },
    ]
  },
  {
    title: 'أخرى',
    permissions: [
      { id: 'manage_notifications', labelAr: 'إرسال إشعارات جماعية', labelEn: 'Send Notifications', icon: <Bell size={18} /> },
      { id: 'view_stats', labelAr: 'عرض الإحصائيات', labelEn: 'View Statistics', icon: <Eye size={18} /> }
    ]
  }
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions);

export default function AdminRolesManager() {
  const { locale, user, token, logout } = useApp();
  const [toastMsg, setToastMsg] = useState('');

  // Data State
  const [admins, setAdmins] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningAdmin, setAssigningAdmin] = useState<any>(null);
  const [selectedRoleIdToAssign, setSelectedRoleIdToAssign] = useState<number | null>(null);

  // User Search State for adding new admins
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Role Form State
  const [roleNameAr, setRoleNameAr] = useState('');
  const [roleNameEn, setRoleNameEn] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [roleColor, setRoleColor] = useState('#e8833a');
  const [roleIcon, setRoleIcon] = useState('Shield');
  const [roleActive, setRoleActive] = useState(true);
  const [rolePerms, setRolePerms] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isAssignModalOpen) {
      setUserSearchResults([]);
      setUserSearchQuery('');
      return;
    }

    setIsSearchingUsers(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetchWithAuth(`/api/v1/admin/users/search/?q=${encodeURIComponent(userSearchQuery)}`);
        console.log('manager assign users response:', res);
        if (res && !res.error) {
          if (Array.isArray(res)) {
            setUserSearchResults(res);
          } else if (res.results && Array.isArray(res.results)) {
            setUserSearchResults(res.results);
          } else if (res.users && Array.isArray(res.users)) {
            setUserSearchResults(res.users);
          } else {
            setUserSearchResults([]);
          }
        } else {
          setUserSearchResults([]);
        }
      } catch (e) {
        setUserSearchResults([]);
      }
      setIsSearchingUsers(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery, isAssignModalOpen]);

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
      if (res.status === 401 && logout) { logout(); return { error: 'Unauthorized' }; }
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) return res.json();
      return res.text();
    } catch (err) {
      console.error(err);
      return { error: 'Network error' };
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersRes = await fetchWithAuth('/api/v1/admin/users/');
      const rolesRes = await fetchWithAuth('/api/v1/admin/roles/');
      setAdmins(usersRes?.results || (Array.isArray(usersRes) ? usersRes : []));
      setRoles(rolesRes?.results || (Array.isArray(rolesRes) ? rolesRes : []));
    } catch (e) {
      setToastMsg('حدث خطأ في تحميل البيانات');
    }
    setLoading(false);
  };

  const handleOpenRoleModal = (role: any = null) => {
    setEditingRole(role);
    if (role) {
      setRoleNameAr(role.name_ar || '');
      setRoleNameEn(role.name_en || '');
      setRoleDesc(role.description || '');
      setRoleColor(role.color || '#3b82f6');
      setRoleIcon(role.icon || 'Shield');
      setRoleActive(role.is_active ?? true);
      setRolePerms(role.permissions || {});
    } else {
      setRoleNameAr('');
      setRoleNameEn('');
      setRoleDesc('');
      setRoleColor('var(--primary)');
      setRoleIcon('Shield');
      setRoleActive(true);
      setRolePerms({});
    }
    setFormError('');
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleNameAr.trim() || !roleNameEn.trim()) {
      setFormError('يرجى إدخال اسم الرتبة باللغتين العربية والإنجليزية');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        name_ar: roleNameAr,
        name_en: roleNameEn,
        description: roleDesc,
        color: roleColor,
        icon: roleIcon,
        is_active: roleActive,
        permissions: rolePerms
      };

      let res;
      if (editingRole) {
        res = await fetchWithAuth(`/api/v1/admin/roles/${editingRole.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetchWithAuth('/api/v1/admin/roles/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res && !res.error) {
        setToastMsg(editingRole ? 'تم تعديل الرتبة بنجاح' : 'تم إنشاء الرتبة بنجاح');
        setIsRoleModalOpen(false);
        fetchData();
      } else {
        setToastMsg(res.error || 'حدث خطأ أثناء حفظ الرتبة');
      }
    } catch (e) {
      setToastMsg('حدث خطأ أثناء حفظ الرتبة');
    }
    setSaving(false);
  };

  const handleDeleteRole = async (id: number) => {
    // Check if role is linked to admins
    const isLinked = admins.some(a => a.admin_role?.id === id);
    if (isLinked) {
      setToastMsg('لا يمكن حذف رتبة مرتبطة بمدراء. يرجى نقلهم أولاً.');
      return;
    }

    if (!window.confirm('هل أنت متأكد من حذف هذه الرتبة نهائياً؟')) return;
    try {
      const res = await fetchWithAuth(`/api/v1/admin/roles/${id}/`, { method: 'DELETE' });
      if (res && res.error) {
        setToastMsg(res.error);
      } else {
        setToastMsg('تم حذف الرتبة بنجاح');
        fetchData();
      }
    } catch (e) {
      setToastMsg('حدث خطأ أثناء حذف الرتبة');
    }
  };

  const submitAssignRole = async (userId: number, roleId: number | null) => {
    try {
      let url = '';
      let method = '';
      let body = null;

      if (roleId === null) {
        url = `/api/v1/admin/managers/${userId}/remove-admin/`;
        method = 'DELETE';
      } else if (assigningAdmin?.admin_role) {
        // If they already have a role, we're changing it
        url = `/api/v1/admin/managers/${userId}/change-role/`;
        method = 'PATCH';
        body = JSON.stringify({ role_id: roleId });
      } else {
        // If they don't have a role yet, we're assigning
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
        setToastMsg('تم تغيير رتبة المستخدم بنجاح');
        setIsAssignModalOpen(false);
        fetchData();
      } else {
        setToastMsg(res.error || 'حدث خطأ');
      }
    } catch (e) {
      setToastMsg('حدث خطأ');
    }
  };

  const handleQuickPermissions = (type: string) => {
    const newPerms = { ...rolePerms };
    if (type === 'all') {
      ALL_PERMISSIONS.forEach(p => newPerms[p.id] = true);
    } else if (type === 'none') {
      ALL_PERMISSIONS.forEach(p => newPerms[p.id] = false);
    } else if (type === 'financial') {
      ALL_PERMISSIONS.forEach(p => newPerms[p.id] = false);
      newPerms['manage_payments'] = true;
      newPerms['manage_plans'] = true;
      newPerms['view_stats'] = true;
    } else if (type === 'support') {
      ALL_PERMISSIONS.forEach(p => newPerms[p.id] = false);
      newPerms['manage_tickets'] = true;
      newPerms['manage_clients'] = true;
    } else if (type === 'admin') {
      ALL_PERMISSIONS.forEach(p => newPerms[p.id] = true);
      newPerms['manage_admins'] = false;
      newPerms['manage_settings'] = false;
    } else if (type === 'programmer') {
      ALL_PERMISSIONS.forEach(p => newPerms[p.id] = false);
      newPerms['manage_sessions'] = true;
      newPerms['manage_plans'] = true;
      newPerms['manage_settings'] = true;
      newPerms['manage_agreements'] = true;
      newPerms['view_stats'] = true;
    }
    setRolePerms(newPerms);
  };

  const renderIcon = (iconName: string, size: number = 24) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Shield;
    return <IconComponent size={size} />;
  };

  const activeRolesCount = roles.filter(r => r.is_active).length;
  const inactiveRolesCount = roles.length - activeRolesCount;

  const filteredAdmins = useMemo(() => {
    if (!searchQuery) return admins;
    const lowerQ = searchQuery.toLowerCase();
    return admins.filter(a =>
      (a.profile?.full_name || '').toLowerCase().includes(lowerQ) ||
      (a.email || '').toLowerCase().includes(lowerQ) ||
      (a.admin_role?.name_ar || '').toLowerCase().includes(lowerQ) ||
      (a.admin_role?.name_en || '').toLowerCase().includes(lowerQ)
    );
  }, [admins, searchQuery]);

  const filteredRoles = useMemo(() => {
    if (!searchQuery) return roles;
    const lowerQ = searchQuery.toLowerCase();
    return roles.filter(r =>
      r.name_ar.toLowerCase().includes(lowerQ) ||
      r.name_en.toLowerCase().includes(lowerQ)
    );
  }, [roles, searchQuery]);

  return (
    <div className="admin-roles-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '24px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>

      {/* Hero Section */}
      <PremiumCardWrapper style={{
        padding: '32px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'radial-gradient(circle at top right, rgba(232, 131, 58, 0.08), transparent 35%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(232,131,58,0.08)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid rgba(232,131,58,0.2)' }}>
                <ShieldCheck size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>إدارة الأدمن والرتب</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '500px', lineHeight: 1.6 }}>
                  تحكم كامل في أعضاء الإدارة والصلاحيات. قم بإنشاء رتب مخصصة، وتعيين مدراء، ومراقبة النشاط الإداري.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="بحث عن مدير أو رتبة..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    padding: '12px 16px 12px 40px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    width: '260px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <PremiumButton variant="secondary" onClick={fetchData} style={{ padding: '12px' }} title="تحديث البيانات">
                <RefreshCw size={18} className={loading ? 'spin' : ''} />
              </PremiumButton>
              <PremiumButton variant="primary" onClick={() => handleOpenRoleModal()} icon={<Plus size={18} />} iconPosition="left" style={{ padding: '12px 24px' }}>
                إنشاء رتبة جديدة
              </PremiumButton>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <PremiumStatCard title="إجمالي المدراء" icon={<Users size={20} />} value={loading ? 0 : admins.length} color="primary" />
            <PremiumStatCard title="الرتب النشطة" icon={<CheckCircle size={20} />} value={loading ? 0 : activeRolesCount} color="success" />
            <PremiumStatCard title="الرتب المعطلة" icon={<XCircle size={20} />} value={loading ? 0 : inactiveRolesCount} color="danger" />
            <PremiumStatCard title="الصلاحيات المتاحة" icon={<Key size={20} />} value={loading ? 0 : ALL_PERMISSIONS.length} color="warning" />
          </div>
        </div>
      </PremiumCardWrapper>

      {/* Admins Table Section */}
      <motion.div variants={fadeUpVariant} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
            <Users size={24} color="var(--primary)" />
            قائمة المدراء
          </h3>
          <PremiumButton
            variant="secondary"
            onClick={() => { setAssigningAdmin(null); setUserSearchQuery(''); setUserSearchResults([]); setIsAssignModalOpen(true); }}
            icon={<UserPlus size={18} />} iconPosition="left"
          >
            إضافة مدير جديد
          </PremiumButton>
        </div>

        <PremiumCardWrapper style={{ borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden', padding: 0 }}>
          {loading ? (
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: '70px', background: 'var(--bg-tertiary)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                <UserPlus size={40} />
              </div>
              <h4 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>لا يوجد مدراء حالياً</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px' }}>قم بتعيين رتب للمستخدمين ليصبحوا مدراء في النظام.</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="btn btn-outline" style={{ marginTop: '16px' }}>مسح البحث</button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '20px 24px', textAlign: locale === 'ar' ? 'right' : 'left', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>المستخدم</th>
                    <th style={{ padding: '20px 24px', textAlign: locale === 'ar' ? 'right' : 'left', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>البريد الإلكتروني</th>
                    <th style={{ padding: '20px 24px', textAlign: locale === 'ar' ? 'right' : 'left', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>الرتبة</th>
                    <th style={{ padding: '20px 24px', textAlign: locale === 'ar' ? 'right' : 'left', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>الحالة</th>
                    <th style={{ padding: '20px 24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map(admin => {
                    const displayName = admin.profile?.full_name || 'مستخدم إداري';
                    const roleNameAr = admin.is_superuser ? 'مدير نظام' : (admin.admin_role?.name_ar || 'بدون رتبة');
                    const roleNameEn = admin.is_superuser ? 'System Manager' : (admin.admin_role?.name_en || 'No Role');
                    const isManager = admin.is_superuser || (admin.admin_role?.name_en || '').toLowerCase().includes('manager');
                    const badgeBg = isManager ? 'rgba(166,139,91,0.12)' : 'rgba(232,131,58,0.10)';
                    const badgeBorder = isManager ? 'rgba(166,139,91,0.20)' : 'rgba(232,131,58,0.20)';
                    const badgeColor = isManager ? 'var(--secondary)' : 'var(--primary)';
                    const roleIcon = admin.is_superuser ? 'Award' : (admin.admin_role?.icon || 'User');

                    return (
                      <tr key={admin.id} className="admin-table-row" style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s', background: 'var(--surface)' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `rgba(var(--primary-rgb), 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: '18px' }}>
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{displayName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '14px' }}>{admin.email}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{
                            padding: '8px 12px',
                            background: badgeBg,
                            color: badgeColor,
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: `1px solid ${badgeBorder}`
                          }}>
                            {renderIcon(roleIcon, 16)}
                            <span>{roleNameAr} <span style={{ opacity: 0.7, fontWeight: 500 }}>/ {roleNameEn}</span></span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          {admin.is_active ? (
                            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600 }}><CheckCircle size={16} /> نشط</span>
                          ) : (
                            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600 }}><XCircle size={16} /> معطل</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setAssigningAdmin(admin);
                              setSelectedRoleIdToAssign(admin.profile?.admin_role?.id || null);
                              setIsAssignModalOpen(true);
                            }}
                            className="btn btn-outline admin-hover-bg"
                            style={{ padding: '10px 20px', fontSize: '13px', borderRadius: '10px' }}
                            disabled={admin.is_superuser && !user?.is_superuser}
                            title={admin.is_superuser && !user?.is_superuser ? "لا تملك صلاحية لتعديل مدير النظام" : "تغيير الرتبة"}
                          >
                            تغيير الرتبة
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PremiumCardWrapper>
      </motion.div>

      {/* Roles Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
            <Key size={24} color="var(--primary)" />
            إدارة الرتب والشارات
          </h3>
          <button onClick={() => handleOpenRoleModal()} className="btn btn-primary admin-primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', borderColor: 'var(--primary)', color: 'var(--bg-primary)', padding: '12px 24px', borderRadius: '12px' }}>
            <Plus size={18} />
            إنشاء رتبة جديدة
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ height: '240px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite' }} />
            ))
          ) : filteredRoles.length === 0 ? (
            <PremiumCardWrapper style={{ gridColumn: '1 / -1', padding: '80px 20px', textAlign: 'center', border: '1px dashed var(--border-light)' }}>
              <ShieldAlert size={64} color="var(--text-tertiary)" style={{ margin: '0 auto 20px', opacity: 0.5 }} />
              <h4 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>لا توجد رتب حالياً</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px' }}>قم بإنشاء رتب مخصصة لتعيين الصلاحيات الدقيقة للمدراء.</p>
            </PremiumCardWrapper>
          ) : (
            filteredRoles.map(role => (
              <PremiumCardWrapper key={role.id} style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(232,131,58,0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {renderIcon(role.icon, 28)}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{role.name_ar}</h4>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{role.name_en}</span>
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: role.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: role.is_active ? '#10b981' : '#ef4444'
                  }}>
                    {role.is_active ? 'نشطة' : 'معطلة'}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, minHeight: '44px' }}>
                  {role.description || 'لا يوجد وصف لهذه الرتبة.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                    <Key size={16} color={role.color} />
                    <span>الصلاحيات:</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{Object.values(role.permissions || {}).filter(Boolean).length}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                    <Users size={16} color={role.color} />
                    <span>المدراء:</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{admins.filter(a => a.admin_role?.id === role.id).length}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  <PremiumButton variant="secondary" onClick={() => handleOpenRoleModal(role)} style={{ flex: 1, padding: '12px' }} icon={<Edit2 size={18} />} iconPosition="left">
                    تعديل
                  </PremiumButton>
                  <PremiumButton variant="secondary" onClick={() => handleDeleteRole(role.id)} style={{ padding: '12px', width: '48px', color: '#ef4444' }} icon={<Trash2 size={18} color="#ef4444" />} title="حذف الرتبة" />
                </div>
              </PremiumCardWrapper>
            ))
          )}
        </div>
      </div>

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ background: 'var(--surface)', width: '95%', maxWidth: '900px', maxHeight: '90vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid var(--border)' }}>

            {/* Modal Header */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${roleColor}20`, color: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {renderIcon(roleIcon, 24)}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {editingRole ? 'تعديل الرتبة' : 'إنشاء رتبة جديدة'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>حدد تفاصيل الرتبة والصلاحيات الخاصة بها.</p>
                </div>
              </div>
              <button onClick={() => setIsRoleModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '32px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '40px' }}>

              {formError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px', borderRadius: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600 }}>
                  <AlertTriangle size={20} />
                  {formError}
                </div>
              )}

              {/* Preview & Basic Info Row */}
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>

                {/* Preview Badge */}
                <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>المعاينة المباشرة</label>
                  <div style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px dashed var(--border-light)',
                    borderRadius: '20px',
                    padding: '32px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    height: '100%',
                    minHeight: '160px'
                  }}>
                    <div style={{
                      padding: '12px 20px',
                      background: `${roleColor}15`,
                      color: roleColor,
                      borderRadius: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: `1px solid ${roleColor}30`,
                      boxShadow: `0 4px 20px ${roleColor}20`
                    }}>
                      {renderIcon(roleIcon, 20)}
                      <span style={{ fontWeight: 800, fontSize: '16px' }}>
                        {roleNameAr || 'اسم الرتبة'} <span style={{ opacity: 0.7, fontWeight: 500 }}>/ {roleNameEn || 'Role Name'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '300px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>اسم الرتبة (عربي) <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" required value={roleNameAr} onChange={e => setRoleNameAr(e.target.value)} placeholder="مثال: محاسب" style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-tertiary)', border: `1px solid ${formError && !roleNameAr ? '#ef4444' : 'var(--border-light)'}`, borderRadius: '12px', color: 'var(--text-primary)', fontSize: '15px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>اسم الرتبة (إنجليزي) <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" required value={roleNameEn} onChange={e => setRoleNameEn(e.target.value)} placeholder="e.g: Accountant" style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-tertiary)', border: `1px solid ${formError && !roleNameEn ? '#ef4444' : 'var(--border-light)'}`, borderRadius: '12px', color: 'var(--text-primary)', fontSize: '15px' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>الوصف المرجعي</label>
                    <textarea value={roleDesc} onChange={e => setRoleDesc(e.target.value)} rows={2} placeholder="وصف قصير لصلاحيات الرتبة والغرض منها.." style={{ width: '100%', padding: '14px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)', resize: 'none', fontSize: '15px' }} />
                  </div>
                </div>
              </div>

              {/* Design Row: Color, Icon, Active */}
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', padding: '24px', background: 'var(--bg-tertiary)', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>اللون المميز</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setRoleColor(c.value)}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', background: c.value, border: roleColor === c.value ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', outline: roleColor === c.value ? `2px solid ${c.value}` : 'none', padding: 0 }}
                        title={c.name}
                      />
                    ))}
                    <div style={{ width: '1px', height: '24px', background: 'var(--border-light)', margin: '0 8px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', padding: '4px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>مخصص:</span>
                      <input type="color" value={roleColor} onChange={e => setRoleColor(e.target.value)} style={{ width: '28px', height: '28px', padding: '0', background: 'transparent', border: 'none', cursor: 'pointer' }} />
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>الأيقونة</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto', paddingRight: '8px' }}>
                    {ICONS_LIST.map(iconName => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setRoleIcon(iconName)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: roleIcon === iconName ? `${roleColor}20` : 'var(--surface)',
                          color: roleIcon === iconName ? roleColor : 'var(--text-secondary)',
                          border: `1px solid ${roleIcon === iconName ? roleColor : 'var(--border-light)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {renderIcon(iconName, 18)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>حالة الرتبة</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 20px', background: roleActive ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface)', borderRadius: '12px', border: `1px solid ${roleActive ? '#10b981' : 'var(--border-light)'}`, transition: 'all 0.2s' }}>
                    <div style={{ width: '44px', height: '24px', background: roleActive ? '#10b981' : 'var(--border-light)', borderRadius: '12px', position: 'relative', transition: 'background 0.3s' }}>
                      <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: roleActive ? '23px' : '3px', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                    </div>
                    <input type="checkbox" checked={roleActive} onChange={e => setRoleActive(e.target.checked)} style={{ display: 'none' }} />
                    <span style={{ fontSize: '15px', fontWeight: 700, color: roleActive ? '#10b981' : 'var(--text-secondary)' }}>{roleActive ? 'نشطة' : 'معطلة'}</span>
                  </label>
                </div>
              </div>

              {/* Permissions Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      الصلاحيات المخصصة
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>حدد ما يمكن لهذه الرتبة الوصول إليه في النظام.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => handleQuickPermissions('all')} className="btn btn-outline" style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '8px' }}>تحديد الكل</button>
                    <button type="button" onClick={() => handleQuickPermissions('none')} className="btn btn-outline" style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '8px' }}>إلغاء الكل</button>
                    <button type="button" onClick={() => handleQuickPermissions('admin')} className="btn btn-outline" style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'transparent' }}>إدارية كاملة</button>
                    <button type="button" onClick={() => handleQuickPermissions('financial')} className="btn btn-outline" style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'transparent' }}>مالية فقط</button>
                    <button type="button" onClick={() => handleQuickPermissions('support')} className="btn btn-outline" style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', borderColor: 'transparent' }}>دعم فني</button>
                    <button type="button" onClick={() => handleQuickPermissions('programmer')} className="btn btn-outline" style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderColor: 'transparent' }}>مبرمج</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {PERMISSION_GROUPS.map((group, i) => (
                    <div key={i} style={{ background: 'var(--bg-tertiary)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                      <h5 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{group.title}</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                        {group.permissions.map(perm => (
                          <label key={perm.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px',
                            background: rolePerms[perm.id] ? `${roleColor}11` : 'var(--surface)',
                            border: `1px solid ${rolePerms[perm.id] ? roleColor : 'var(--border-light)'}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}>
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '6px',
                              border: `2px solid ${rolePerms[perm.id] ? roleColor : 'var(--text-tertiary)'}`,
                              background: rolePerms[perm.id] ? roleColor : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}>
                              {rolePerms[perm.id] && <CheckCircle size={14} color="#fff" strokeWidth={3} />}
                            </div>
                            <input
                              type="checkbox"
                              checked={!!rolePerms[perm.id]}
                              onChange={e => setRolePerms({ ...rolePerms, [perm.id]: e.target.checked })}
                              style={{ display: 'none' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: rolePerms[perm.id] ? roleColor : 'var(--text-secondary)' }}>
                              {perm.icon}
                              <span style={{ fontSize: '14px', fontWeight: 600 }}>{perm.labelAr}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Sticky Footer */}
            <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '16px', background: 'var(--surface)', position: 'sticky', bottom: 0, zIndex: 10 }}>
              <button type="button" onClick={() => setIsRoleModalOpen(false)} className="btn btn-outline" style={{ padding: '14px 28px', borderRadius: '12px', fontWeight: 600 }}>إلغاء</button>
              <button
                onClick={handleSaveRole}
                disabled={saving || !roleNameAr || !roleNameEn}
                className="btn btn-primary"
                style={{
                  padding: '14px 32px',
                  background: roleColor,
                  borderColor: roleColor,
                  borderRadius: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: (saving || !roleNameAr || !roleNameEn) ? 0.7 : 1,
                  cursor: (saving || !roleNameAr || !roleNameEn) ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
                {saving ? 'جاري الحفظ...' : (editingRole ? 'حفظ التعديلات' : 'إنشاء الرتبة')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {isAssignModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setIsAssignModalOpen(false)}></div>
          <div className="modal-content animate-in zoom-in-95" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px', width: '95%', maxWidth: '500px', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary)', flexShrink: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>تعيين مستخدم كمدير</h2>
              <button onClick={() => setIsAssignModalOpen(false)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>

              {!assigningAdmin ? (
                <>
                  {/* Search Field */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>البحث عن مستخدم</label>
                    <div style={{ position: 'relative' }}>
                      <Search size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={e => setUserSearchQuery(e.target.value)}
                        placeholder="ابحث بالاسم، البريد، أو رقم الهاتف..."
                        style={{ width: '100%', padding: '14px 16px 14px 40px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px' }}
                      />
                      {isSearchingUsers && (
                        <Loader2 size={16} className="spin" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                      )}
                    </div>
                  </div>

                  {/* Search Results */}
                  <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    {isSearchingUsers ? (
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[1, 2, 3].map(i => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.7, animation: 'pulse 1.5s infinite' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--border-light)' }}></div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ width: '40%', height: '14px', background: 'var(--border-light)', borderRadius: '4px' }}></div>
                              <div style={{ width: '60%', height: '12px', background: 'var(--border-light)', borderRadius: '4px' }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : userSearchResults.length > 0 ? (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {userSearchResults.map(u => {
                          const isAdmin = !!u.profile?.admin_role;
                          const accountTypeStr = u.profile?.account_type === 'doctor' ? 'طبيب' :
                            u.profile?.account_type === 'hospital' ? 'مستشفى' :
                              u.profile?.account_type === 'pharmacy' ? 'صيدلية' : 'مستخدم';
                          const statusStr = u.is_active ? 'نشط' : 'موقوف';
                          const statusColor = u.is_active ? '#10b981' : '#ef4444';

                          return (
                            <button
                              key={u.id}
                              disabled={isAdmin}
                              onClick={() => { setAssigningAdmin(u); setSelectedRoleIdToAssign(u.profile?.admin_role?.id || null); }}
                              style={{
                                width: '100%', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px',
                                background: 'transparent',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: 'transparent',
                                borderBottomColor: 'var(--border-light)',
                                cursor: isAdmin ? 'not-allowed' : 'pointer', textAlign: 'right', transition: 'all 0.2s',
                                opacity: isAdmin ? 0.6 : 1
                              }}
                            >
                              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', flexShrink: 0 }}>
                                {(u.profile?.full_name || u.email).charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>{u.profile?.full_name || 'بدون اسم'}</span>
                                    {u.profile?.admin_role && (
                                      <span style={{ background: '#3b82f620', color: '#3b82f6', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <ShieldCheck size={12} /> مدير بالفعل
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> {u.email}</span>
                                  {u.profile?.phone_number && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> {u.profile.phone_number}</span>}
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                  <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{accountTypeStr}</span>
                                  <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', background: `${statusColor}15`, color: statusColor, fontWeight: 700 }}>{statusStr}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Search size={32} color="var(--text-tertiary)" />
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px' }}>لا يوجد مستخدمون مطابقون للبحث</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>جرّب البحث بالبريد أو رقم الهاتف.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Selected User Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>المستخدم المحدد</label>
                      <button
                        onClick={() => { setAssigningAdmin(null); setSelectedRoleIdToAssign(null); }}
                        style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RefreshCw size={14} /> تغيير المستخدم
                      </button>
                    </div>

                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px', flexShrink: 0 }}>
                        {(assigningAdmin.profile?.full_name || assigningAdmin.email).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '16px' }}>{assigningAdmin.profile?.full_name || 'بدون اسم'}</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{assigningAdmin.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>اختر الرتبة الإدارية</label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={selectedRoleIdToAssign || ''}
                        onChange={e => setSelectedRoleIdToAssign(Number(e.target.value) || null)}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          color: 'var(--text-primary)',
                          fontSize: '15px',
                          appearance: 'none',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- يرجى اختيار رتبة --</option>
                        {roles.filter(r => r.is_active).map(role => (
                          <option key={role.id} value={role.id}>{role.name_ar} / {role.name_en}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                    </div>

                    {!assigningAdmin.is_active && (
                      <div style={{ padding: '12px 16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start', color: '#f59e0b', marginTop: '4px' }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                          <strong>تنبيه:</strong> هذا المستخدم ليس نشطاً (حسابه موقوف). هل أنت متأكد من تعيينه كمدير؟
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer with Actions */}
            <div style={{ padding: '24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-tertiary)', flexShrink: 0, display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                style={{ flex: 1, padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                إلغاء
              </button>

              <button
                onClick={() => {
                  if (assigningAdmin && selectedRoleIdToAssign) {
                    submitAssignRole(assigningAdmin.id, selectedRoleIdToAssign);
                    setIsAssignModalOpen(false);
                    setAssigningAdmin(null);
                    setSelectedRoleIdToAssign(null);
                  }
                }}
                disabled={!assigningAdmin || !selectedRoleIdToAssign}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  opacity: (!assigningAdmin || !selectedRoleIdToAssign) ? 0.5 : 1,
                  cursor: (!assigningAdmin || !selectedRoleIdToAssign) ? 'not-allowed' : 'pointer'
                }}
              >
                تعيين كمدير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', background: toastMsg.includes('خطأ') || toastMsg.includes('لا يمكن') ? '#ef4444' : '#10b981', color: 'var(--text-primary)', padding: '16px 24px', borderRadius: '16px', zIndex: 10000, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '15px', minWidth: '300px', justifyContent: 'center', animation: 'slideUp 0.3s ease-out' }}>
          {toastMsg.includes('خطأ') || toastMsg.includes('لا يمكن') ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          <span>{toastMsg}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        
        .admin-roles-container {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .admin-search-input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(232, 131, 58, 0.10) !important;
          outline: none;
        }
        .admin-primary-btn:hover {
          background: #d46b25 !important;
        }
        .admin-outline-primary:hover {
          background: rgba(232, 131, 58, 0.08) !important;
        }
        .admin-hover-bg:hover, .admin-stats-card:hover, .admin-table-row:hover {
          background: var(--surface-hover) !important;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}