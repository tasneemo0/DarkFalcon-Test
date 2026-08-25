import re

file_path = "components/dashboard/AdminPaymentsManager.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "color: '#fff'": "color: 'var(--text-primary)'",
    "color: '#94a3b8'": "color: 'var(--text-secondary)'",
    "color: '#e2e8f0'": "color: 'var(--text-primary)'",
    "color: '#64748b'": "color: 'var(--text-tertiary)'",
    "background: 'rgba(255,255,255,0.05)'": "background: 'var(--surface-hover)'",
    "background: 'rgba(255,255,255,0.03)'": "background: 'var(--surface-hover)'",
    "border: '1px solid rgba(255,255,255,0.1)'": "border: '1px solid var(--border)'",
    "background: '#f97316'": "background: 'var(--primary)'",
    "background: '#0B0E14'": "background: 'var(--surface)'",
    "boxShadow: '0 8px 20px rgba(249, 115, 22, 0.2)'": "boxShadow: 'var(--shadow-md)'",
    "color: '#000'": "color: 'var(--text-primary)'",
    "background: '#10b981'": "background: 'var(--success)'",
    "background: '#ef4444'": "background: 'var(--error)'",
    "color: '#10b981'": "color: 'var(--success)'",
    "color: '#ef4444'": "color: 'var(--error)'",
    "color: '#f59e0b'": "color: 'var(--warning)'"
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Special cases
content = re.sub(r"color:\s*`#\$\{color\}`", "color: 'var(--primary)'", content)
content = re.sub(r"background:\s*`rgba\(\$\{hexToRgb\(color\)\},\s*0\.1\)`", "background: 'var(--primary-lighter)'", content)
content = re.sub(r"border:\s*`1px solid rgba\(\$\{hexToRgb\(color\)\},\s*0\.2\)`", "border: '1px solid var(--border-focus)'", content)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
