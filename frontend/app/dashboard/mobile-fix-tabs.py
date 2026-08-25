import re

with open(r'frontend\app\dashboard\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Tabs Container
content = content.replace(
    "style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}",
    "className={styles.playgroundTabs}"
)

# Fix Textarea
content = content.replace(
    "style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px' }}",
    "className={`${styles.playgroundCodeBlock} ${styles.jsonBox}`}"
)

with open(r'frontend\app\dashboard\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open(r'frontend\app\dashboard\dashboard.module.css', 'a', encoding='utf-8') as f:
    f.write('''
.jsonBox {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  direction: ltr;
  text-align: left;
  white-space: pre;
}
''')

print('Updated page.tsx and added jsonBox')
