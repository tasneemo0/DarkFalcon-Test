import os

def main():
    file_path = "c:/project/web_hemo/frontend/app/dashboard/page.tsx"
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the specific h4 inside the Role Cards loop
    old_h4 = "<h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{(rank.name_en && rank.name !== rank.name_en) ? `${rank.name} - ${rank.name_en}` : rank.name}</h4>"
    
    new_h4 = """<div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{rank.name}</h4>
                                {rank.name_en && rank.name !== rank.name_en && (
                                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>{rank.name_en}</span>
                                )}
                              </div>"""

    content = content.replace(old_h4, new_h4)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Successfully updated page.tsx to display English name smaller underneath in Role Cards!")

if __name__ == "__main__":
    main()
