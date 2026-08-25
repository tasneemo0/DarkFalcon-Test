import os

FRONTEND_DIR = r"c:\project\web_hemo\frontend"
DASHBOARD_CSS = os.path.join(FRONTEND_DIR, "components", "dashboard", "dashboard.module.css")

if os.path.exists(DASHBOARD_CSS):
    with open(DASHBOARD_CSS, 'a', encoding='utf-8') as f:
        f.write('''
/* --- Catch-all Table Fix --- */
@media (max-width: 767px) {
  table, .table {
    display: block !important;
    width: 100% !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    white-space: nowrap !important;
  }
  
  /* Prevent Modal buttons from overflowing */
  .modalFooter, .modalActions {
    flex-wrap: wrap !important;
  }
  
  .modalFooter button, .modalActions button {
    flex: 1 1 auto !important;
    min-width: 120px !important;
  }
}
''')
print("Added Catch-all CSS")
