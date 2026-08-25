import os

FRONTEND_DIR = r"c:\project\web_hemo\frontend"
SC_CSS = os.path.join(FRONTEND_DIR, "components", "dashboard", "support", "sc.module.css")
CHAT_CSS = os.path.join(FRONTEND_DIR, "components", "dashboard", "support", "chat.module.css")

# Patch sc.module.css for Mobile Flow Support Center
if os.path.exists(SC_CSS):
    with open(SC_CSS, 'r', encoding='utf-8') as f:
        sc_css = f.read()
    
    sc_css_fixes = '''
/* --- Support Center Mobile Layout --- */
@media (max-width: 767px) {
    /* Main wrapper to act as full screen on mobile when chat is open */
    .page, .chatWrapper {
        min-height: 100dvh !important;
        padding-bottom: env(safe-area-inset-bottom, 20px) !important;
    }
}
'''
    if "/* --- Support Center Mobile Layout --- */" not in sc_css:
        with open(SC_CSS, 'a', encoding='utf-8') as f:
            f.write(sc_css_fixes)

# Patch chat.module.css for Chat Mobile Layout
if os.path.exists(CHAT_CSS):
    with open(CHAT_CSS, 'r', encoding='utf-8') as f:
        chat_css = f.read()
        
    chat_css_fixes = '''
/* --- Chat Mobile Layout Override --- */
@media (max-width: 767px) {
    .chatPanel, .chatContainer, .wrapper {
        position: relative !important;
        height: calc(100dvh - 120px) !important; 
        max-height: calc(100dvh - 120px) !important;
        width: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        border-radius: 0 !important;
        border: none !important;
    }
    
    .chatBody, .messagesList {
        flex: 1 1 auto !important;
        overflow-y: auto !important;
        padding-bottom: 20px !important;
    }
    
    .chatFooter, .composer {
        position: sticky !important;
        bottom: 0 !important;
        background: inherit;
        padding-bottom: env(safe-area-inset-bottom, 16px) !important;
        z-index: 10;
        border-top: 1px solid var(--border-light);
    }
    
    .messageBubble, .bubble {
        max-width: 85% !important;
        word-break: break-word !important;
    }
    
    .detailsPane, .ticketDetailsDrawer {
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        top: auto !important;
        height: 80dvh !important;
        border-radius: 20px 20px 0 0 !important;
        z-index: 1000 !important;
        transform: translateY(100%);
        transition: transform 0.3s ease-out;
    }
    
    .detailsPane.open, .ticketDetailsDrawer.open {
        transform: translateY(0);
    }
}
'''
    if "/* --- Chat Mobile Layout Override --- */" not in chat_css:
        with open(CHAT_CSS, 'a', encoding='utf-8') as f:
            f.write(chat_css_fixes)

print("Support and Chat CSS Patched")
