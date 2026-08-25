import os
import re

DASHBOARD_CSS = r"c:\project\web_hemo\frontend\components\dashboard\dashboard.module.css"
if os.path.exists(DASHBOARD_CSS):
    with open(DASHBOARD_CSS, 'r', encoding='utf-8') as f:
        css = f.read()

    # Find the problematic rule and fix it
    old_rule = r'\.statsGrid, \.grid, \.grid2, \.grid3, \.grid4 \{\s*display: grid !important;\s*grid-template-columns: 1fr 1fr !important;'
    new_rule = r'.statsGrid, .grid4 {\n    display: grid !important;\n    grid-template-columns: 1fr 1fr !important;'
    
    css = re.sub(old_rule, new_rule, css)
    
    with open(DASHBOARD_CSS, 'w', encoding='utf-8') as f:
        f.write(css)
    print("Fixed grid overrides.")
