import os
DASHBOARD_CSS = r"c:\project\web_hemo\frontend\components\dashboard\dashboard.module.css"

if os.path.exists(DASHBOARD_CSS):
    with open(DASHBOARD_CSS, 'a', encoding='utf-8') as f:
        f.write('''
/* --- Burger Button Fix --- */
@media (max-width: 767px) {
  .burgerBtn {
    display: flex !important;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    flex-shrink: 0;
  }
}
@media (min-width: 768px) {
  .burgerBtn {
    display: none !important;
  }
}
''')
print("Added burgerBtn CSS")
