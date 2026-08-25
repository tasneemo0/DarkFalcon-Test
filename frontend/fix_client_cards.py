import os
import re

PREMIUM_CSS = r"c:\project\web_hemo\frontend\components\dashboard\PremiumCard.module.css"

if os.path.exists(PREMIUM_CSS):
    with open(PREMIUM_CSS, 'r', encoding='utf-8') as f:
        css = f.read()

    # We need to replace the entire @media (max-width: 767px) block in PremiumCard.module.css
    # Let's find it.
    
    # We will just append an overriding @media query to the end that has higher precedence
    # by being at the end of the file.
    
    override = '''
/* --- Professional Mobile Stat Card Layout --- */
@media (max-width: 767px) {
  .premiumCard, .premiumWrapper {
    padding: 16px !important;
    min-height: 0 !important;
  }
  
  .cardContent {
    flex-direction: row !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 16px !important;
  }
  
  .cardTop {
    flex-shrink: 0;
  }
  
  .cardBottom {
    align-items: flex-start !important;
    text-align: right !important;
    gap: 2px !important;
  }
  
  .cardValue {
    font-size: 20px !important;
    line-height: 1.2 !important;
  }
  
  .cardTitle {
    font-size: 13px !important;
    margin-bottom: 2px !important;
  }
  
  .cardSubtitle {
    font-size: 11px !important;
  }
}
'''
    with open(PREMIUM_CSS, 'a', encoding='utf-8') as f:
        f.write(override)
        
print("PremiumCard mobile layout updated.")
