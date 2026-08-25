'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import styles from './ConfirmModal.module.css';
import { PremiumButton } from '@/components/dashboard/PremiumButton';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  error?: string | null;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  isLoading = false,
  error = null,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  // Determine styles and icons based on type
  const typeClass = type === 'danger' ? styles.modalDanger : type === 'warning' ? styles.modalWarning : styles.modalInfo;
  const iconClass = type === 'danger' ? styles.iconDanger : type === 'warning' ? styles.iconWarning : styles.iconInfo;
  
  const Icon = type === 'danger' ? Trash2 : type === 'warning' ? AlertTriangle : Info;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay} dir="rtl">
          {/* Backdrop Blur Fade In */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'absolute', inset: 0, zIndex: -1 }}
            onClick={isLoading ? undefined : onClose}
          />

          {/* Modal Scale & Fade In */}
          <motion.div
            className={`${styles.modal} ${typeClass}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className={`${styles.iconWrapper} ${iconClass}`}>
              <Icon size={32} />
            </div>

            <h3 className={styles.title}>{title}</h3>
            <p className={styles.message}>{message}</p>

            {error && (
              <div className={styles.errorBox}>
                {error}
              </div>
            )}

            <div className={styles.actions}>
              <PremiumButton 
                variant="secondary" 
                onClick={onClose} 
                disabled={isLoading}
              >
                {cancelText}
              </PremiumButton>
              <PremiumButton 
                variant={type === 'danger' ? 'danger' : 'primary'} 
                onClick={onConfirm} 
                loading={isLoading}
              >
                {confirmText}
              </PremiumButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
