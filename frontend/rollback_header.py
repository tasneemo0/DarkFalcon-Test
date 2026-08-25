import os
import re

PAGE_TSX = r"c:\project\web_hemo\frontend\app\dashboard\page.tsx"

if os.path.exists(PAGE_TSX):
    with open(PAGE_TSX, 'r', encoding='utf-8') as f:
        content = f.read()
        
    old_header_pattern = r"<motion\.header.*?className=\{\$\{styles\.topBar\}[^>]*>.*?</motion\.header>"
    
    new_header = '''<motion.header
          className={${styles.topBar} flex items-center justify-between px-4 sm:px-6 w-full}
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
            <div className={${styles.topBarTitle} flex flex-col items-end}>
              <h1 className="text-sm sm:text-base font-bold whitespace-nowrap m-0">
                {isAdminMode ?
                  getTranslationText('', 'لوحة المدير العام للمنصة', 'DarkFalcon General Admin Controls') :
                  getTranslationText('', 'لوحة إدارة الحساب', 'Customer WhatsApp Web Dashboard')
                }
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis m-0" style={{ maxWidth: '140px' }}>
                {locale === 'ar' ? أهلاً بك،  : Welcome back, }
              </p>
            </div>
            <motion.div className={styles.userAvatar} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <span>{user?.email ? user.email.charAt(0).toUpperCase() : 'U'}</span>
            </motion.div>
          </div>
        </motion.header>'''
    
    content = re.sub(old_header_pattern, new_header, content, flags=re.DOTALL)
    
    with open(PAGE_TSX, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Rollback page.tsx header layout successful.")
