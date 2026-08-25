import os
import re

PAGE_TSX = r"c:\project\web_hemo\frontend\app\dashboard\page.tsx"

if os.path.exists(PAGE_TSX):
    with open(PAGE_TSX, 'r', encoding='utf-8') as f:
        tsx = f.read()

    # The issue is that the closing tag for the label is a div instead of a label,
    # and the span was never moved to the right place!
    
    # Let's find the bad block exactly
    # <label className="flex items-center justify-between cursor-pointer flex-row-reverse">
    #   <input type="checkbox" style={{ width: '18px', height: '18px', flexShrink: 0, margin: '0 8px' }} checked={twoStepEnabled} onChange={(e) => { setTwoStepEnabled(e.target.checked); handleToggleSecurity('2step', e.target.checked); }} />
    # </div>
    
    # We need to replace the </div> with a span and </label>
    
    pattern = r'(<label className="flex items-center justify-between cursor-pointer flex-row-reverse">\s*<input type="checkbox"[^>]*twoStepEnabled[^>]*/>\s*)</div>'
    
    replacement = r"\1<span style={{ fontSize: '14px', fontWeight: 600 }}>{locale === 'ar' ? 'تفعيل تسجيل الدخول بخطوتين' : 'Enable Two-step passcode'}</span>\n                    </label>"
    
    new_tsx = re.sub(pattern, replacement, tsx)
    
    if new_tsx != tsx:
        with open(PAGE_TSX, 'w', encoding='utf-8') as f:
            f.write(new_tsx)
        print("Fixed mismatched label tag")
    else:
        print("Pattern not found")

