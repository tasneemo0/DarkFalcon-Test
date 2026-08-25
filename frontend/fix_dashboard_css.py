import os

DASHBOARD_CSS = r"c:\project\web_hemo\frontend\components\dashboard\dashboard.module.css"

with open(DASHBOARD_CSS, 'a', encoding='utf-8') as f:
    f.write('''
/* =========================================================
   SaaS Native Mobile UI Overrides (Dense & Compact)
========================================================= */
@media (max-width: 767px) {
  /* 1. Dashboard Container & Spacing */
  .dashboardContainer {
    padding: 12px 14px !important;
    gap: 20px !important; /* Section gap */
  }

  /* 2. Page Header */
  .saasPageHeader {
    padding: 14px 16px !important;
    margin-bottom: 16px !important;
    gap: 8px !important;
    background: var(--surface) !important;
    border-radius: 14px !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    box-shadow: none !important;
  }
  
  [data-theme="light"] .saasPageHeader {
    border-color: rgba(0,0,0,0.06) !important;
  }
  
  .saasPageHeaderTitle {
    font-size: 22px !important;
  }
  
  .saasPageHeaderSub {
    font-size: 13px !important;
  }
  
  .saasPageHeaderIcon {
    width: 40px !important;
    height: 40px !important;
  }

  /* 3. Search & Filters */
  .saasSearchInput, .filterSelect {
    width: 100% !important;
    height: 44px !important;
    padding: 10px 16px !important;
  }
  
  [dir="rtl"] .saasSearchInput {
    padding: 10px 40px 10px 16px !important;
  }
  
  /* Filter Container */
  .filtersContainer {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    gap: 10px !important;
    padding: 12px !important;
    border-radius: 14px !important;
    background: var(--surface) !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
  }
  
  [data-theme="light"] .filtersContainer {
    border-color: rgba(0,0,0,0.06) !important;
  }
  
  .filtersRow {
    display: flex !important;
    flex-wrap: nowrap !important;
    gap: 8px !important;
    width: 100% !important;
  }
  
  .filtersRow > * {
    flex: 1 1 50% !important;
    min-width: 0 !important;
  }
  
  /* Refresh button */
  .refreshBtn {
    height: 44px !important;
    padding: 0 16px !important;
    width: auto !important;
  }

  /* 4. Stats Grids (2 Columns) */
  .statsGrid, .grid, .grid2, .grid3, .grid4 {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 12px !important;
  }

  /* 5. Mobile Cards Default */
  .card {
    height: auto !important;
    min-height: 0 !important;
    padding: 14px !important;
    border-radius: 14px !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    background: var(--surface) !important;
    box-shadow: none !important;
  }
  
  [data-theme="light"] .card {
    border-color: rgba(0,0,0,0.06) !important;
  }

  /* Typography tweaks */
  .cardTitle { font-size: 15px !important; }
  h1 { font-size: 24px !important; }
  h2 { font-size: 18px !important; }
  h3 { font-size: 16px !important; }
  p { font-size: 13px !important; }

  /* Disable strong Gradients globally */
  .gradientBg, .glowEffect {
    background: var(--surface) !important;
    box-shadow: none !important;
  }
  
  /* Sidebar Width */
  .sidebar {
    width: min(86vw, 320px) !important;
  }
  
  /* Chart Cards */
  .chartCard {
    height: auto !important;
    min-height: 280px !important;
  }
}
'''
    )

print("SaaS Native Mobile UI Overrides Added")
