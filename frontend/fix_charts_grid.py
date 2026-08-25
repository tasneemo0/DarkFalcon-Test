import os
import re

FRONTEND_DIR = r"c:\project\web_hemo\frontend"
ADMIN_DASHBOARD = os.path.join(FRONTEND_DIR, "components", "dashboard", "AdminDashboardOverview.tsx")
DASHBOARD_CSS = os.path.join(FRONTEND_DIR, "components", "dashboard", "dashboard.module.css")

# 1. Update CSS
if os.path.exists(DASHBOARD_CSS):
    with open(DASHBOARD_CSS, 'r', encoding='utf-8') as f:
        css = f.read()
    
    if '.chartGrid' not in css:
        css += '''
/* --- Professional Chart Grid Layout --- */
.chartGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 1.25rem;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 767px) {
  .chartGrid {
    grid-template-columns: 1fr;
  }
}
'''
        with open(DASHBOARD_CSS, 'w', encoding='utf-8') as f:
            f.write(css)

# 2. Update TSX
if os.path.exists(ADMIN_DASHBOARD):
    with open(ADMIN_DASHBOARD, 'r', encoding='utf-8') as f:
        tsx = f.read()

    # Replace grid2 with chartGrid for the chart rows
    # Row 2
    tsx = tsx.replace(
        '<div className={${styles.grid} }>\n        <DailyOrdersChart', 
        '<div className={styles.chartGrid}>\n        <DailyOrdersChart'
    )
    # Row 3
    tsx = tsx.replace(
        '<div className={${styles.grid} }>\n        <DailyRevenueChart', 
        '<div className={styles.chartGrid}>\n        <DailyRevenueChart'
    )
    # Row 4
    tsx = tsx.replace(
        '<div className={${styles.grid} }>\n        <AdminInvoicesStatusChart', 
        '<div className={styles.chartGrid}>\n        <AdminInvoicesStatusChart'
    )
    
    with open(ADMIN_DASHBOARD, 'w', encoding='utf-8') as f:
        f.write(tsx)

print("Applied chartGrid to AdminDashboardOverview and CSS.")
