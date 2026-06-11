import re

with open('c:\\Users\\Dell\\OneDrive\\Desktop\\AI-legal assist project\\project\\frontend\\src\\pages\\KnowYourRightsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Categories colors
content = content.replace("'#1D4ED8'", "'#60a5fa'").replace("'#EFF6FF'", "'rgba(59, 130, 246, 0.15)'")
content = content.replace("'#DC2626'", "'var(--danger)'").replace("'#FEF2F2'", "'var(--danger-bg)'")
content = content.replace("'#7C3AED'", "'#a78bfa'").replace("'#F5F3FF'", "'rgba(139, 92, 246, 0.15)'")
content = content.replace("'#DB2777'", "'#f472b6'").replace("'#FDF2F8'", "'rgba(236, 72, 153, 0.15)'")
content = content.replace("'#D97706'", "'var(--warning)'").replace("'#FFFBEB'", "'var(--warning-bg)'")
content = content.replace("'#16A34A'", "'var(--success)'").replace("'#F0FDF4'", "'var(--success-bg)'")
content = content.replace("'#0891B2'", "'#22d3ee'").replace("'#ECFEFF'", "'rgba(6, 182, 212, 0.15)'")
content = content.replace("'#6D28D9'", "'#c084fc'")
content = content.replace("'#BE185D'", "'#fb7185'")

# Text and borders
content = content.replace("'#64748B'", "'var(--text-muted)'")
content = content.replace("'#334155'", "'var(--text-primary)'")
content = content.replace("'#0F172A'", "'var(--text-heading)'")
content = content.replace("'#94A3B8'", "'var(--text-muted)'")
content = content.replace("bg: '#fff'", "bg: 'var(--bg-card)'")
content = content.replace("law.bg : '#fff'", "law.bg : 'var(--bg-card)'")
content = content.replace("? law.bg : '#fff'", "? law.bg : 'var(--bg-card)'")
content = content.replace("? activeCat.bg : '#fff'", "? activeCat.bg : 'var(--bg-card)'")
content = content.replace("'#E2E8F0'", "'var(--border)'")
content = content.replace("'#BFDBFE'", "'var(--border)'")
content = content.replace("'#DBEAFE'", "'var(--primary)'")

# AI question box
content = content.replace("linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)", "linear-gradient(135deg, #451a03 0%, var(--primary) 100%)")
content = content.replace("rgba(29,78,216,0.2)", "rgba(234, 88, 12, 0.2)")

with open('c:\\Users\\Dell\\OneDrive\\Desktop\\AI-legal assist project\\project\\frontend\\src\\pages\\KnowYourRightsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
