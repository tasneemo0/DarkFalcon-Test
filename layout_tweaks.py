import re

file_path = r"c:\project\web_hemo\frontend\app\dashboard\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace the Grid container with Flex container
content = content.replace(
    '<div className="interactiveBotGrid">',
    '<div style={{ display: \'flex\', flexWrap: \'wrap\', gap: \'24px\', alignItems: \'flex-start\' }}>'
)

# 2. Modify Left Column (Settings)
content = content.replace(
    '                  {/* Left Column: Settings & Options */}\n                  <div style={{ display: \'flex\', flexDirection: \'column\', gap: \'24px\' }}>',
    '                  {/* Right/Left Column: Settings & Options */}\n                  <div style={{ flex: \'1 1 500px\', display: \'flex\', flexDirection: \'column\', gap: \'24px\' }}>'
)

# 3. Modify Save Button Area
old_save_button = """                        {/* Save Button */}
                        <div style={{ marginTop: '24px' }}>
                          <button 
                            onClick={() => {
                              handleSaveBotSettings(selectedInstance.id);
                              if (botMode === 'qa' && faqRules.length > 0) {
                                alert(locale === 'ar' ? 'تم حفظ البوت التفاعلي بنجاح' : 'Interactive Bot saved successfully');
                              }
                            }} 
                            disabled={savingBotSettings || faqRules.length === 0}
                            className="btn btn-primary"
                            style={{ width: '100%', height: '56px', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', border: 'none', boxShadow: '0 8px 16px rgba(17, 153, 142, 0.3)' }}
                          >
                            {savingBotSettings ? '...' : <><Save size={24} /> {locale === 'ar' ? 'حفظ البوت التفاعلي' : 'Save Interactive Bot'}</>}
                          </button>
                          {faqRules.length === 0 && (
                            <p style={{ color: '#EB5757', textAlign: 'center', marginTop: '12px', fontSize: '14px', fontWeight: 600 }}>
                              {locale === 'ar' ? 'لا توجد خيارات بعد، أضف خياراً أعلاه لتتمكن من الحفظ.' : 'No options added yet. Add an option above to save.'}
                            </p>
                          )}
                        </div>"""

new_save_button = """                        {/* Save Button */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)' }}>
                          <button 
                            onClick={() => {
                              handleSaveBotSettings(selectedInstance.id);
                              if (botMode === 'qa' && faqRules.length > 0) {
                                alert(locale === 'ar' ? 'تم حفظ البوت التفاعلي بنجاح' : 'Interactive Bot saved successfully');
                              }
                            }} 
                            disabled={savingBotSettings || faqRules.length === 0}
                            style={{ 
                                width: '100%', 
                                maxWidth: '360px', 
                                height: '52px', 
                                fontSize: '16px', 
                                fontWeight: 700, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '10px', 
                                background: (savingBotSettings || faqRules.length === 0) ? '#4a5568' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                                color: 'white',
                                border: 'none', 
                                borderRadius: '14px',
                                boxShadow: (savingBotSettings || faqRules.length === 0) ? 'none' : '0 8px 16px rgba(118, 75, 162, 0.3)',
                                cursor: (savingBotSettings || faqRules.length === 0) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                          >
                            {savingBotSettings ? '...' : <><Save size={20} /> {locale === 'ar' ? '' : 'Save Interactive Bot'}</>}
                          </button>
                          {faqRules.length === 0 && (
                            <div style={{ marginTop: '12px', fontSize: '13px', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertCircle size={14} />
                              {locale === 'ar' ? 'أضف خيارًا واحدًا على الأقل لتتمكن من حفظ البوت.' : 'Add at least one option to save the bot.'}
                            </div>
                          )}
                        </div>"""

content = content.replace(old_save_button, new_save_button)

# 4. Modify Preview Container
old_preview_start = """                  {/* Right Column: Preview */}
                  <div>
                     <div style={{ background: '#E5DDD5', borderRadius: '32px', padding: '16px', border: '12px solid #222', boxShadow: '0 25px 50px rgba(0,0,0,0.2)', position: 'sticky', top: '100px', height: '650px', display: 'flex', flexDirection: 'column' }}>"""

new_preview_start = """                  {/* Preview Column */}
                  <div style={{ flex: '0 0 auto', width: '100%', maxWidth: '380px', margin: '0 auto' }}>
                     <div style={{ background: '#E5DDD5', borderRadius: '32px', padding: '16px', border: '12px solid #222', boxShadow: '0 25px 50px rgba(0,0,0,0.2)', position: 'relative', height: '650px', maxHeight: '650px', display: 'flex', flexDirection: 'column' }}>"""

content = content.replace(old_preview_start, new_preview_start)

# 5. Fix Alert inside Options Card instead of Top
# We already moved the main save button alert to a smaller gray one below the button.

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Layout tweaks applied.")
