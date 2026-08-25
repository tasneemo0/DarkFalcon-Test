import os
import re

FILES = [
    r'c:\project\web_hemo\frontend\components\dashboard\AdminUsersManager.tsx',
    r'c:\project\web_hemo\frontend\components\dashboard\AdminSessionsManager.tsx',
    r'c:\project\web_hemo\frontend\components\dashboard\AdminPaymentsManager.tsx',
    r'c:\project\web_hemo\frontend\components\dashboard\UserProfileDashboard.tsx'
]

for file in FILES:
    if not os.path.exists(file): continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to add className={styles.saasResponsiveTable} to <table> tags if not already there
    # This matches <table ...> where it doesn't already have saasResponsiveTable
    if 'saasResponsiveTable' not in content:
        # Check if styles is imported, if not we might need to add it or use a global string
        if 'import styles from' in content or 'import styles' in content:
            new_content = re.sub(r'<table([^>]*?)>', r'<table className={styles.saasResponsiveTable} \1>', content)
        else:
            new_content = re.sub(r'<table([^>]*?)>', r'<table className="saasResponsiveTable" \1>', content)
        
        if new_content != content:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Updated {os.path.basename(file)}')

