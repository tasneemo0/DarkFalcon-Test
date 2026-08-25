import re

with open('c:\\project\\web_hemo\\frontend\\components\\dashboard\\UserPlanCard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

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
        @keyframes bestSellerGlowPulse {
          0%, 100% { box-shadow: 0 0 10px ${accentColor}40; transform: translateY(0) scale(1); }
          50% { box-shadow: 0 0 25px ${accentColor}90; transform: translateY(-4px) scale(1.05); }
        }
        @keyframes currentPlanPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(39,194,129,0.5); }
          50% { box-shadow: 0 0 0 12px rgba(39,194,129,0); }
        }
        @keyframes btnRipple {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }
        
        .user-plan-card {
          animation: upcEntrance 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 0.1}s both;
          will-change: transform, opacity;
          position: relative;
          perspective: 1000px;
        }

        .user-plan-card-inner {
          position: relative;
          border-radius: 24px;
          background: linear-gradient(160deg, rgba(20,20,30,0.8) 0%, rgba(12,12,18,0.95) 100%);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 40px 28px;
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0,0,0,0.4);
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.4s ease;
          transform-style: preserve-3d;
        }

        .user-plan-card:hover .user-plan-card-inner {
          border-color: ${accentColor}90;
          box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 45px ${accentColor}40, inset 0 2px 20px rgba(255,255,255,0.05);
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
        }

        .upc-btn:hover:not(:disabled) {
          border-color: var(--hover-border);
          background: var(--hover-bg);
          box-shadow: var(--hover-shadow);
        }

        .upc-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .upc-btn-arrow {
          transition: transform 0.3s ease;
        }
        .upc-btn:hover:not(:disabled) .upc-btn-arrow {
          transform: translateX(${isAr ? '-4px' : '4px'});
        }
"""

content = re.sub(r'@keyframes upcEntrance \{.*?\`\}</style>', new_style + '\n      `}</style>', content, flags=re.DOTALL)

# Revert text colors
content = content.replace("color: 'var(--text-primary)'", "color: '#ffffff'")
content = content.replace("color: 'var(--text-tertiary)'", "color: 'rgba(255,255,255,0.4)'")
content = content.replace("color: feat.active ? 'var(--text-primary)' : 'var(--text-secondary)'", "color: feat.active ? '#fff' : '#94A3B8'")
content = content.replace("background: 'var(--bg-tertiary)'", "background: 'rgba(255,255,255,0.05)'")
content = content.replace("color: 'var(--text-secondary)'", "color: 'rgba(255,255,255,0.7)'")

with open('c:\\project\\web_hemo\\frontend\\components\\dashboard\\UserPlanCard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
