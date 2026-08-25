import os

PREMIUM_CSS = r"c:\project\web_hemo\frontend\components\dashboard\PremiumCard.module.css"

with open(PREMIUM_CSS, 'a', encoding='utf-8') as f:
    f.write('''
/* =========================================================
   Mobile Overrides (Compact & Dense)
========================================================= */
@media (max-width: 767px) {
  .premiumCard, .premiumWrapper {
    padding: 12px 14px !important;
    height: auto !important;
    min-height: 90px !important;
    border-radius: 12px !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    background: var(--surface) !important;
    box-shadow: none !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
  }
  
  [data-theme="light"] .premiumCard, [data-theme="light"] .premiumWrapper {
    border-color: rgba(0,0,0,0.06) !important;
  }
  
  /* Remove glows, spotlights and shines on mobile to keep it clean */
  .spotlight, .shineSweep {
    display: none !important;
  }
  
  /* Optimize content layout */
  .cardContent {
    gap: 8px !important;
  }
  
  .cardTop {
    align-items: center !important;
  }
  
  .iconWrap {
    width: 32px !important;
    height: 32px !important;
    border-radius: 8px !important;
  }
  
  .iconWrap svg {
    width: 16px !important;
    height: 16px !important;
  }
  
  .cardValue {
    font-size: 20px !important;
  }
  
  .cardTitle {
    font-size: 12px !important;
  }
  
  .cardSubtitle {
    font-size: 11px !important;
  }
}
'''
    )

print("PremiumCard Mobile CSS Updated")
