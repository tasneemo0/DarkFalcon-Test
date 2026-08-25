import os
import re

FRONTEND_DIR = r"c:\project\web_hemo\frontend"
SPOTLIGHT = os.path.join(FRONTEND_DIR, "components", "dashboard", "SpotlightCard.module.css")
PREMIUM = os.path.join(FRONTEND_DIR, "components", "dashboard", "PremiumCard.module.css")

def wrap_hovers(css_text):
    # This is a simple regex that finds selectors containing :hover and wraps them.
    # To be safe, we can manually target the specific hovers for these files.
    return css_text

# Spotlight
if os.path.exists(SPOTLIGHT):
    with open(SPOTLIGHT, 'r', encoding='utf-8') as f:
        s_css = f.read()
    
    # Check if already wrapped
    if '@media (hover: hover)' not in s_css:
        # Wrap hover blocks
        s_css = re.sub(r'(\.root:hover::before\s*{[^}]+})', r'@media (hover: hover) and (pointer: fine) {\n  \1\n}', s_css)
        s_css = re.sub(r'(\.root:hover::after\s*{[^}]+})', r'@media (hover: hover) and (pointer: fine) {\n  \1\n}', s_css)
        s_css = re.sub(r'(\.root:hover\s*{[^}]+})', r'@media (hover: hover) and (pointer: fine) {\n  \1\n}', s_css)
        with open(SPOTLIGHT, 'w', encoding='utf-8') as f:
            f.write(s_css)

# Premium
if os.path.exists(PREMIUM):
    with open(PREMIUM, 'r', encoding='utf-8') as f:
        p_css = f.read()
    
    if '@media (hover: hover)' not in p_css:
        p_css = re.sub(r'(\.premiumCard:hover\s*{[^}]+})', r'@media (hover: hover) and (pointer: fine) {\n  \1\n}', p_css)
        with open(PREMIUM, 'w', encoding='utf-8') as f:
            f.write(p_css)

print("Wrapped hovers in media queries.")
