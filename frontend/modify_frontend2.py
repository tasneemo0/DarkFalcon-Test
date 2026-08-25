import os

file_path = 'components/dashboard/AdminRolesManager.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

target_btn_start = '''                   return (
                     <button
                       key={u.id}
                       onClick={() => { setAssigningAdmin(u); setSelectedRoleIdToAssign(u.profile?.admin_role?.id || null); }}
                       style={{ 
                         width: '100%', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', 
                         borderBottom: '1px solid var(--border-light)', background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent', 
                         border: isSelected ? '1px solid #3b82f6' : 'none',
                         borderBottomWidth: isSelected ? '1px' : '1px',
                         borderBottomColor: 'var(--border-light)',
                         cursor: 'pointer', textAlign: 'right', transition: 'all 0.2s' 
                       }}
                     >'''

new_btn_start = '''                   const isAdmin = !!u.profile?.admin_role;
                   return (
                     <button
                       key={u.id}
                       disabled={isAdmin}
                       onClick={() => { setAssigningAdmin(u); setSelectedRoleIdToAssign(u.profile?.admin_role?.id || null); }}
                       style={{ 
                         width: '100%', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', 
                         borderBottom: '1px solid var(--border-light)', background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent', 
                         border: isSelected ? '1px solid #3b82f6' : 'none',
                         borderBottomWidth: isSelected ? '1px' : '1px',
                         borderBottomColor: 'var(--border-light)',
                         cursor: isAdmin ? 'not-allowed' : 'pointer', textAlign: 'right', transition: 'all 0.2s',
                         opacity: isAdmin ? 0.6 : 1
                       }}
                     >'''

if target_btn_start in text:
    text = text.replace(target_btn_start, new_btn_start)
else:
    print('Button start target not found')


target_badge = '''                           {u.profile?.admin_role && (
                             <span style={{ background: '#3b82f620', color: '#3b82f6', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                               <ShieldCheck size={12}/> {u.profile.admin_role.name_ar}
                             </span>
                           )}'''
new_badge = '''                           {u.profile?.admin_role && (
                             <span style={{ background: '#3b82f620', color: '#3b82f6', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                               <ShieldCheck size={12}/> مدير بالفعل ({u.profile.admin_role.name_ar})
                             </span>
                           )}'''

if target_badge in text:
    text = text.replace(target_badge, new_badge)
else:
    print('Badge target not found')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Updated frontend UI for admins')
