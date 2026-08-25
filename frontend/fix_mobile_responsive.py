import os

FRONTEND_DIR = r"c:\project\web_hemo\frontend"
GLOBALS_CSS = os.path.join(FRONTEND_DIR, "app", "globals.css")
DASHBOARD_CSS = os.path.join(FRONTEND_DIR, "components", "dashboard", "dashboard.module.css")
PAGE_TSX = os.path.join(FRONTEND_DIR, "app", "dashboard", "page.tsx")

# 1. globals.css modifications
with open(GLOBALS_CSS, 'r', encoding='utf-8') as f:
    globals_content = f.read()

# Remove the general overflow-x: hidden hack if it exists
globals_content = globals_content.replace(
    "overflow-x: hidden;\n  /* Prevent horizontal scroll globally */",
    "/* Removed global overflow-x: hidden to fix underlying layout issues */"
)
globals_content = globals_content.replace("overflow-x: hidden;", "/* overflow-x: hidden; removed */")

# Add Safe Area variables
if "env(safe-area-inset-bottom)" not in globals_content:
    globals_content += "\n/* ===== Safe Area & Mobile Support ===== */\n"
    globals_content += ":root {\n  --sab: env(safe-area-inset-bottom, 20px);\n  --sat: env(safe-area-inset-top, 0px);\n}\n"

with open(GLOBALS_CSS, 'w', encoding='utf-8') as f:
    f.write(globals_content)

# 2. dashboard.module.css modifications
with open(DASHBOARD_CSS, 'r', encoding='utf-8') as f:
    dash_css = f.read()

dash_css_fixes = '''
/* =========================================================
   Mobile Responsive Overrides
========================================================= */
@media (max-width: 767px) {
  /* Prevent word break issues on long IDs, Emails */
  .cardTitle, .statValue, .listItemTitle, .listItemSubtitle, td {
    overflow-wrap: anywhere;
    word-break: break-word;
    white-space: normal;
  }

  /* Ensure grids are single column on mobile */
  .grid, .grid2, .grid3, .grid4 {
    grid-template-columns: 1fr !important;
    gap: 1rem !important;
  }

  .card {
    padding: 1rem !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .dashboardContainer {
    padding: 1rem 12px !important;
    gap: 1rem !important;
  }

  /* Form Elements */
  .input-group, form > div {
    display: flex;
    flex-direction: column !important;
    width: 100% !important;
  }
  
  .btn {
    min-height: 48px !important;
    flex-wrap: wrap !important;
    width: 100% !important;
    justify-content: center !important;
  }
  
  /* Inline buttons that shouldn't be 100% width */
  .listItem .btn, .btn.w-auto {
    width: auto !important;
  }
  
  /* Tables */
  .tableWrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-bottom: 1rem;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
  }
  
  table.table {
    min-width: 600px; /* Ensure content doesn't crush */
  }

  /* Modals */
  .modalContent, [role="dialog"], dialog {
    width: calc(100% - 24px) !important;
    max-width: 100% !important;
    margin: 0 12px !important;
    max-height: calc(100dvh - 24px) !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  /* Scrollable Modal Body */
  .modalBody, .scrollableBody {
    flex: 1 1 auto;
    overflow-y: auto;
    padding-bottom: var(--sab);
  }

  /* Sidebar Drawer */
  .sidebar {
    position: fixed !important;
    top: 0 !important;
    bottom: 0 !important;
    height: 100dvh !important;
    z-index: 1000 !important;
    transform: translateX(100%) !important;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    width: 280px !important;
    max-width: 80vw !important;
  }

  [dir="ltr"] .sidebar {
    transform: translateX(-100%) !important;
  }

  .sidebarOpen {
    transform: translateX(0) !important;
  }
  
  [dir="ltr"] .sidebarOpen {
    transform: translateX(0) !important;
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
    backdrop-filter: blur(4px);
  }

  .overlayVisible {
    opacity: 1;
    pointer-events: auto;
  }
  
  /* Header adjustments */
  .topBar {
    padding: 0.75rem 12px !important;
    gap: 0.5rem !important;
  }
  
  .mobileMenuBtn {
    display: flex !important;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
  }
}

@media (min-width: 768px) {
  .mobileMenuBtn {
    display: none !important;
  }
  
  .sidebar {
    transform: translateX(0) !important;
  }
}
'''

if "Mobile Responsive Overrides" not in dash_css:
    with open(DASHBOARD_CSS, 'a', encoding='utf-8') as f:
        f.write(dash_css_fixes)

print("CSS Fixed")
