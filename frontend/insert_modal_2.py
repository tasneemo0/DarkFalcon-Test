import re

with open('app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

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

if '2FA Setup Modal' not in content:
    # find the last instance of </div>\n  );\n}
    idx = content.rfind('    </div>\n  );\n}')
    if idx != -1:
        content = content[:idx] + modal_ui + '\n' + content[idx:]
        with open('app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Modal successfully injected at the end of JSX!")
    else:
        print("Could not find end of JSX")
else:
    print("Modal is already present!")
