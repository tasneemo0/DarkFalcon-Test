import os

DASHBOARD_CSS = r'c:\project\web_hemo\frontend\components\dashboard\dashboard.module.css'

with open(DASHBOARD_CSS, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the overly broad grid rule
text = text.replace(
    '.statsGrid, .grid, .grid2, .grid3, .grid4 {\\n    display: grid !important;\\n    grid-template-columns: 1fr 1fr !important;\\n    gap: 12px !important;\\n  }',
    '.statsGrid, .grid4 {\\n    display: grid !important;\\n    grid-template-columns: 1fr 1fr !important;\\n    gap: 12px !important;\\n  }\\n\\n  .grid2, .grid3, .grid {\\n    display: grid !important;\\n    grid-template-columns: 1fr !important;\\n    gap: 12px !important;\\n  }'
)

with open(DASHBOARD_CSS, 'w', encoding='utf-8') as f:
    f.write(text)

print('Fixed grid columns for charts')
