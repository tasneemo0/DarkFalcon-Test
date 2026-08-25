import os

DASHBOARD_CSS = r"c:\project\web_hemo\frontend\components\dashboard\dashboard.module.css"

with open(DASHBOARD_CSS, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the word-break issue that crushes table columns
old_selector = ".cardTitle, .statValue, .listItemTitle, .listItemSubtitle, :global(td)"
new_selector = ".cardTitle, .statValue, .listItemTitle, .listItemSubtitle"

content = content.replace(old_selector, new_selector)

# Also ensure table cells don't wrap and crush
content = content.replace(
'''  :global(table), .table {
    display: block !important;
    width: 100% !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    white-space: nowrap !important;
  }''',
'''  :global(table), .table {
    display: block !important;
    width: 100% !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }
  :global(th), :global(td) {
    white-space: nowrap !important;
  }'''
)

with open(DASHBOARD_CSS, 'w', encoding='utf-8') as f:
    f.write(content)

print("Table word-break CSS fixed.")
