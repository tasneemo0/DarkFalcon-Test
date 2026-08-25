import re

with open('c:\\project\\web_hemo\\frontend\\temp_card.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace style block
new_style = """
        @keyframes upcEntrance {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes upcFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes upcLightSweep {
          0% { left: -100%; opacity: 0; }
          15% { opacity: 1; }
          30% { left: 200%; opacity: 0; }
          100% { left: 200%; opacity: 0; }
        }
        @keyframes currentPlanPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(39,194,129,0.3); }
          50% { box-shadow: 0 0 0 10px rgba(39,194,129,0); }
        }
        
        .user-plan-card {
          animation: upcEntrance 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 0.1}s both;
          will-change: transform, opacity;
          position: relative;
          perspective: 1000px;
        }

        .user-plan-card-inner {
          position: relative;
          border-radius: 32px;
          background: var(--surface);
          border: 1px solid var(--border-light);
          padding: 40px 28px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 12px 32px rgba(0,0,0,0.03);
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease, border-color 0.4s ease;
        }

        :global([data-theme="dark"]) .user-plan-card-inner {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 16px 40px rgba(0,0,0,0.25);
        }

        .user-plan-card:hover .user-plan-card-inner {
          transform: translateY(-8px);
          border-color: ${accentColor}60;
          box-shadow: 0 24px 60px rgba(0,0,0,0.06), 0 0 24px ${accentColor}15;
        }

        :global([data-theme="dark"]) .user-plan-card:hover .user-plan-card-inner {
          box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 30px ${accentColor}20;
        }

        .upc-floating-wrapper {
          animation: upcFloat 6s ease-in-out infinite;
        }

        .upc-sweep {
          position: absolute;
          top: 0; bottom: 0; width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          transform: skewX(-25deg);
          animation: upcLightSweep 8s infinite linear;
          pointer-events: none;
        }
        
        .upc-btn {
          position: relative;
          width: 100%;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid var(--border-light);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        :global([data-theme="dark"]) .upc-btn {
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.06);
        }

        .upc-btn:hover:not(:disabled) {
          border-color: var(--hover-border);
          background: var(--hover-bg);
          color: #fff;
          box-shadow: var(--hover-shadow);
        }

        .upc-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: var(--bg-tertiary);
        }

        .upc-btn-arrow {
          transition: transform 0.3s ease;
        }
        .upc-btn:hover:not(:disabled) .upc-btn-arrow {
          transform: translateX(${isAr ? '-4px' : '4px'});
        }
"""

content = re.sub(r'@keyframes upcEntrance \{.*?\}\s*</style>', new_style + '\n      }</style>', content, flags=re.DOTALL)

# Update hardcoded text colors to use CSS variables
content = content.replace("color: '#ffffff'", "color: 'var(--text-primary)'")
content = content.replace("color: 'rgba(255,255,255,0.4)'", "color: 'var(--text-tertiary)'")
content = content.replace("color: feat.active ? '#fff' : '#94A3B8'", "color: feat.active ? 'var(--text-primary)' : 'var(--text-secondary)'")
content = content.replace("background: 'rgba(255,255,255,0.05)'", "background: 'var(--bg-tertiary)'")
content = content.replace("color: 'rgba(255,255,255,0.7)'", "color: 'var(--text-secondary)'")

with open('c:\\project\\web_hemo\\frontend\\temp_card.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
