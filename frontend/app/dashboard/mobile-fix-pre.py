import re

with open(r'frontend\app\dashboard\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', fontSize: '12px', overflow: 'auto', maxHeight: '180px', fontFamily: 'monospace', direction: 'ltr' }}",
    "className={styles.playgroundCodeBlock}"
)

content = content.replace(
    "style={{ background: 'black', color: '#27ae60', padding: '12px', borderRadius: '6px', fontSize: '12px', overflow: 'auto', minHeight: '130px', fontFamily: 'monospace', direction: 'ltr' }}",
    "className={`${styles.playgroundCodeBlock} ${styles.apiResponseBlock}`}"
)

with open(r'frontend\app\dashboard\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open(r'frontend\app\dashboard\dashboard.module.css', 'a', encoding='utf-8') as f:
    f.write('''
.apiResponseBlock {
  background: black !important;
  color: #27ae60 !important;
  min-height: 130px;
}
''')
print('Fixed pre blocks')
