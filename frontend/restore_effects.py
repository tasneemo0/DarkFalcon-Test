import os

FRONTEND_DIR = r"c:\project\web_hemo\frontend"
PREMIUM_CSS = os.path.join(FRONTEND_DIR, "components", "dashboard", "PremiumCard.module.css")
DASHBOARD_CSS = os.path.join(FRONTEND_DIR, "components", "dashboard", "dashboard.module.css")

# Fix PremiumCard
if os.path.exists(PREMIUM_CSS):
    with open(PREMIUM_CSS, 'r', encoding='utf-8') as f:
        premium_css = f.read()

    # Remove the display: none and box-shadow: none from the mobile override
    premium_css = premium_css.replace('box-shadow: none !important;', 'box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;')
    premium_css = premium_css.replace('.spotlight, .shineSweep {\n    display: none !important;\n  }', '/* Restored glows and shines */')
    premium_css = premium_css.replace('.spotlight, .shineSweep { display: none !important; }', '/* Restored glows and shines */')
    
    # Add touch feedback
    if '.premiumCard:active' not in premium_css:
        premium_css += '''
/* Touch Feedback */
.premiumCard:active {
  transform: scale(0.985);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
'''
    with open(PREMIUM_CSS, 'w', encoding='utf-8') as f:
        f.write(premium_css)

# Fix Dashboard Global Touch Feedback and Hover queries
if os.path.exists(DASHBOARD_CSS):
    with open(DASHBOARD_CSS, 'r', encoding='utf-8') as f:
        dash_css = f.read()
    
    # Ensure active states exist for .card, .btn, button
    if '.card:active' not in dash_css:
        dash_css += '''
/* Global Touch Feedback for Cards & Buttons */
.card:active, .statCard:active, .premiumCard:active {
  transform: scale(0.985) !important;
  transition: transform 0.15s ease !important;
}

.btn:active, button:active, .actionBtn:active {
  transform: scale(0.96) !important;
  transition: transform 0.1s ease !important;
}
'''
    with open(DASHBOARD_CSS, 'w', encoding='utf-8') as f:
        f.write(dash_css)

print("Premium and Global CSS updated for Mobile interactions.")
