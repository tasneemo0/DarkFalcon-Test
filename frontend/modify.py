import os

file_path = 'components/dashboard/AdminRolesManager.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the response parsing logic
target_parse = '''        if (res && !res.error && res.results) {
          setUserSearchResults(res.results);
        } else {
          setUserSearchResults([]);
        }'''
new_parse = '''        if (res && !res.error) {
          if (Array.isArray(res)) {
            setUserSearchResults(res);
          } else if (res.results && Array.isArray(res.results)) {
            setUserSearchResults(res.results);
          } else if (res.users && Array.isArray(res.users)) {
            setUserSearchResults(res.users);
          } else {
            setUserSearchResults([]);
          }
        } else {
          setUserSearchResults([]);
        }'''

if target_parse in text:
    text = text.replace(target_parse, new_parse)
else:
  
    print('Target parse not found')

# Add Skeleton Loader
target_loader = '                  <div style={{ padding: \'32px\', textAlign: \'center\' }}><Loader2 className="spin" size={24} color="var(--primary)"/></div>'
new_loader = '''                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.7, animation: 'pulse 1.5s infinite' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--border-light)' }}></div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ width: '40%', height: '14px', background: 'var(--border-light)', borderRadius: '4px' }}></div>
                          <div style={{ width: '60%', height: '12px', background: 'var(--border-light)', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>'''

if target_loader in text:
    text = text.replace(target_loader, new_loader)
else:
    print('Target loader not found')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Updated AdminRolesManager.tsx')
