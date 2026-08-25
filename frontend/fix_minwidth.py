with open('components/dashboard/AdminUsersManager.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("minWidth: '1700px'", "minWidth: '1000px'")
text = text.replace('minWidth: "1700px"', 'minWidth: "1000px"')

with open('components/dashboard/AdminUsersManager.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Reverted minWidth to 1000px')
