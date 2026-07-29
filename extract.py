with open('c:/project/web_hemo/frontend/app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find("{activeItem === 'interactive_bot'")
end = content.find("{activeItem === 'chatbot'")

with open('c:/project/web_hemo/interactive_bot_current.txt', 'w', encoding='utf-8') as f:
    f.write(content[start:end])
