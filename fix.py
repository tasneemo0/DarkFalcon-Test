import sys
import re

def fix_mojibake(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    new_lines = []
    changed = False
    for line in lines:
        if 'ط' in line or 'ظ' in line or '³' in line or 'ٹ' in line or '§' in line or '±' in line:
            # We want to replace sequences inside the string that can be decoded from cp1256.
            # But the line might contain actual English letters.
            # Let's try to decode the whole line first. If it works without throwing, and actually changes the arabic parts.
            try:
                raw = line.encode('cp1256')
                restored = raw.decode('utf-8')
                new_lines.append(restored)
                if restored != line: changed = True
            except (UnicodeEncodeError, UnicodeDecodeError):
                new_lines.append(line)
        else:
            new_lines.append(line)
            
    if changed:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        print(f"Successfully processed and fixed: {file_path}")
    else:
        print(f"No changes made to: {file_path}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        for p in sys.argv[1:]:
            fix_mojibake(p)
