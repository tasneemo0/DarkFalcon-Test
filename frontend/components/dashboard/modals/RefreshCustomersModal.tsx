import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, X, CheckCircle2 } from 'lucide-react';
import { PremiumButton } from '@/components/dashboard/PremiumButton';

interface RefreshCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  lastUpdated: string;
  totalCustomers: number;
}

export function RefreshCustomersModal({ isOpen, onClose, onRefresh, lastUpdated, totalCustomers }: RefreshCustomersModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await onRefresh();
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Refresh failed', error);
      alert('حدث خطأ أثناء تحديث البيانات');
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
              borderRadius: 'var(--radius-xl)', padding: '24px', width: '90%', maxWidth: '400px',
              boxShadow: 'var(--shadow-card-hover)', position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RefreshCcw size={24} color="#22C55E" />
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>تحديث بيانات العملاء</h3>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
              هل تريد تحديث بيانات العملاء من الخادم الآن؟ سيؤدي ذلك إلى جلب أحدث الإحصائيات والمستخدمين دون إعادة تحميل الصفحة.
            </p>
            
            <div style={{ background: 'var(--background)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>عدد العملاء الحالي:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>{totalCustomers}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>آخر وقت تحديث:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, direction: 'ltr' }}>{lastUpdated}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>حالة الاتصال بالخادم:</span>
                <span style={{ color: '#22C55E', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}></span>
                  متصل
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <PremiumButton variant="ghost" onClick={onClose} disabled={isLoading}>
                إلغاء
              </PremiumButton>
              <PremiumButton 
                variant="primary" 
                onClick={handleRefresh} 
                disabled={isLoading}
                style={{
                  ...(isSuccess ? { background: '#10b981', borderColor: '#10b981' } : { background: '#22C55E', borderColor: '#22C55E' }),
                  boxShadow: isSuccess ? '0 4px 14px rgba(16, 185, 129, 0.28)' : '0 4px 14px rgba(34, 197, 94, 0.28)'
                }}
              >
                {isLoading ? 'جاري التحديث...' : isSuccess ? <><CheckCircle2 size={16} /> تم التحديث بنجاح</> : 'تحديث الآن'}
              </PremiumButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
