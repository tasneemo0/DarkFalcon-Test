import re

content = open(r'frontend\app\dashboard\page.tsx', 'r', encoding='utf-8').read()

# Fix the broken className
# It currently looks like: className={${styles.table} ${styles.mobileCardsTable}}
# or className={${styles.table} }
content = content.replace(
    'className={${styles.table} ${styles.mobileCardsTable}}',
    'className={`${styles.table} ${styles.mobileCardsTable}`}'
)
content = content.replace(
    'className={${styles.table} }',
    'className={`${styles.table} ${styles.mobileCardsTable}`}'
)

open(r'frontend\app\dashboard\page.tsx', 'w', encoding='utf-8').write(content)
print('Fixed syntax error')
