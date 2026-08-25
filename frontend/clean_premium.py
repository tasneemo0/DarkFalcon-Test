import os
import re

PREMIUM_CSS = r"c:\project\web_hemo\frontend\components\dashboard\PremiumCard.module.css"

if os.path.exists(PREMIUM_CSS):
    with open(PREMIUM_CSS, 'r', encoding='utf-8') as f:
        css = f.read()

    # Let's clean up the previous bad mobile override which forced column and weird alignments
    bad_rule1 = r'\.premiumCard, \.premiumWrapper \{\s*display: flex !important;\s*flex-direction: column !important;\s*justify-content: center !important;\s*\}'
    css = re.sub(bad_rule1, '.premiumCard, .premiumWrapper {\n  display: flex !important;\n}', css)
    
    # Let's refine the row-based layout to make sure it's perfect
    # We already appended our /* --- Professional Mobile Stat Card Layout --- */ at the end.
    
    with open(PREMIUM_CSS, 'w', encoding='utf-8') as f:
        f.write(css)

print("Cleaned up PremiumCard mobile overrides.")
