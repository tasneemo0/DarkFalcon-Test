import os

file_path = 'components/dashboard/AdminRolesManager.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add state variable
state_target = 'const [assigningAdmin, setAssigningAdmin] = useState<any>(null);'
state_replacement = state_target + '\n  const [selectedRoleIdToAssign, setSelectedRoleIdToAssign] = useState<number | null>(null);'
if state_target in text:
    text = text.replace(state_target, state_replacement)
else:
    print('State target not found')

# 2. Fix useEffect
effect_target = '''  useEffect(() => {
    if (userSearchQuery.trim().length >= 2) {
      const delayDebounceFn = setTimeout(async () => {
        setIsSearchingUsers(true);
        try {
          const res = await fetchWithAuth(`/api/v1/admin/users/search/?q=${encodeURIComponent(userSearchQuery)}`);
          if (res && !res.error && res.results) {
            setUserSearchResults(res.results);
          } else {
            setUserSearchResults([]);
          }
        } catch (e) {
          setUserSearchResults([]);
        }
        setIsSearchingUsers(false);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setUserSearchResults([]);
    }
  }, [userSearchQuery]);'''
effect_replacement = '''  useEffect(() => {
    if (!isAssignModalOpen) {
      setUserSearchResults([]);
      setUserSearchQuery('');
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const res = await fetchWithAuth(`/api/v1/admin/users/search/?q=${encodeURIComponent(userSearchQuery)}`);
        if (res && !res.error && res.results) {
          setUserSearchResults(res.results);
        } else {
          setUserSearchResults([]);
        }
      } catch (e) {
        setUserSearchResults([]);
      }
      setIsSearchingUsers(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery, isAssignModalOpen]);'''

if effect_target in text:
    text = text.replace(effect_target, effect_replacement)
else:
    print('Effect target not found')
    
# 3. Replace Modal UI
modal_start_token = '<div style={{ padding: \'24px\', display: \'flex\', flexDirection: \'column\', gap: \'20px\' }}>'
modal_end_token = '            </div>\n          </div>\n        </div>\n      )}'

start_idx = text.find(modal_start_token)
end_idx = text.find(modal_end_token, start_idx)

if start_idx != -1 and end_idx != -1:
    new_modal_ui = """<div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Search Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>البحث عن مستخدم</label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم، البريد، أو رقم الهاتف..."
                    style={{ width: '100%', padding: '14px 16px 14px 40px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: '12px', color: '#fff', fontSize: '14px' }}
                  />
                  {isSearchingUsers && (
                    <RefreshCw size={16} className="spin" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  )}
                </div>
              </div>

              {/* Search Results */}
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: '12px', maxHeight: '250px', overflowY: 'auto' }}>
                {userSearchResults.length > 0 ? userSearchResults.map(u => {
                   const isSelected = assigningAdmin?.id === u.id;
                   const accountTypeStr = u.profile?.account_type === 'doctor' ? 'طبيب' : 
                                          u.profile?.account_type === 'hospital' ? 'مستشفى' : 
                                          u.profile?.account_type === 'pharmacy' ? 'صيدلية' : 'مستخدم';
                   const statusStr = u.profile?.account_status === 'active' ? 'نشط' :
                                     u.profile?.account_status === 'suspended' ? 'موقوف' : 'محظور';
                   const statusColor = u.profile?.account_status === 'active' ? '#10b981' :
                                       u.profile?.account_status === 'suspended' ? '#f59e0b' : '#ef4444';
                   return (
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
                     >
                       <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
                         {(u.profile?.full_name || u.email).charAt(0).toUpperCase()}
                       </div>
                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <span style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>{u.profile?.full_name || 'بدون اسم'}</span>
                           {u.profile?.admin_role && (
                             <span style={{ background: '#3b82f620', color: '#3b82f6', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                               <ShieldCheck size={12}/> {u.profile.admin_role.name_ar}
                             </span>
                           )}
                         </div>
                         <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                           <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12}/> {u.email}</span>
                           {u.profile?.phone_number && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12}/> {u.profile.phone_number}</span>}
                         </div>
                         <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                           <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'var(--surface)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>{accountTypeStr}</span>
                           <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: `${statusColor}15`, color: statusColor, fontWeight: 600 }}>{statusStr}</span>
                           {u.profile?.subscription_plan && (
                             <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontWeight: 600 }}>باقة {u.profile.subscription_plan}</span>
                           )}
                         </div>
                       </div>
                     </button>
                   );
                }) : !isSearchingUsers ? (
                  <div style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <Search size={32} color="var(--text-tertiary)" />
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px' }}>لا يوجد مستخدمون مطابقون للبحث</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>جرّب البحث بالبريد أو رقم الهاتف.</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center' }}><Loader2 className="spin" size={24} color="var(--primary)"/></div>
                )}
              </div>

              {/* Role Selection (Only if user selected) */}
              {assigningAdmin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>اختر الرتبة الإدارية</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selectedRoleIdToAssign || ''}
                      onChange={e => setSelectedRoleIdToAssign(Number(e.target.value) || null)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '15px',
                        appearance: 'none',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">-- يرجى اختيار رتبة --</option>
                      {roles.filter(r => r.is_active).map(role => (
                        <option key={role.id} value={role.id}>{role.name_ar} / {role.name_en}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                  </div>
                  
                  {assigningAdmin.profile?.account_status !== 'active' && (
                    <div style={{ padding: '12px 16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start', color: '#f59e0b' }}>
                      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                        <strong>تنبيه:</strong> هذا المستخدم ليس نشطاً (حسابه {assigningAdmin.profile?.account_status === 'suspended' ? 'موقوف' : 'محظور'}). هل أنت متأكد من تعيينه كمدير؟
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (assigningAdmin && selectedRoleIdToAssign) {
                        submitAssignRole(assigningAdmin.id, selectedRoleIdToAssign);
                        setIsAssignModalOpen(false);
                        setAssigningAdmin(null);
                        setSelectedRoleIdToAssign(null);
                        // setToastMsg('تم تعيين المستخدم كمدير بنجاح');
                      }
                    }}
                    disabled={!selectedRoleIdToAssign}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      marginTop: '8px',
                      opacity: !selectedRoleIdToAssign ? 0.5 : 1,
                      cursor: !selectedRoleIdToAssign ? 'not-allowed' : 'pointer'
                    }}
                  >
                    تعيين كمدير
                  </button>
                  
                  {assigningAdmin.profile?.admin_role && (
                    <button
                      onClick={() => {
                         submitAssignRole(assigningAdmin.id, null);
                         setIsAssignModalOpen(false);
                         setAssigningAdmin(null);
                         setSelectedRoleIdToAssign(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px dashed rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        color: '#ef4444',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Lock size={16} />
                      إزالة الصلاحيات الإدارية
                    </button>
                  )}
                </div>
              )}
"""
    text = text[:start_idx] + new_modal_ui + '\n' + text[end_idx:]
else:
    print('Modal UI target not found')
    print('Start idx:', start_idx, 'End idx:', end_idx)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated frontend successfully')
