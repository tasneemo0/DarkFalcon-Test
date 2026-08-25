import re
with open('app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State variables
state_vars = '''
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [twoFaSetupPhone, setTwoFaSetupPhone] = useState('');
  const [twoFaSetupOtp, setTwoFaSetupOtp] = useState('');
  const [is2faOtpSent, setIs2faOtpSent] = useState(false);
'''
content = re.sub(r'(const \[twoFactor, setTwoFactor\] = useState\(false\);)', r'\1\n' + state_vars, content)

# 2. Add Handlers
handlers = '''
  const handleSetup2FARequest = async () => {
    try {
      await fetchWithAuth('/api/v1/auth/2fa/setup/request/', {
        method: 'POST',
        body: JSON.stringify({ phone_number: twoFaSetupPhone || user?.phone_number })
      });
      setIs2faOtpSent(true);
    } catch (e: any) {
      alert(e.message || 'فشل إرسال كود التحقق');
    }
  };

  const handleSetup2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/api/v1/auth/2fa/setup/verify/', {
        method: 'POST',
        body: JSON.stringify({ otp: twoFaSetupOtp })
      });
      setIs2faModalOpen(false);
      setIs2faOtpSent(false);
      setTwoFactor(true);
      
      const updated = await fetchWithAuth('/api/v1/auth/profile/');
      setUser(updated);
      alert(locale === 'ar' ? 'تم تفعيل المصادقة الثنائية بنجاح' : '2FA enabled successfully');
    } catch (e: any) {
      alert(e.message || 'فشل تفعيل المصادقة الثنائية');
    }
  };
'''
content = re.sub(r'(const handleToggleSecurity = async)', handlers + r'\n  \1', content)

# 3. Update Checkbox
old_cb = r"onChange=\{\(e\) => \{ setTwoFactor\(e\.target\.checked\); handleToggleSecurity\('2fa', e\.target\.checked\); \}\}"
new_cb = '''onChange={(e) => { 
                        if (e.target.checked) {
                          setIs2faModalOpen(true);
                          setTwoFaSetupPhone(user?.phone_number || '');
                          setIs2faOtpSent(false);
                          setTwoFaSetupOtp('');
                        } else {
                          setTwoFactor(false); 
                          handleToggleSecurity('2fa', false); 
                        }
                      }}'''
content = re.sub(old_cb, new_cb, content)

# 4. Add Modal UI
modal_ui = '''
      {/* 2FA Setup Modal */}
      {is2faModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '16px' }}>{locale === 'ar' ? 'تفعيل المصادقة الثنائية' : 'Enable 2FA'}</h3>
            {!is2faOtpSent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {locale === 'ar' ? 'أدخل رقم الهاتف أو استخدم الرقم المسجل للحصول على كود التفعيل.' : 'Enter your phone number or use the registered one to receive the verification code.'}
                </p>
                <input 
                  type="text" 
                  value={twoFaSetupPhone}
                  onChange={(e) => setTwoFaSetupPhone(e.target.value)}
                  placeholder={locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)' }}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button onClick={() => setIs2faModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button onClick={handleSetup2FARequest} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                    {locale === 'ar' ? 'أرسل كود SMS' : 'Send SMS Code'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSetup2FAVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input 
                  type="text" 
                  required
                  value={twoFaSetupOtp}
                  onChange={(e) => setTwoFaSetupOtp(e.target.value)}
                  placeholder={locale === 'ar' ? 'أدخل الكود (6 أرقام)' : 'Enter 6-digit OTP'}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)' }}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIs2faModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                    {locale === 'ar' ? 'تفعيل' : 'Verify & Enable'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
'''

content = re.sub(r'(\{/\* Email OTP Modal \*/\})', modal_ui + r'\n      \1', content)

with open('app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Modifications applied successfully.")
