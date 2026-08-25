# -*- coding: utf-8 -*-
import re

with open('app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

end_tag = '''    </div>
  );
}'''

modals = '''
      {isEmailOtpModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h4>{locale === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Verify Email'}</h4>
              <button className={styles.modalClose} onClick={() => setIsEmailOtpModalOpen(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <form onSubmit={handleChangeEmailVerify} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <p>{locale === 'ar' ? 'لقد أرسلنا كود التحقق إلى بريدك الجديد. يرجى إدخاله هنا:' : 'We sent a verification code to your new email. Please enter it here:'}</p>
                <input 
                  type="text" 
                  value={editEmailOtp} 
                  onChange={(e) => setEditEmailOtp(e.target.value)} 
                  placeholder={locale === 'ar' ? 'أدخل الكود...' : 'Enter OTP...'} 
                  required 
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)' }} 
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setIsEmailOtpModalOpen(false)} className="btn btn-outline">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary">{locale === 'ar' ? 'تأكيد الكود' : 'Verify OTP'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isPhoneOtpModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h4>{locale === 'ar' ? 'تأكيد رقم الهاتف' : 'Verify Phone'}</h4>
              <button className={styles.modalClose} onClick={() => setIsPhoneOtpModalOpen(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <form onSubmit={handleChangePhoneVerify} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <p>{locale === 'ar' ? 'لقد أرسلنا رسالة SMS تحتوي على كود التحقق للرقم الجديد. يرجى إدخاله هنا:' : 'We sent an SMS with a verification code to your new phone. Please enter it here:'}</p>
                <input 
                  type="text" 
                  value={editPhoneOtp} 
                  onChange={(e) => setEditPhoneOtp(e.target.value)} 
                  placeholder={locale === 'ar' ? 'أدخل الكود...' : 'Enter OTP...'} 
                  required 
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)' }} 
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setIsPhoneOtpModalOpen(false)} className="btn btn-outline">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="btn btn-primary">{locale === 'ar' ? 'تأكيد الكود' : 'Verify OTP'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}'''

content = content.replace(end_tag, modals)

with open('app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
