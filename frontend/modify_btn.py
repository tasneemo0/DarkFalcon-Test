import re

with open('c:\\project\\web_hemo\\frontend\\components\\dashboard\\UserPlanCard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_btn_css = """        .upc-btn {
          position: relative;
          width: 100%;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: #ffffff;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }"""

new_btn_css = """        .upc-btn {
          position: relative;
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.015);
          color: #F5F7FA;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 6px 18px rgba(0,0,0,0.12);
        }

        :global([data-theme="light"]) .upc-btn,
        :root:not([data-theme="dark"]) .upc-btn {
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(15,23,42,0.10);
          color: #18181B;
          box-shadow: 0 4px 14px rgba(15,23,42,0.05);
        }"""

content = content.replace(old_btn_css, new_btn_css)

content = content.replace('className="upc-action-btn"', 'className="upc-btn"')

with open('c:\\project\\web_hemo\\frontend\\components\\dashboard\\UserPlanCard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
