import os

DASHBOARD_CSS = r"c:\project\web_hemo\frontend\components\dashboard\dashboard.module.css"

with open(DASHBOARD_CSS, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix CSS Module pure selector errors
content = content.replace('[role="dialog"], dialog', ':global([role="dialog"]), :global(dialog)')
content = content.replace('table.table', ':global(table).table')
content = content.replace('table, .table', ':global(table), .table')
content = content.replace('td {', ':global(td) {')
content = content.replace('.cardTitle, .statValue, .listItemTitle, .listItemSubtitle, td', '.cardTitle, .statValue, .listItemTitle, .listItemSubtitle, :global(td)')
content = content.replace('form > div', ':global(form) > div')

with open(DASHBOARD_CSS, 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS selectors fixed.")
