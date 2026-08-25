import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PremiumButton } from '@/components/dashboard/PremiumButton';
import { API_BASE_URL } from '@/lib/api';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export function SendNotificationModal({ isOpen, onClose, token }: SendNotificationModalProps) {
  const [recipients, setRecipients] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const handleSend = async () => {
    if (!title || !message) {
      setErrorMsg('الرجاء إدخال العنوان ونص الرسالة.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/clients/notify/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          recipients,
          title,
          message,
          type
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء إرسال الإشعار');
      }
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setTitle('');
        setMessage('');
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Notify failed', error);
      setErrorMsg(error.message || 'حدث خطأ أثناء إرسال الإشعار');
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
                <Bell size={24} color="#8B5CF6" />
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>إرسال إشعار للعملاء</h3>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertTriangle size={16} /> {errorMsg}
              </div>
            )}
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>المستلمين:</label>
              <select 
                value={recipients} 
                onChange={(e) => setRecipients(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  background: 'var(--background)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', outline: 'none'
                }}
              >
                <option value="all">جميع العملاء</option>
                <option value="active">العملاء النشطون</option>
                <option value="suspended">العملاء الموقوفون</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>نوع الإشعار:</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { id: 'info', label: 'معلومة', color: '#3B82F6' },
                  { id: 'warning', label: 'تنبيه', color: '#F59E0B' },
                  { id: 'success', label: 'نجاح', color: '#10B981' },
                ].map(t => (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="notify_type"
                      checked={type === t.id}
                      onChange={() => setType(t.id)}
                      style={{ accentColor: t.color }}
                    />
                    <span style={{ fontSize: '14px' }}>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>عنوان الإشعار:</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تحديث جديد في النظام"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  background: 'var(--background)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', outline: 'none'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>نص الرسالة:</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                rows={4}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  background: 'var(--background)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', outline: 'none', resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <PremiumButton variant="ghost" onClick={onClose} disabled={isLoading}>
                إلغاء
              </PremiumButton>
              <PremiumButton 
                variant="primary" 
                onClick={handleSend} 
                disabled={isLoading || !title || !message}
                style={{
                  ...(isSuccess ? { background: '#10b981', borderColor: '#10b981' } : { background: '#8B5CF6', borderColor: '#8B5CF6' }),
                  boxShadow: isSuccess ? '0 4px 14px rgba(16, 185, 129, 0.28)' : '0 4px 14px rgba(139, 92, 246, 0.28)'
                }}
              >
                {isLoading ? 'جاري الإرسال...' : isSuccess ? <><CheckCircle2 size={16} /> تم الإرسال</> : 'إرسال الإشعار'}
              </PremiumButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
