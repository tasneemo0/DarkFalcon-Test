import os
import re

FRONTEND_DIR = r"c:\project\web_hemo\frontend"
CLIENT_TSX = os.path.join(FRONTEND_DIR, "components", "dashboard", "ClientDashboardOverview.tsx")
DASHBOARD_CSS = os.path.join(FRONTEND_DIR, "app", "dashboard", "dashboard.module.css")

# 1. Update CSS
if os.path.exists(DASHBOARD_CSS):
    with open(DASHBOARD_CSS, 'r', encoding='utf-8') as f:
        css = f.read()

    # Append new responsive rules if they don't exist
    if '.saasResponsiveTable' not in css:
        responsive_css = '''
/* --- Invoices Table Responsive (Cards) --- */
.saasTableToolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.saasSearchWrapper {
  flex: 1 1 auto;
  min-width: 250px;
}
.saasSearchInput {
  width: 100%;
}
.saasPagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.saasPaginationButtons {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  /* Fix horizontal overflow globally */
  .mainContent, .pageContent, body, html {
    max-width: 100vw !important;
    overflow-x: hidden !important;
  }
  
  /* Toolbar (Search & Export) */
  .saasTableToolbar {
    flex-direction: column !important;
    align-items: stretch !important;
  }
  .saasSearchWrapper {
    width: 100% !important;
    min-width: 100% !important;
  }
  .saasExportBtn {
    width: 100% !important;
    justify-content: center !important;
  }

  /* Pagination */
  .saasPagination {
    flex-direction: column !important;
    justify-content: center !important;
    text-align: center !important;
  }
  .saasPaginationButtons {
    width: 100% !important;
    justify-content: center !important;
  }
  
  /* Convert Table to Cards */
  .saasResponsiveTable {
    display: block !important;
    width: 100% !important;
    border: none !important;
    background: transparent !important;
  }
  .saasResponsiveTable thead {
    display: none !important;
  }
  .saasResponsiveTable tbody {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
  }
  .saasResponsiveTable tr {
    display: flex !important;
    flex-direction: column !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    border-radius: 12px !important;
    padding: 16px !important;
    background: rgba(255,255,255,0.02) !important;
  }
  .saasResponsiveTable td {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 10px 0 !important;
    border-bottom: 1px solid rgba(255,255,255,0.04) !important;
    text-align: left !important;
    font-size: 14px !important;
  }
  .saasResponsiveTable td:last-child {
    border-bottom: none !important;
  }
  .saasResponsiveTable td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-tertiary);
    text-align: right;
    margin-inline-end: 16px;
  }
}
'''
        with open(DASHBOARD_CSS, 'a', encoding='utf-8') as f:
            f.write(responsive_css)

# 2. Update TSX
if os.path.exists(CLIENT_TSX):
    with open(CLIENT_TSX, 'r', encoding='utf-8') as f:
        tsx = f.read()

    # 1. Update toolbar
    # Look for the exact div that I messed with last time (or the original one)
    # <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
    tsx = re.sub(
        r"<div style=\{\{[^}]*padding: '20px'[^}]*justifyContent: 'space-between'[^}]*\}\}>",
        r'<div className={styles.saasTableToolbar} style={{ padding: "20px", borderBottom: "1px solid var(--border-light)" }}>',
        tsx
    )
    
    # 2. Update search wrapper
    tsx = re.sub(
        r"<div style=\{\{[^}]*position: 'relative'[^}]*flex: '1 1 auto'[^}]*\}\}>",
        r'<div className={styles.saasSearchWrapper} style={{ position: "relative" }}>',
        tsx
    )
    tsx = re.sub(
        r"<div style=\{\{ position: 'relative' \}\}>",
        r'<div className={styles.saasSearchWrapper} style={{ position: "relative" }}>',
        tsx
    )
    
    # 3. Add export button class
    tsx = tsx.replace(
        '<PremiumButton variant="secondary" size="sm" icon={<Download size={14} />} iconPosition="left">',
        '<PremiumButton variant="secondary" size="sm" icon={<Download size={14} />} iconPosition="left" className={styles.saasExportBtn}>'
    )
    
    # 4. Table Class
    tsx = tsx.replace(
        '<table className={styles.saasTable}>',
        '<table className={${styles.saasTable} }>'
    )
    
    # 5. Data Labels
    tsx = tsx.replace(r'<td style={{ color: \'#64748b\' }}>#{inv.id}</td>', r'<td data-label="رقم" style={{ color: \'#64748b\' }}>#{inv.id}</td>')
    tsx = tsx.replace(r'<td style={{ fontWeight: 600 }}>{inv.plan_name || \'غير محدد\'}</td>', r'<td data-label="الباقة" style={{ fontWeight: 600 }}>{inv.plan_name || \'غير محدد\'}</td>')
    tsx = tsx.replace(r'<td>SAR {Number(inv.amount || 0).toFixed(2)}</td>', r'<td data-label="المبلغ">SAR {Number(inv.amount || 0).toFixed(2)}</td>')
    tsx = tsx.replace(r'<td>\n                  <span className={${styles.saasBadge}', r'<td data-label="الحالة">\n                  <span className={${styles.saasBadge}')
    tsx = tsx.replace(r'<td style={{ color: \'#94a3b8\' }}>\n                  {inv.created_at', r'<td data-label="التاريخ" style={{ color: \'#94a3b8\' }}>\n                  {inv.created_at')

    # 6. Pagination
    tsx = re.sub(
        r"<div style=\{\{[^}]*padding: '16px 20px'[^}]*justifyContent: 'space-between'[^}]*\}\}>",
        r'<div className={styles.saasPagination} style={{ padding: "16px 20px", borderTop: "1px solid var(--border-light)" }}>',
        tsx
    )
    tsx = tsx.replace(
        '<span style={{ fontSize: \'0.85rem\', color: \'#64748b\' }}>',
        '<span className={styles.saasPaginationInfo} style={{ fontSize: \'0.85rem\', color: \'#64748b\' }}>'
    )
    tsx = tsx.replace(
        '<div style={{ display: \'flex\', gap: \'8px\' }}>\n          <PremiumButton',
        '<div className={styles.saasPaginationButtons}>\n          <PremiumButton'
    )

    with open(CLIENT_TSX, 'w', encoding='utf-8') as f:
        f.write(tsx)

print("Applied full mobile responsive layout for Invoices Table.")
