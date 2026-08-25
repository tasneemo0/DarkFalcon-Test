import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle2 } from 'lucide-react';
import { PremiumButton } from '@/components/dashboard/PremiumButton';
import { API_BASE_URL } from '@/lib/api';

interface ExportCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export function ExportCustomersModal({ isOpen, onClose, token }: ExportCustomersModalProps) {
  const [status, setStatus] = useState('all');
  const [columns, setColumns] = useState(['name', 'email', 'phone', 'status', 'plan', 'date']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const handleToggleColumn = (col: string) => {
    setColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };
  
  const handleExport = async () => {
    if (columns.length === 0) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        status,
        columns: columns.join(',')
      });
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/clients/export/?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export failed', error);
      alert('حدث خطأ أثناء التصدير');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
          direction: 'rtl'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xl)', padding: '24px', width: '90%', maxWidth: '500px',
              boxShadow: 'var(--shadow-card-hover)', position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Download size={24} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>تصدير بيانات العملاء</h3>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>حالة العملاء:</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  background: 'var(--background)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', outline: 'none'
                }}
              >
                <option value="all">جميع العملاء</option>
                <option value="active">النشطين فقط</option>
                <option value="suspended">الموقوفين فقط</option>
                <option value="new">العملاء الجدد (هذا الشهر)</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>الأعمدة المراد تصديرها:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { id: 'name', label: 'الاسم' },
                  { id: 'email', label: 'البريد الإلكتروني' },
                  { id: 'phone', label: 'رقم الهاتف' },
                  { id: 'status', label: 'الحالة' },
                  { id: 'plan', label: 'الباقة' },
                  { id: 'date', label: 'تاريخ التسجيل' },
                ].map(col => (
                  <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={columns.includes(col.id)}
                      onChange={() => handleToggleColumn(col.id)}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontSize: '14px' }}>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <PremiumButton variant="ghost" onClick={onClose} disabled={isLoading}>
                إلغاء
              </PremiumButton>
              <PremiumButton 
                variant="primary" 
                onClick={handleExport} 
                disabled={isLoading || columns.length === 0}
                style={isSuccess ? { background: '#10b981', borderColor: '#10b981' } : {}}
              >
                {isLoading ? 'جاري التصدير...' : isSuccess ? <><CheckCircle2 size={16} /> تم التصدير</> : 'تصدير CSV'}
              </PremiumButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
