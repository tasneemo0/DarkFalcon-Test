import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
desktop_path = "C:\\Users\\eg\\Desktop"

print("Subdirectories of Desktop:")
for item in os.listdir(desktop_path):
    full_path = os.path.join(desktop_path, item)
    if os.path.isdir(full_path):
        print(f"Name: {item} | UTF-8: {item.encode('utf-8')}")
