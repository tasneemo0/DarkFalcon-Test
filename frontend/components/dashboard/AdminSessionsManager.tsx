"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Phone, RefreshCw, Eye, XCircle, 
  Info, X, Clock, QrCode, CheckCircle, AlertTriangle, 
  Activity
} from 'lucide-react';

interface AnimatedNumberProps {
  value: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1200; // 1.2s

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(Math.floor(easeProgress * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue}</span>;
};

export default function AdminSessionsManager({ 
  adminSessions, 
  locale, 
  handleTerminateSession, 
  fetchAdminData,
  loading = false
}: { 
  adminSessions: any[]; 
  locale: string; 
  handleTerminateSession: (id: number) => Promise<void>; 
  fetchAdminData: () => Promise<void>;
  loading?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Deriving Stats
  const stats = useMemo(() => {
    const total = adminSessions.length;
    const connected = adminSessions.filter(s => s.status === 'connected').length;
    const qrPending = adminSessions.filter(s => s.status === 'qrcode').length;
    const disconnected = adminSessions.filter(s => s.status === 'disconnected').length;
    return { total, connected, qrPending, disconnected };
  }, [adminSessions]);

  // Filtering
  const filteredSessions = useMemo(() => {
    return adminSessions.filter(s => {
      const matchQuery = 
        (s.instance_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.phone_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.user || '').toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchType = typeFilter === 'all' || s.instance_type === typeFilter;
      
      return matchQuery && matchStatus && matchType;
    });
  }, [adminSessions, searchQuery, statusFilter, typeFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAdminData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const confirmDisconnect = async () => {
    if (disconnectingId === null) return;
    await handleTerminateSession(disconnectingId);
    setDisconnectingId(null);
    setSelectedSession(null); // close details if open
  };

  // Status mapping
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'connected': return { label: locale === 'ar' ? 'متصل' : 'Connected', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircle size={14} /> };
      case 'disconnected': return { label: locale === 'ar' ? 'غير متصل' : 'Disconnected', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <XCircle size={14} /> };
      case 'pending': return { label: locale === 'ar' ? 'بانتظار الاتصال' : 'Pending', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: <Clock size={14} /> };
      case 'qrcode': return { label: locale === 'ar' ? 'بانتظار QR' : 'QR Pending', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', icon: <QrCode size={14} /> };
      default: return { label: status, color: 'var(--text-secondary)', bg: 'rgba(156, 163, 175, 0.1)', icon: <Info size={14} /> };
    }
  };

  // Type mapping
  const getTypeDisplay = (type: string) => {
    switch(type) {
      case 'web_qr': return 'QR Web';
      case 'cloud_api': return 'Cloud API';
      case 'meta': return 'Meta Cloud';
      default: return type || 'Unknown';
    }
  };

  // Styles
  const glassStyle = {
    background: 'var(--surface)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid var(--border-light)',
    borderRadius: '16px'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        .admin-stat-card {
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .admin-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -10px var(--stat-color-alpha);
          border-color: var(--stat-color) !important;
        }
        .admin-stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, var(--stat-color-alpha) 0%, transparent 80%);
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 0;
        }
        .admin-stat-card:hover::before {
          opacity: 1;
        }
        .admin-stat-card-content {
          position: relative;
          z-index: 1;
          display: flex;
          alignItems: center;
          gap: 16px;
          width: 100%;
        }
        .admin-stat-icon-wrapper {
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .admin-stat-card:hover .admin-stat-icon-wrapper {
          transform: scale(1.15) rotate(5deg);
        }
        
        /* Table Styles */
        .saasResponsiveTable {
          border-spacing: 0;
          width: 100%;
        }
        .session-row-hover {
          transition: all 0.2s ease;
        }
        .session-row-hover:hover {
          background-color: var(--surface-hover);
          box-shadow: inset 4px 0 0 var(--primary);
        }
        .btn-action-hover {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .btn-action-hover:hover {
          transform: translateY(-2px);
          background: var(--primary) !important;
          color: #fff !important;
          box-shadow: 0 4px 12px rgba(232, 131, 58, 0.3);
        }
        .btn-action-hover-danger {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .btn-action-hover-danger:hover {
          transform: translateY(-2px);
          background: #EF4444 !important;
          color: #fff !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
      `}</style>
      
      {/* Header & Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            {locale === 'ar' ? 'إدارة الجلسات' : 'Sessions Management'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {locale === 'ar' ? 'إدارة ومراقبة جلسات واتساب الخاصة بعملاء المنصة' : 'Manage and monitor customer WhatsApp sessions'}
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        }}>
          {[
            { label: locale === 'ar' ? 'إجمالي الجلسات' : 'Total Sessions', value: stats.total, color: '#E8833A', icon: <Activity size={20} /> },
            { label: locale === 'ar' ? 'متصلة الآن' : 'Connected', value: stats.connected, color: '#10B981', icon: <CheckCircle size={20} /> },
            { label: locale === 'ar' ? 'بانتظار QR' : 'QR Pending', value: stats.qrPending, color: '#3B82F6', icon: <QrCode size={20} /> },
            { label: locale === 'ar' ? 'غير متصلة' : 'Disconnected', value: stats.disconnected, color: '#EF4444', icon: <XCircle size={20} /> },
          ].map((stat, idx) => (
            <div 
              key={idx} 
              className="admin-stat-card"
              style={{ 
                ...glassStyle, 
                padding: '20px',
                borderLeft: `4px solid ${stat.color}`,
                '--stat-color': stat.color,
                '--stat-color-alpha': `${stat.color}25`
              } as React.CSSProperties}
            >
              <div className="admin-stat-card-content">
                <div 
                  className="admin-stat-icon-wrapper"
                  style={{ 
                    width: '48px', height: '48px', 
                    borderRadius: '12px', 
                    background: `${stat.color}20`, 
                    color: stat.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {stat.icon}
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>{stat.label}</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <AnimatedNumber value={stat.value} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ 
        ...glassStyle, 
        padding: '16px', 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '16px', 
        alignItems: 'center',
        justifyContent: 'space-between' 
      }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: locale === 'ar' ? '12px' : 'auto', left: locale === 'ar' ? 'auto' : '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder={locale === 'ar' ? 'البحث بالعميل، رقم الواتساب...' : 'Search customer, number...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: locale === 'ar' ? '10px 38px 10px 16px' : '10px 16px 10px 38px',
                background: 'var(--surface-hover)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', outline: 'none'
              }}
            />
          </div>
          
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px', background: 'var(--surface-hover)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', minWidth: '130px'
            }}
          >
            <option value="all">{locale === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="connected">{locale === 'ar' ? 'متصل' : 'Connected'}</option>
            <option value="disconnected">{locale === 'ar' ? 'غير متصل' : 'Disconnected'}</option>
            <option value="pending">{locale === 'ar' ? 'بانتظار الاتصال' : 'Pending'}</option>
            <option value="qrcode">{locale === 'ar' ? 'بانتظار QR' : 'QR Pending'}</option>
          </select>

          <select 
            value={typeFilter} 
            onChange={e => setTypeFilter(e.target.value)}
            style={{
              padding: '10px 16px', background: 'var(--surface-hover)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', minWidth: '130px'
            }}
          >
            <option value="all">{locale === 'ar' ? 'كل الأنواع' : 'All Types'}</option>
            <option value="web_qr">QR Web</option>
            <option value="cloud_api">Cloud API</option>
            <option value="meta">Meta Cloud</option>
          </select>
        </div>

        <button 
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          style={{
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--primary, #E8833A)', color: 'var(--text-primary)', border: 'none',
            borderRadius: '8px', cursor: (isRefreshing || loading) ? 'not-allowed' : 'pointer',
            opacity: (isRefreshing || loading) ? 0.7 : 1, fontWeight: 500
          }}
        >
          <RefreshCw size={16} className={(isRefreshing || loading) ? "spin-anim" : ""} />
          {locale === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Table Area */}
      <div style={{ ...glassStyle, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="saasResponsiveTable"  style={{ width: '100%', borderCollapse: 'collapse', textAlign: locale === 'ar' ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{locale === 'ar' ? 'اسم الجلسة' : 'Session Name'}</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{locale === 'ar' ? 'العميل' : 'Customer'}</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{locale === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'}</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{locale === 'ar' ? 'النوع' : 'Type'}</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton Loader
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} style={{ padding: '16px' }}>
                        <div style={{ height: '20px', background: 'var(--bg-tertiary)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredSessions.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <Phone size={48} style={{ opacity: 0.2 }} />
                      <p style={{ fontSize: '16px' }}>
                        {locale === 'ar' ? 'لا توجد جلسات مطابقة للبحث' : 'No sessions found'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session, index) => {
                  const statusInfo = getStatusDisplay(session.status);
                  
                  return (
                    <tr 
                      key={session.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'all 0.2s ease',
                      }}
                      className="session-row-hover"
                    >
                      <td data-label="ID" style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>#{session.id}</td>
                      <td data-label={locale === 'ar' ? 'اسم الجلسة' : 'Session Name'} style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{session.instance_name || '-'}</td>
                      <td data-label={locale === 'ar' ? 'العميل' : 'Customer'} style={{ padding: '16px 20px', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary, #E8833A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0, boxShadow: '0 2px 6px rgba(232, 131, 58, 0.3)' }}>
                            {(session.user || '?').charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500 }}>{session.user || 'Unknown'}</span>
                        </div>
                      </td>
                      <td data-label={locale === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'} style={{ padding: '16px 20px' }}>
                        <span dir="ltr" style={{ display: 'inline-block', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {session.phone_number || '-'}
                        </span>
                      </td>
                      <td data-label={locale === 'ar' ? 'النوع' : 'Type'} style={{ padding: '16px 20px' }}>
                        <span style={{ 
                          padding: '6px 10px', borderRadius: '8px', background: 'var(--bg-tertiary)', 
                          fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
                          border: '1px solid var(--border-light)'
                        }}>
                          {getTypeDisplay(session.instance_type)}
                        </span>
                      </td>
                      <td data-label={locale === 'ar' ? 'الحالة' : 'Status'} style={{ padding: '16px 20px' }}>
                        <div style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '6px 12px', borderRadius: '20px', 
                          background: statusInfo.bg, color: statusInfo.color,
                          fontSize: '13px', fontWeight: 600
                        }}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </div>
                      </td>
                      <td data-label={locale === 'ar' ? 'الإجراءات' : 'Actions'} style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button 
                            onClick={() => setSelectedSession(session)}
                            title={locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                            style={{ 
                              background: 'var(--surface-hover)', border: 'none', width: '32px', height: '32px', 
                              borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            className="btn-action-hover"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {session.status !== 'disconnected' && (
                            <button 
                              onClick={() => setDisconnectingId(session.id)}
                              title={locale === 'ar' ? 'إنهاء الاتصال' : 'Disconnect'}
                              style={{ 
                                background: 'rgba(239, 68, 68, 0.1)', border: 'none', width: '32px', height: '32px', 
                                borderRadius: '8px', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s ease'
                              }}
                              className="btn-action-hover-danger"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {disconnectingId !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '400px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'center'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={28} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: '20px' }}>
              {locale === 'ar' ? 'إنهاء الاتصال' : 'Disconnect Session'}
            </h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {locale === 'ar' ? 'هل أنت متأكد من إنهاء اتصال هذه الجلسة؟ سيؤدي ذلك إلى إيقاف عمل البوت والرسائل.' : 'Are you sure you want to disconnect this session? This will stop bot operations and messaging.'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setDisconnectingId(null)}
                style={{ flex: 1, padding: '12px', background: 'var(--surface-hover)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={confirmDisconnect}
                style={{ flex: 1, padding: '12px', background: '#EF4444', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
              >
                {locale === 'ar' ? 'تأكيد الإنهاء' : 'Confirm Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Drawer/Modal */}
      {selectedSession !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: locale === 'ar' ? 'flex-start' : 'flex-end', zIndex: 9998,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'var(--surface)', borderLeft: locale === 'ar' ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRight: locale === 'ar' ? '1px solid rgba(255,255,255,0.1)' : 'none',
            width: '100%', maxWidth: '400px', height: '100%',
            boxShadow: '0 0 40px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column',
            animation: locale === 'ar' ? 'slideInLeft 0.3s ease' : 'slideInRight 0.3s ease'
          }}>
            {/* Drawer Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={20} color="var(--primary, #E8833A)" />
                {locale === 'ar' ? 'تفاصيل الجلسة' : 'Session Details'}
              </h3>
              <button 
                onClick={() => setSelectedSession(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Header Info */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary, #E8833A)', color: 'var(--text-primary)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700 }}>
                  {(selectedSession.instance_name || '?').charAt(0).toUpperCase()}
                </div>
                <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)', fontSize: '20px' }}>{selectedSession.instance_name || 'Unnamed Session'}</h4>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>#{selectedSession.id}</div>
              </div>

              {/* Status & Type */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{locale === 'ar' ? 'الحالة' : 'Status'}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: getStatusDisplay(selectedSession.status).bg, color: getStatusDisplay(selectedSession.status).color, fontSize: '13px', fontWeight: 500 }}>
                    {getStatusDisplay(selectedSession.status).icon}
                    {getStatusDisplay(selectedSession.status).label}
                  </div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{locale === 'ar' ? 'النوع' : 'Type'}</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>{getTypeDisplay(selectedSession.instance_type)}</div>
                </div>
              </div>

              {/* Detail Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{locale === 'ar' ? 'العميل' : 'Customer'}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>{selectedSession.user || 'Unknown'}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{locale === 'ar' ? 'رقم الواتساب' : 'WhatsApp No.'}</span>
                  <span dir="ltr" style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>{selectedSession.phone_number || '-'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{locale === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</span>
                  <span dir="ltr" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                    {selectedSession.created_at ? new Date(selectedSession.created_at).toLocaleDateString() : '-'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{locale === 'ar' ? 'آخر نشاط' : 'Last Activity'}</span>
                  <span dir="ltr" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                    {selectedSession.last_activity ? new Date(selectedSession.last_activity).toLocaleString() : '-'}
                  </span>
                </div>
                
              </div>

              {/* QR Code section if pending QR */}
              {selectedSession.status === 'qrcode' && selectedSession.qr_code && (
                <div style={{ marginTop: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>{locale === 'ar' ? 'رمز الاستجابة السريعة (QR)' : 'QR Code'}</div>
                  <img 
                    src={selectedSession.qr_code.startsWith('data:image') ? selectedSession.qr_code : `data:image/png;base64,${selectedSession.qr_code}`} 
                    alt="QR Code" 
                    style={{ width: '150px', height: '150px', borderRadius: '8px', border: '4px solid #fff' }}
                  />
                </div>
              )}
            </div>
            
            {/* Drawer Footer Actions */}
            <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {selectedSession.status !== 'disconnected' ? (
                <button 
                  onClick={() => setDisconnectingId(selectedSession.id)}
                  style={{ width: '100%', padding: '14px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <XCircle size={18} />
                  {locale === 'ar' ? 'إنهاء الاتصال' : 'Disconnect'}
                </button>
              ) : (
                <div style={{ width: '100%', padding: '14px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', textAlign: 'center', fontWeight: 500 }}>
                  {locale === 'ar' ? 'الجلسة غير متصلة' : 'Session is Disconnected'}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Global styles for animations and hovers */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 0.8; } 100% { opacity: 0.5; } }
        
        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .session-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.02);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .btn-action-hover:hover {
          background: rgba(255,255,255,0.2) !important;
          transform: scale(1.05);
        }
        .btn-action-hover-danger:hover {
          background: rgba(239, 68, 68, 0.2) !important;
          transform: scale(1.05);
        }
        
        /* Responsive Table to Cards on Mobile */
        @media (max-width: 768px) {
          table, thead, tbody, th, td, tr {
            display: block;
          }
          thead tr {
            position: absolute;
            top: -9999px;
            left: -9999px;
          }
          tr {
            border: 1px solid var(--border) !important;
            border-radius: 12px;
            margin-bottom: 16px;
            background: rgba(255,255,255,0.01);
            padding: 12px;
          }
          td {
            border: none !important;
            position: relative;
            padding: 8px 12px !important;
            display: flex !important;
            justify-content: space-between;
            align-items: center;
          }
          td::before {
            content: attr(data-label);
            font-size: 12px;
            color: var(--text-secondary);
            font-weight: 500;
          }
          .session-row-hover:hover {
            transform: none;
          }
        }
      `}} />
    </div>
  );
}
