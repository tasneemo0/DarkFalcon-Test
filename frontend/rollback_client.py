import os
import re

CLIENT_TSX = r"c:\project\web_hemo\frontend\components\dashboard\ClientDashboardOverview.tsx"

if os.path.exists(CLIENT_TSX):
    with open(CLIENT_TSX, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Revert saasResponsiveTable
    content = content.replace(
        '<div className={styles.saasResponsiveTable}>',
        '<div style={{ overflowX: \'auto\', background: \'rgba(0,0,0,0.2)\', borderRadius: \'12px\', border: \'1px solid rgba(255,255,255,0.05)\' }}>'
    )
    
    # Revert search toolbar wrappers if any
    content = content.replace('className={styles.saasTableToolbar} ', '')
    content = content.replace('className={styles.saasSearchWrapper} ', '')
    content = content.replace('className={styles.saasPagination} ', '')
    
    with open(CLIENT_TSX, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Rolled back ClientDashboardOverview.tsx mobile changes.")
