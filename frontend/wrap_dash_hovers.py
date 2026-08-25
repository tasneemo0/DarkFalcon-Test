import os
import re

DASHBOARD_CSS = r"c:\project\web_hemo\frontend\components\dashboard\dashboard.module.css"
if os.path.exists(DASHBOARD_CSS):
    with open(DASHBOARD_CSS, 'r', encoding='utf-8') as f:
        css = f.read()
    
    # Let's see if .card:hover exists
    if '.card:hover {' in css and '@media (hover: hover)' not in css:
        css = re.sub(r'(\.card:hover\s*{[^}]+})', r'@media (hover: hover) and (pointer: fine) {\n  \1\n}', css)
        css = re.sub(r'(\.btn:hover:not\([^)]*\)\s*{[^}]+})', r'@media (hover: hover) and (pointer: fine) {\n  \1\n}', css)
        css = re.sub(r'(\.btn:hover\s*{[^}]+})', r'@media (hover: hover) and (pointer: fine) {\n  \1\n}', css)
        
        with open(DASHBOARD_CSS, 'w', encoding='utf-8') as f:
            f.write(css)

print("dashboard hover wrapped")
