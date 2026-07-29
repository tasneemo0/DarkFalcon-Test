import re

file_path = r"c:\project\web_hemo\frontend\app\dashboard\page.tsx"
backup_path = r"c:\project\web_hemo\frontend\app\dashboard\page-current-backup.tsx.bak"

with open(file_path, "r", encoding="utf-8") as f:
    current_content = f.read()

with open(backup_path, "r", encoding="utf-8") as f:
    backup_content = f.read()

# 1. Add interactive_bot to sidebarItems
if "'interactive_bot'" not in current_content:
    current_content = current_content.replace(
        "{ key: 'aiRules', icon: 'bot', labelAr: 'المجيب التلقائي الذكي', labelEn: 'Smart AI & FAQ' },",
        "{ key: 'aiRules', icon: 'bot', labelAr: 'المجيب التلقائي الذكي', labelEn: 'Smart AI & FAQ' },\n  { key: 'interactive_bot', icon: 'message', labelAr: 'البوت التفاعلي', labelEn: 'Interactive Bot' },"
    )

# 2. Extract original aiRules block from backup
start_str = "{activeItem === 'aiRules' && !isAdminMode && ("
end_str = "{activeItem === 'chatbot' && !isAdminMode && ("

start_idx_bak = backup_content.find(start_str)
end_idx_bak = backup_content.find(end_str)

original_airules = backup_content[start_idx_bak:end_idx_bak]

# Remove the Q&A radio button and section from original_airules
# The radio button:
original_airules = re.sub(
    r"<label[^>]*>\s*<input[^>]*value=\"qa\"[^>]*/>.*?</label>", 
    "", 
    original_airules, 
    flags=re.DOTALL
)

# We can also just remove the {botMode === 'qa' && (...)} part, but it's simpler to just replace botMode === 'qa' with something impossible like botMode === 'IMPOSSIBLE'
original_airules = original_airules.replace("botMode === 'qa'", "botMode === 'IMPOSSIBLE'")


# 3. Rename current aiRules block (which is actually Interactive Bot) to interactive_bot
start_idx_cur = current_content.find(start_str)
end_idx_cur = current_content.find(end_str)

current_interactive_bot = current_content[start_idx_cur:end_idx_cur]
current_interactive_bot = current_interactive_bot.replace("{activeItem === 'aiRules' && !isAdminMode && (", "{activeItem === 'interactive_bot' && !isAdminMode && (", 1)

# 4. Inject both blocks back into current_content
new_combined_blocks = original_airules + "\n          " + current_interactive_bot

current_content = current_content[:start_idx_cur] + new_combined_blocks + current_content[end_idx_cur:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(current_content)

print("Done separating")
