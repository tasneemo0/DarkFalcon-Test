import os

CLIENT_TSX = r"c:\project\web_hemo\frontend\components\dashboard\ClientDashboardOverview.tsx"

if os.path.exists(CLIENT_TSX):
    with open(CLIENT_TSX, 'r', encoding='utf-8') as f:
        tsx = f.read()

    # The bad output from powershell interpolation
    bad_str = "<table className={${styles.saasTable} }>"
    
    # We missed the saasResponsiveTable because powershell evaluated it weirdly.
    # We want it to be: <table className={`${styles.saasTable} ${styles.saasResponsiveTable}`}>
    good_str = "<table className={`${styles.saasTable} ${styles.saasResponsiveTable}`}>"
    
    tsx = tsx.replace(bad_str, good_str)
    
    # Also check if there's any other bad interpolations we messed up
    # In my previous script I did:
    # tsx.replace(r'<td style={{ color: \'#64748b\' }}>#{inv.id}</td>', ...)
    # But wait, did I use backticks elsewhere?
    # I used `${styles.saasBadge}` which powershell would have swallowed the backtick!
    
    # Let's check for any bad badge spans
    # <td data-label="الحالة">\n                  <span className={${styles.saasBadge}
    bad_badge = r'<td data-label="الحالة">\n                  <span className={${styles.saasBadge}'
    good_badge = r'<td data-label="الحالة">\n                  <span className={`${styles.saasBadge}'
    tsx = tsx.replace(bad_badge, good_badge)

    with open(CLIENT_TSX, 'w', encoding='utf-8') as f:
        f.write(tsx)
    print("Fixed JSX syntax errors")
