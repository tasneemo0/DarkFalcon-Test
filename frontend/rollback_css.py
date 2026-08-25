import os
import re

CSS_PATH = r"c:\project\web_hemo\frontend\app\dashboard\dashboard.module.css"

if os.path.exists(CSS_PATH):
    with open(CSS_PATH, 'r', encoding='utf-8') as f:
        css = f.read()
        
    matches = list(re.finditer(r'@media\s*\(\s*max-width\s*:\s*768px\s*\)\s*\{', css))
    for m in reversed(matches):
        start = m.start()
        brace_count = 0
        in_block = False
        end = -1
        for i in range(start, len(css)):
            if css[i] == '{':
                brace_count += 1
                in_block = True
            elif css[i] == '}':
                brace_count -= 1
                if in_block and brace_count == 0:
                    end = i + 1
                    break
        
        if end != -1:
            block = css[start:end]
            if "Fix horizontal overflow globally" in block or ".saasResponsiveTable" in block:
                print("Removing block at", start)
                css = css[:start] + css[end:]
                
    with open(CSS_PATH, 'w', encoding='utf-8') as f:
        f.write(css)
        
    print("Rolled back mobile CSS blocks in dashboard.module.css.")
