import os

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Left panel background
    content = content.replace('background: "linear-gradient(160deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)"', 'background: "var(--bg-page)", borderRight: "1px solid var(--border)"')
    
    # Right panel background
    content = content.replace('background: "linear-gradient(135deg, #F0F4FF 0%, #E0E7FF 100%)"', 'background: "var(--bg-page)"')
    
    # Main form box
    content = content.replace('background: "rgba(255, 255, 255, 0.85)"', 'background: "var(--bg-card)"')
    content = content.replace('border: "1px solid rgba(255,255,255,0.6)"', 'border: "1px solid var(--border)"')
    
    # Text colors
    content = content.replace('#111827', 'var(--text-heading)')
    content = content.replace('#6B7280', 'var(--text-muted)')
    content = content.replace('#9CA3AF', 'var(--text-muted)')
    content = content.replace('#94A3B8', 'var(--text-muted)')
    content = content.replace('#CBD5E1', 'var(--text-primary)')
    
    # Primary colors
    content = content.replace('#4F46E5', 'var(--primary)')
    content = content.replace('#6366F1', 'var(--primary)')
    content = content.replace('#4338CA', '#c2410c') # Hover shade for primary
    content = content.replace('#818CF8', 'var(--primary)')
    content = content.replace('#A5B4FC', 'rgba(234,88,12,0.5)') # disabled button
    
    # Input borders and backgrounds
    content = content.replace('#E5E7EB', 'var(--border)')
    content = content.replace('#FAFAFA', 'transparent')
    content = content.replace('background: "#fff"', 'background: "var(--bg-page)"')
    content = content.replace('background = "#fff"', 'background = "var(--bg-page)"')
    content = content.replace('background: agreed ? "#6366F1" : "#fff"', 'background: agreed ? "var(--primary)" : "transparent"')
    content = content.replace('background: rememberMe ? "#6366F1" : "#fff"', 'background: rememberMe ? "var(--primary)" : "transparent"')
    content = content.replace('color: "#fff"', 'color: "#ffffff"')
    
    # Error colors
    content = content.replace('#EF4444', 'var(--danger)')
    content = content.replace('#FCA5A5', 'var(--danger)')
    content = content.replace('#FFF5F5', 'var(--danger-bg)')
    
    # Role selector (Signup)
    content = content.replace('#EEF2FF', 'rgba(234, 88, 12, 0.1)')
    content = content.replace('#C7D2FE', 'rgba(234, 88, 12, 0.3)')
    content = content.replace('background: form.role === r.value ? "#EEF2FF" : "#fff"', 'background: form.role === r.value ? "rgba(234, 88, 12, 0.1)" : "transparent"')
    
    # Glow effects
    content = content.replace('rgba(99,102,241', 'rgba(234,88,12')
    content = content.replace('rgba(139,92,246', 'rgba(234,88,12')
    content = content.replace('rgba(236,72,153', 'rgba(234,88,12')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = r'c:\Users\Dell\OneDrive\Desktop\AI-legal assist project\project\frontend\src\pages'
process_file(os.path.join(base_dir, 'LoginPage.jsx'))
process_file(os.path.join(base_dir, 'SignupPage.jsx'))
print('Success')
