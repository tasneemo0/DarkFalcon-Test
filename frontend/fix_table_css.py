import os

DASHBOARD_CSS = r'c:\project\web_hemo\frontend\components\dashboard\dashboard.module.css'

css_content = '''
/* =========================================================
   SaaS Responsive Tables (Compact Mobile Cards)
========================================================= */
@media (max-width: 767px) {
  .saasResponsiveTable {
    display: block !important;
    width: 100% !important;
    background: transparent !important;
    border: none !important;
  }
  
  .saasResponsiveTable thead {
    display: none !important;
  }
  
  .saasResponsiveTable tbody {
    display: flex !important;
    flex-direction: column !important;
    gap: 12px !important;
    width: 100% !important;
  }
  
  .saasResponsiveTable tr {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    padding: 14px !important;
    background: var(--surface) !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    border-radius: 12px !important;
    position: relative !important;
  }
  
  [data-theme="light"] .saasResponsiveTable tr {
    border-color: rgba(0,0,0,0.06) !important;
  }
  
  .saasResponsiveTable td {
    display: flex !important;
    flex-direction: column !important;
    padding: 0 !important;
    border: none !important;
    font-size: 13px !important;
    gap: 4px !important;
    text-align: right !important;
    white-space: normal !important;
  }
  
  [dir="ltr"] .saasResponsiveTable td {
    text-align: left !important;
  }
  
  /* Make the first two cells (usually ID and Name) span full width */
  .saasResponsiveTable td:nth-child(1),
  .saasResponsiveTable td:nth-child(2) {
    grid-column: 1 / -1 !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
    border-bottom: 1px dashed rgba(255,255,255,0.05) !important;
    padding-bottom: 8px !important;
    margin-bottom: 4px !important;
  }
  
  [data-theme="light"] .saasResponsiveTable td:nth-child(1),
  [data-theme="light"] .saasResponsiveTable td:nth-child(2) {
    border-color: rgba(0,0,0,0.05) !important;
  }
  
  /* Make the last cell (Actions) span full width */
  .saasResponsiveTable td:last-child {
    grid-column: 1 / -1 !important;
    flex-direction: row !important;
    justify-content: flex-end !important;
    align-items: center !important;
    margin-top: 8px !important;
    padding-top: 8px !important;
    border-top: 1px dashed rgba(255,255,255,0.05) !important;
  }
  
  [data-theme="light"] .saasResponsiveTable td:last-child {
    border-color: rgba(0,0,0,0.05) !important;
  }
  
  /* Hide specific empty cells or checkboxes if needed */
  .saasResponsiveTable td:has(input[type="checkbox"]) {
    display: none !important;
  }
}
'''

with open(DASHBOARD_CSS, 'a', encoding='utf-8') as f:
    f.write(css_content)

print('Added saasResponsiveTable to dashboard.module.css')
