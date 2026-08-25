import os
DASHBOARD_CSS = r"c:\project\web_hemo\frontend\components\dashboard\dashboard.module.css"

if os.path.exists(DASHBOARD_CSS):
    with open(DASHBOARD_CSS, 'a', encoding='utf-8') as f:
        f.write('''
/* --- Sidebar Drawer Position Fixes --- */
@media (max-width: 767px) {
  .sidebar {
    right: 0 !important;
    left: auto !important;
  }
  
  [dir="ltr"] .sidebar {
    left: 0 !important;
    right: auto !important;
  }
}
''')
print("Sidebar Drawer Position Fixed")
