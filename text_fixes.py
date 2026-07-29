import re

file_path = r"c:\project\web_hemo\frontend\app\dashboard\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix Device Label (yy - متصل / yy - غير متصل)
content = content.replace(
    "{inst.instance_name} ({inst.phone_number || 'Disconnected'}) - {inst.status === 'connected' ? '(متصل)' : '(غير متصل)'}",
    "{inst.instance_name} - {inst.status === 'connected' ? 'متصل' : 'غير متصل'}"
)
content = content.replace(
    "{inst.instance_name} ({inst.phone_number || 'Disconnected'}) - {inst.status === 'connected' ? '✅ متصل' : '❌ غير متصل'}",
    "{inst.instance_name} - {inst.status === 'connected' ? 'متصل' : 'غير متصل'}"
)

# 2. Add message when no device is selected
message_to_add = """
                    {!selectedInstance && (
                      <div style={{ background: 'var(--surface)', border: '1px dashed var(--border-light)', padding: '30px', borderRadius: '12px', textAlign: 'center', marginTop: '12px' }}>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '15px', fontWeight: 600, margin: 0 }}>
                          {locale === 'ar' ? 'يرجى اختيار جهاز واتساب أولًا لتفعيل وإعداد البوت التفاعلي.' : 'Please select a WhatsApp device first to enable and configure the interactive bot.'}
                        </p>
                      </div>
                    )}
"""
if "يرجى اختيار جهاز واتساب أولًا" not in content:
    # Insert after device selector div
    content = content.replace(
        "Warning: Device is disconnected. Bot will not work until you connect it.'}\n                         </div>\n                      )}\n                    </div>",
        "Warning: Device is disconnected. Bot will not work until you connect it.'}\n                         </div>\n                      )}\n                    </div>" + message_to_add
    )
    # Also handle the original text just in case
    content = content.replace(
        "Device disconnected, the bot will not work until the device is connected.'}\n                         </div>\n                      )}\n                    </div>",
        "Device disconnected, the bot will not work until the device is connected.'}\n                         </div>\n                      )}\n                    </div>" + message_to_add
    )

# 3. Replace text terms
# WhatsApp Device => الجهاز المرتبط
content = content.replace("'الجهاز المربوط (WhatsApp Device)'", "'الجهاز المرتبط'")
content = content.replace("'الجهاز المربوط (WhatsApp Device)' : 'Connected WhatsApp Device'", "'الجهاز المرتبط' : 'Connected WhatsApp Device'")

# Preview => المعاينة المباشرة
content = content.replace("'المعاينة المباشرة (Preview)'", "'المعاينة المباشرة'")
content = content.replace("'المعاينة المباشرة (Preview)' : 'Live Preview'", "'المعاينة المباشرة' : 'Live Preview'")

# Footer => نص التذييل
content = content.replace("'نص الذيل (Footer) اختياري:'", "'نص التذييل (اختياري):'")
content = content.replace("'نص الذيل اختياري:'", "'نص التذييل (اختياري):'")

# payload => محتوى الرد
content = content.replace("'محتوى الرد / payload:'", "'محتوى الرد:'")
content = content.replace("'محتوى الرد / الرابط / Webhook Payload:'", "'محتوى الرد:'")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Text replacements applied.")
