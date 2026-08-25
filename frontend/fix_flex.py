import os
import re

PREMIUM_CSS = r"c:\project\web_hemo\frontend\components\dashboard\PremiumCard.module.css"

if os.path.exists(PREMIUM_CSS):
    with open(PREMIUM_CSS, 'r', encoding='utf-8') as f:
        css = f.read()

    css = css.replace('justify-content: flex-start !important;', 'justify-content: space-between !important;')
    
    # Actually, space-between puts the icon on the far right, and the text on the far left.
    # Let's see if we can just make cardBottom take the remaining space
    if '.cardBottom {' in css:
        css = css.replace('.cardBottom {\n    align-items: flex-start !important;', '.cardBottom {\n    flex: 1;\n    align-items: flex-start !important;')
        
    with open(PREMIUM_CSS, 'w', encoding='utf-8') as f:
        f.write(css)

print("Updated flex properties.")
