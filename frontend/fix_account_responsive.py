import os
import re

PAGE_TSX = r"c:\project\web_hemo\frontend\app\dashboard\page.tsx"

if os.path.exists(PAGE_TSX):
    with open(PAGE_TSX, 'r', encoding='utf-8') as f:
        tsx = f.read()

    # 1. Update Header
    header_regex = r'<motion\.header\s+className=\{styles\.topBar\}\s+style=\{\{[\s\S]*?\}\}\s*\>([\s\S]*?)\</motion\.header\>'
    
    def header_replacer(match):
        return '''<motion.header
          className={`${styles.topBar} flex items-center justify-between px-4 sm:px-6 w-full`}
          style={{
            backgroundColor: topBarBg as any,
            backdropFilter: topBarBlur as any,
            WebkitBackdropFilter: topBarBlur as any
          }}
        >
          {/* Right Section (in RTL) */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button className={styles.burgerBtn} onClick={() => setSidebarOpen(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <button className={styles.topBarIcon} onClick={toggleTheme}>
              {theme === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              )}
            </button>
          </div>

          {/* Left Section (in RTL) */}
          <div className="flex items-center gap-3 sm:gap-4 text-left" style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>
            <div className={`${styles.topBarTitle} flex flex-col items-end`}>
              <h1 className="text-sm sm:text-base font-bold whitespace-nowrap m-0">
                {isAdminMode ?
                  getTranslationText('', 'لوحة المدير العام للمنصة', 'DarkFalcon General Admin Controls') :
                  getTranslationText('', 'لوحة إدارة الحساب', 'Customer WhatsApp Web Dashboard')
                }
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis m-0" style={{ maxWidth: '140px' }}>
                {locale === 'ar' ? `أهلاً بك، ${user?.email}` : `Welcome back, ${user?.email}`}
              </p>
            </div>
            <motion.div className={styles.userAvatar} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <span>{user?.email ? user.email.charAt(0).toUpperCase() : 'U'}</span>
            </motion.div>
          </div>
        </motion.header>'''
        
    tsx = re.sub(header_regex, header_replacer, tsx, count=1)

    # 2. Update Checkboxes & Padding
    # Card 1 (Credentials)
    tsx = tsx.replace(
        "padding: '24px'",
        "padding: '16px'" # Make it 16px to prevent overflow on small screens
    )
    
    # 2FA Checkbox
    tsx = re.sub(
        r"<label style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var\(--bg-tertiary\)', padding: '12px', borderRadius: '6px' \}\}>\s*<span>\{locale === 'ar' \? 'تفعيل المصادقة الثنائية \(2FA\)' : 'Enable Two-Factor Authentication'\}</span>\s*<input type=\"checkbox\"([^>]+)/>\s*</label>",
        r'''<label className="flex items-center justify-between p-3 sm:p-4 rounded-md cursor-pointer flex-row-reverse" style={{ background: 'var(--bg-tertiary)' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', flexShrink: 0, margin: '0 8px' }}\1/>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{locale === 'ar' ? 'تفعيل المصادقة الثنائية (2FA)' : 'Enable Two-Factor Authentication'}</span>
                  </label>''',
        tsx
    )
    
    # IP Restrict Checkbox
    tsx = re.sub(
        r"<label style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var\(--bg-tertiary\)', padding: '12px', borderRadius: '6px' \}\}>\s*<span>\{locale === 'ar' \? 'تقييد ومنع الدخول من عناوين IP إضافية' : 'Restrict Login to Authorized IP only'\}</span>\s*<input type=\"checkbox\"([^>]+)/>\s*</label>",
        r'''<label className="flex items-center justify-between p-3 sm:p-4 rounded-md cursor-pointer flex-row-reverse" style={{ background: 'var(--bg-tertiary)' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', flexShrink: 0, margin: '0 8px' }}\1/>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{locale === 'ar' ? 'تقييد ومنع الدخول من عناوين IP إضافية' : 'Restrict Login to Authorized IP only'}</span>
                  </label>''',
        tsx
    )
    
    # Two-step passcode container
    tsx = tsx.replace(
        "<div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>\n                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>\n                      <span>{locale === 'ar' ? 'تفعيل تسجيل الدخول بخطوتين' : 'Enable Two-step passcode'}</span>\n                      <input type=\"checkbox\"",
        '''<div className="p-3 sm:p-4 rounded-md flex flex-col gap-3" style={{ background: 'var(--bg-tertiary)' }}>
                    <label className="flex items-center justify-between cursor-pointer flex-row-reverse">
                      <input type="checkbox" style={{ width: '18px', height: '18px', flexShrink: 0, margin: '0 8px' }}'''
    )
    # the end of that checkbox div needs a closing label instead of div
    # Before: <input type="checkbox" ... />\n                    </div>\n                    {twoStepEnabled
    tsx = re.sub(
        r"(<input type=\"checkbox\"[^>]*twoStepEnabled[^>]*/>)\s*</div>\s*\{twoStepEnabled",
        r"\1\n                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{locale === 'ar' ? 'تفعيل تسجيل الدخول بخطوتين' : 'Enable Two-step passcode'}</span>\n                    </label>\n                    {twoStepEnabled",
        tsx
    )
    
    # 3. Form width and Button width
    # In modify credentials form:
    tsx = tsx.replace(
        '<button type="submit" className="btn btn-primary">',
        '<button type="submit" className="btn btn-primary w-full">'
    )

    with open(PAGE_TSX, 'w', encoding='utf-8') as f:
        f.write(tsx)
    print("Fixed page.tsx responsive issues")

