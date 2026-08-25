import sys
import re

def main():
    file_path = "c:/project/web_hemo/frontend/app/dashboard/page.tsx"
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Fix duplicate Crown imports
    import_match = re.search(r"import\s+\{[^}]+\}\s+from\s+'lucide-react';", content)
    if import_match:
        import_str = import_match.group(0)
        # Extract the content inside { }
        inner_str_match = re.search(r"\{([^}]+)\}", import_str)
        if inner_str_match:
            inner_str = inner_str_match.group(1)
            # split by comma, strip whitespace, remove duplicates while preserving order
            items = [item.strip() for item in inner_str.split(',')]
            seen = set()
            unique_items = []
            for item in items:
                if item and item not in seen:
                    seen.add(item)
                    unique_items.append(item)
            
            new_inner_str = ", ".join(unique_items)
            new_import_str = f"import {{ {new_inner_str} }} from 'lucide-react';"
            content = content.replace(import_str, new_import_str)
            
    # 2. Fix flexShrink on ShieldCheck
    # <ShieldCheck size={18} color="#3b82f6" flexShrink={0} />
    # Replace with <div style={{ flexShrink: 0 }}><ShieldCheck size={18} color="#3b82f6" /></div>
    content = content.replace(
        '<ShieldCheck size={18} color="#3b82f6" flexShrink={0} />',
        '<div style={{ flexShrink: 0, display: "flex" }}><ShieldCheck size={18} color="#3b82f6" /></div>'
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Fixed page.tsx compilation errors!")

if __name__ == "__main__":
    main()
