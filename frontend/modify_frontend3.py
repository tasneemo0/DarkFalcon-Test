import os
import re

file_path = 'components/dashboard/AdminRolesManager.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

pattern = r'\{isAssignModalOpen && \(\s*<div style=\{\{ position: \'fixed\'[\s\S]*?</div>\s*</div>\s*\)\}'

new_modal = """{isAssignModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setIsAssignModalOpen(false)}></div>
          <div className="modal-content animate-in zoom-in-95" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '24px', width: '100%', maxWidth: '500px', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary)', flexShrink: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>تعيين مستخدم كمدير</h2>
              <button onClick={() => setIsAssignModalOpen(false)} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18}/></button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
              
              {!assigningAdmin ? (
                <>
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
                        <Loader2 size={16} className="spin" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                      )}
                    </div>
                  </div>

                  {/* Search Results */}
                  <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden' }}>
                    {isSearchingUsers ? (
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[1, 2, 3].map(i => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.7, animation: 'pulse 1.5s infinite' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--border-light)' }}></div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ width: '40%', height: '14px', background: 'var(--border-light)', borderRadius: '4px' }}></div>
                              <div style={{ width: '60%', height: '12px', background: 'var(--border-light)', borderRadius: '4px' }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : userSearchResults.length > 0 ? (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {userSearchResults.map(u => {
                           const isAdmin = !!u.profile?.admin_role;
                           const accountTypeStr = u.profile?.account_type === 'doctor' ? 'طبيب' : 
                                                  u.profile?.account_type === 'hospital' ? 'مستشفى' : 
                                                  u.profile?.account_type === 'pharmacy' ? 'صيدلية' : 'مستخدم';
                           const statusStr = u.is_active ? 'نشط' : 'موقوف';
                           const statusColor = u.is_active ? '#10b981' : '#ef4444';
                           
                           return (
                             <button
                               key={u.id}
                               disabled={isAdmin}
                               onClick={() => { setAssigningAdmin(u); setSelectedRoleIdToAssign(u.profile?.admin_role?.id || null); }}
                               style={{ 
                                 width: '100%', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', 
                                 borderBottom: '1px solid var(--border-light)', background: 'transparent', 
                                 border: 'none',
                                 borderBottomWidth: '1px',
                                 borderBottomColor: 'var(--border-light)',
                                 cursor: isAdmin ? 'not-allowed' : 'pointer', textAlign: 'right', transition: 'all 0.2s',
                                 opacity: isAdmin ? 0.6 : 1
                               }}
                             >
                               <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', flexShrink: 0 }}>
                                 {(u.profile?.full_name || u.email).charAt(0).toUpperCase()}
                               </div>
                               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                     <span style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>{u.profile?.full_name || 'بدون اسم'}</span>
                                     {u.profile?.admin_role && (
                                       <span style={{ background: '#3b82f620', color: '#3b82f6', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                         <ShieldCheck size={12}/> مدير بالفعل
                                       </span>
                                     )}
                                   </div>
                                 </div>
                                 
                                 <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                                   <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14}/> {u.email}</span>
                                   {u.profile?.phone_number && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14}/> {u.profile.phone_number}</span>}
                                 </div>
                                 
                                 <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                   <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>{accountTypeStr}</span>
                                   <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', background: `${statusColor}15`, color: statusColor, fontWeight: 700 }}>{statusStr}</span>
                                 </div>
                               </div>
                             </button>
                           );
                        })}
                      </div>
                    ) : (
                      <div style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Search size={32} color="var(--text-tertiary)" />
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px' }}>لا يوجد مستخدمون مطابقون للبحث</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>جرّب البحث بالبريد أو رقم الهاتف.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Selected User Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>المستخدم المحدد</label>
                      <button 
                        onClick={() => { setAssigningAdmin(null); setSelectedRoleIdToAssign(null); }}
                        style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RefreshCw size={14} /> تغيير المستخدم
                      </button>
                    </div>
                    
                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px', flexShrink: 0 }}>
                        {(assigningAdmin.profile?.full_name || assigningAdmin.email).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '16px' }}>{assigningAdmin.profile?.full_name || 'بدون اسم'}</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{assigningAdmin.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    
                    {!assigningAdmin.is_active && (
                      <div style={{ padding: '12px 16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start', color: '#f59e0b', marginTop: '4px' }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                          <strong>تنبيه:</strong> هذا المستخدم حسابه موقوف حالياً. هل أنت متأكد من تعيينه كمدير؟
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Footer with Actions */}
            <div style={{ padding: '24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-tertiary)', flexShrink: 0, display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                style={{ flex: 1, padding: '14px', background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '12px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                إلغاء
              </button>
              
              <button
                onClick={() => {
                  if (assigningAdmin && selectedRoleIdToAssign) {
                    submitAssignRole(assigningAdmin.id, selectedRoleIdToAssign);
                    setIsAssignModalOpen(false);
                    setAssigningAdmin(null);
                    setSelectedRoleIdToAssign(null);
                  }
                }}
                disabled={!assigningAdmin || !selectedRoleIdToAssign}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  opacity: (!assigningAdmin || !selectedRoleIdToAssign) ? 0.5 : 1,
                  cursor: (!assigningAdmin || !selectedRoleIdToAssign) ? 'not-allowed' : 'pointer'
                }}
              >
                تعيين كمدير
              </button>
            </div>
          </div>
        </div>
      )}"""

if re.search(pattern, text):
    text = re.sub(pattern, new_modal, text)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print('Modal updated successfully')
else:
    print('Modal pattern NOT FOUND')
