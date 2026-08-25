import os
import re

CLIENT_DASHBOARD = r"c:\project\web_hemo\frontend\components\dashboard\ClientDashboardOverview.tsx"

if os.path.exists(CLIENT_DASHBOARD):
    with open(CLIENT_DASHBOARD, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Find the header block for the invoices table
    # <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    old_header = r"<div style=\{\{ padding: '20px', borderBottom: '1px solid var\(--border-light\)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' \}\}>"
    new_header = r"<div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>"
    content = re.sub(old_header, new_header, content)
    
    # Let's also make the input take more flexible width rather than strict 200px
    old_input = r"width: '200px'"
    new_input = r"width: '100%', minWidth: '150px', maxWidth: '250px'"
    content = re.sub(old_input, new_input, content)

    # Let's fix the inner search wrapper to flex: 1
    old_search = r"<div style=\{\{ position: 'relative' \}\}>"
    new_search = r"<div style={{ position: 'relative', flex: '1 1 auto' }}>"
    content = re.sub(old_search, new_search, content)

    # Now for the PremiumCardWrapper padding issue. 
    # If the padding is 0, let's remove overflow: 'hidden' and apply border-radius instead so it doesn't clip the content
    # Wait, overflow: hidden is usually there to keep the table border inside the card's rounded corners.
    # The actual clipping happens because it's 100% width but with some negative margin?
    # No, it's just that the content inside exceeds 100% width of the card.
    
    with open(CLIENT_DASHBOARD, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Fixed ClientDashboard invoices header layout")
