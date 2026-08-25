import re
import sys

def main():
    file_path = "c:/project/web_hemo/frontend/app/dashboard/page.tsx"
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add new state variables after `assigningRank`
    state_anchor = "const [assigningRank, setAssigningRank] = useState<number | null>(null);"
    new_states = """
  const [assigningRank, setAssigningRank] = useState<number | null>(null);

  const [searchAdmin, setSearchAdmin] = useState('');
  const [filterRank, setFilterRank] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [filterRoleStatus, setFilterRoleStatus] = useState('all');
  const [filterRoleSort, setFilterRoleSort] = useState('most_used');
  const [pendingRankAssignments, setPendingRankAssignments] = useState<Record<number, number | null>>({});
"""
    if "setSearchAdmin" not in content:
        content = content.replace(state_anchor, new_states)

    # 2. Add missing Lucide icons to imports
    import_match = re.search(r"import\s+\{[^}]+\}\s+from\s+'lucide-react';", content)
    if import_match:
        import_str = import_match.group(0)
        missing_icons = ["Code2", "Receipt", "Coins", "Activity", "RadioTower", "BarChart3", "PowerOff", "MoreVertical", "Filter", "Clock"]
        
        # Inject missing icons if they are not present
        new_import_str = import_str
        for icon in missing_icons:
            if icon not in new_import_str:
                new_import_str = new_import_str.replace("} from 'lucide-react';", f", {icon} }} from 'lucide-react';")
        content = content.replace(import_str, new_import_str)

    # 3. Replace the Admin & Ranks section
    # Finding the block
    start_str = "{activeItem === 'admin_admins' && isAdminMode && ("
    end_str = "{activeItem === 'admin_settings' && isAdminMode && ("

    start_idx = content.find(start_str)
    end_idx = content.find(end_str)

    if start_idx == -1 or end_idx == -1:
        print("Could not find the target section for Admin & Ranks.")
        sys.exit(1)
        
    new_admin_section = """{activeItem === 'admin_admins' && isAdminMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Header */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '32px 24px', borderRadius: 'var(--radius-xl)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--primary), var(--primary-light))' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Crown size={28} color="var(--primary)" />
                      {locale === 'ar' ? 'إدارة الأدمن والرتب' : 'Admins & Ranks'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px', maxWidth: '600px' }}>
                      {locale === 'ar' ? 'تحكم كامل في رتب فريق العمل وصلاحياتهم. قم بتعيين الشارات التنظيمية وإدارة الأدوار بفعالية عالية.' : 'Full control over team ranks and permissions. Assign organizational badges and manage roles effectively.'}
                    </p>
                  </div>
                  <button onClick={() => {
                    setEditingRank(null);
                    setRankFormName(''); setRankFormNameEn(''); setRankFormColor('#6366f1');
                    setRankFormIcon('star'); setRankFormDesc(''); setRankFormActive(true);
                    setIsRankModalOpen(true);
                  }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: 600 }}>
                    <Plus size={18} />
                    {locale === 'ar' ? 'إنشاء رتبة جديدة' : 'Create New Rank'}
                  </button>
                </div>
                
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
                  {[
                    { labelAr: 'إجمالي الأدمن', labelEn: 'Total Admins', count: adminUsers.length, icon: <Users size={24} />, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
                    { labelAr: 'إجمالي الرتب', labelEn: 'Total Ranks', count: adminRanks.length, icon: <ShieldCheck size={24} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                    { labelAr: 'الرتب المفعلة', labelEn: 'Active Ranks', count: adminRanks.filter(r => r.is_active).length, icon: <Activity size={24} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                    { labelAr: 'رتب معطلة', labelEn: 'Inactive Ranks', count: adminRanks.filter(r => !r.is_active).length, icon: <PowerOff size={24} />, color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
                  ].map((stat, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {stat.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{locale === 'ar' ? stat.labelAr : stat.labelEn}</div>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{stat.count}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Users Table */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '24px', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, margin: 0, fontSize: '18px' }}>{locale === 'ar' ? 'قائمة الأدمن ورتبهم' : 'Admin Users & Their Ranks'}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {locale === 'ar' ? 'تعيين الرتبة المناسبة لكل عضو في الفريق' : 'Assign the appropriate rank to each team member'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', top: '10px', left: locale === 'ar' ? 'auto' : '12px', right: locale === 'ar' ? '12px' : 'auto', color: 'var(--text-tertiary)' }} />
                      <input 
                        type="text" 
                        placeholder={locale === 'ar' ? 'بحث عن أدمن...' : 'Search admin...'} 
                        value={searchAdmin}
                        onChange={e => setSearchAdmin(e.target.value)}
                        style={{ padding: '8px 12px', paddingLeft: locale === 'ar' ? '12px' : '36px', paddingRight: locale === 'ar' ? '36px' : '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', width: '220px' }} 
                      />
                    </div>
                    <select 
                      value={filterRank}
                      onChange={e => setFilterRank(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                    >
                      <option value="">{locale === 'ar' ? 'جميع الرتب' : 'All Ranks'}</option>
                      {adminRanks.map(r => (
                        <option key={r.id} value={r.id.toString()}>{locale === 'ar' ? r.name : (r.name_en || r.name)}</option>
                      ))}
                    </select>
                    <button onClick={() => { fetchAdminUsers(); fetchAdminRanks(); }} className="btn btn-outline" style={{ fontSize: '13px', padding: '8px 14px', borderRadius: '8px' }}>
                      <RefreshCw size={16} style={{ display: 'inline', marginRight: '6px' }} /> {locale === 'ar' ? 'تحديث' : 'Refresh'}
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <table className={`${styles.table} ${styles.mobileCardsTable}`} style={{ margin: 0 }}>
                    <thead style={{ background: 'var(--bg-primary)' }}>
                      <tr>
                        <th style={{ padding: '16px' }}>{locale === 'ar' ? 'المستخدم' : 'User'}</th>
                        <th style={{ padding: '16px' }}>{locale === 'ar' ? 'الرتبة الحالية' : 'Current Rank'}</th>
                        <th style={{ padding: '16px' }}>{locale === 'ar' ? 'نوع الصلاحية' : 'Role Type'}</th>
                        <th style={{ padding: '16px', width: '300px' }}>{locale === 'ar' ? 'تعيين رتبة' : 'Assign Rank'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers
                        .filter(u => searchAdmin ? (u.email.toLowerCase().includes(searchAdmin.toLowerCase()) || (u.profile?.full_name || '').toLowerCase().includes(searchAdmin.toLowerCase())) : true)
                        .filter(u => filterRank ? (u.profile?.admin_rank?.id?.toString() === filterRank) : true)
                        .map(admin => {
                        const currentAssignedId = pendingRankAssignments[admin.id] !== undefined ? pendingRankAssignments[admin.id] : (admin.profile?.admin_rank?.id || null);
                        const hasChanged = currentAssignedId !== (admin.profile?.admin_rank?.id || null);
                        
                        return (
                        <tr key={admin.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--surface), var(--bg-tertiary))', border: '1px solid var(--border-light)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', flexShrink: 0 }}>
                                {admin.email.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin.profile?.full_name || (locale === 'ar' ? 'بدون اسم' : 'No Name')}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {admin.profile?.admin_rank
                              ? <AdminBadge rank={admin.profile.admin_rank} size="md" />
                              : <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: 600 }}>{locale === 'ar' ? 'بدون رتبة' : 'No rank'}</span>
                            }
                          </td>
                          <td style={{ padding: '16px' }}>
                            {admin.is_superuser
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#7C3AED', fontSize: '12px', fontWeight: 600 }}><Crown size={14} /> {locale === 'ar' ? 'مدير عام' : 'Super Admin'}</span>
                              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(45,156,219,0.1)', border: '1px solid rgba(45,156,219,0.2)', color: '#2D9CDB', fontSize: '12px', fontWeight: 600 }}><Shield size={14} /> {locale === 'ar' ? 'أدمن' : 'Admin'}</span>
                            }
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <select
                                value={currentAssignedId || ''}
                                onChange={(e) => {
                                  const val = e.target.value ? parseInt(e.target.value) : null;
                                  setPendingRankAssignments(prev => ({ ...prev, [admin.id]: val }));
                                }}
                                disabled={assigningRank === admin.id}
                                style={{
                                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
                                  border: '1px solid var(--border-light)',
                                  background: 'var(--bg-primary)', color: 'var(--text-primary)',
                                  cursor: 'pointer', outline: 'none', flex: 1,
                                  transition: 'border-color 0.2s ease',
                                }}
                              >
                                <option value="">{locale === 'ar' ? 'بدون رتبة' : 'No rank'}</option>
                                {adminRanks.filter(r => r.is_active).map(rank => (
                                  <option key={rank.id} value={rank.id}>
                                    {locale === 'ar' ? rank.name : (rank.name_en || rank.name)}
                                  </option>
                                ))}
                              </select>
                              {hasChanged && (
                                <button
                                  onClick={async () => {
                                    await handleAssignRank(admin.id, currentAssignedId);
                                    setPendingRankAssignments(prev => { const n = {...prev}; delete n[admin.id]; return n; });
                                  }}
                                  disabled={assigningRank === admin.id}
                                  className="btn btn-primary"
                                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  {assigningRank === admin.id ? <div className={styles.spinner} style={{ width: '14px', height: '14px' }}></div> : <Save size={14} />}
                                  {locale === 'ar' ? 'حفظ' : 'Save'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )})}
                      {adminUsers.length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '48px 24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-tertiary)' }}>
                            <Users size={48} strokeWidth={1} />
                            <p style={{ margin: 0, fontSize: '15px' }}>{locale === 'ar' ? 'لا يوجد أدمن مسجل' : 'No admin users found'}</p>
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ranks Management Cards */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, margin: 0, fontSize: '18px' }}>{locale === 'ar' ? 'الشارات والرتب' : 'Ranks & Badges'}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {locale === 'ar' ? 'إدارة الشارات التعريفية لأعضاء الفريق' : 'Manage decorative badges for team members'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', top: '10px', left: locale === 'ar' ? 'auto' : '12px', right: locale === 'ar' ? '12px' : 'auto', color: 'var(--text-tertiary)' }} />
                      <input 
                        type="text" 
                        placeholder={locale === 'ar' ? 'بحث عن رتبة...' : 'Search rank...'} 
                        value={searchRole}
                        onChange={e => setSearchRole(e.target.value)}
                        style={{ padding: '8px 12px', paddingLeft: locale === 'ar' ? '12px' : '36px', paddingRight: locale === 'ar' ? '36px' : '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: '13px', width: '200px' }} 
                      />
                    </div>
                    <select 
                      value={filterRoleStatus}
                      onChange={e => setFilterRoleStatus(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                    >
                      <option value="all">{locale === 'ar' ? 'الكل' : 'All'}</option>
                      <option value="active">{locale === 'ar' ? 'مفعلة' : 'Active'}</option>
                      <option value="inactive">{locale === 'ar' ? 'معطلة' : 'Inactive'}</option>
                    </select>
                  </div>
                </div>

                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                  <ShieldCheck size={18} color="#3b82f6" flexShrink={0} />
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {locale === 'ar' ? 'ملاحظة: الرتبة شارة تعريفية، والصلاحيات يتم التحكم بها بشكل منفصل عن طريق الإدارة.' : 'Note: Rank is an identifying badge, permissions are controlled separately by management.'}
                  </span>
                </div>

                {adminRanks.length === 0 ? (
                  <div style={{ background: 'var(--surface)', border: '1px dashed var(--border-light)', padding: '64px 24px', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--text-tertiary)' }}>
                      <Star size={32} />
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{locale === 'ar' ? 'لا توجد رتب بعد' : 'No ranks yet'}</h4>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>{locale === 'ar' ? 'قم بإنشاء رتبة جديدة لتنظيم أعضاء فريقك.' : 'Create a new rank to organize your team members.'}</p>
                    <button onClick={() => {
                      setEditingRank(null);
                      setRankFormName(''); setRankFormNameEn(''); setRankFormColor('#6366f1');
                      setRankFormIcon('star'); setRankFormDesc(''); setRankFormActive(true);
                      setIsRankModalOpen(true);
                    }} className="btn btn-primary">
                      {locale === 'ar' ? 'إنشاء الرتبة الأولى' : 'Create First Rank'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {adminRanks
                      .filter(r => searchRole ? (r.name.toLowerCase().includes(searchRole.toLowerCase()) || (r.name_en || '').toLowerCase().includes(searchRole.toLowerCase())) : true)
                      .filter(r => filterRoleStatus === 'all' ? true : (filterRoleStatus === 'active' ? r.is_active : !r.is_active))
                      .map(rank => {
                        const membersCount = adminUsers.filter(u => u.profile?.admin_rank?.id === rank.id).length;
                        return (
                      <div key={rank.id} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '16px', overflow: 'hidden', position: 'relative', transition: 'transform 0.2s ease, box-shadow 0.2s ease', display: 'flex', flexDirection: 'column' }} className={styles.hoverCard}>
                        {/* Rank Header with subtle gradient */}
                        <div style={{ padding: '24px', background: `linear-gradient(135deg, ${rank.color}15, var(--surface))`, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `linear-gradient(135deg, ${rank.color}, ${rank.color}dd)`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${rank.color}40` }}>
                              {getPlanIcon(rank.icon) || <Star size={28} />}
                            </div>
                            <div>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{locale === 'ar' ? rank.name : (rank.name_en || rank.name)}</h4>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', background: rank.is_active ? 'rgba(16,185,129,0.1)' : 'var(--bg-tertiary)', color: rank.is_active ? '#10b981' : 'var(--text-tertiary)', fontSize: '11px', fontWeight: 600, border: `1px solid ${rank.is_active ? 'rgba(16,185,129,0.2)' : 'var(--border-light)'}` }}>
                                {rank.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                {rank.is_active ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'معطل' : 'Inactive')}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Rank Body */}
                        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5, minHeight: '40px' }}>
                            {rank.description || (locale === 'ar' ? 'لا يوجد وصف لهذه الرتبة.' : 'No description for this rank.')}
                          </p>
                          
                          {/* Mock Permissions Badge Area */}
                          <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {rank.name_en?.toLowerCase().includes('admin') || rank.name?.includes('مدير') ? (
                              <>
                                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-secondary)' }}>[المدفوعات]</span>
                                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-secondary)' }}>[العملاء]</span>
                                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-secondary)' }}>[الباقات]</span>
                                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-secondary)' }}>[الإعدادات]</span>
                              </>
                            ) : rank.name_en?.toLowerCase().includes('support') || rank.name?.includes('دعم') ? (
                              <>
                                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-secondary)' }}>[العملاء]</span>
                                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-secondary)' }}>[التذاكر]</span>
                              </>
                            ) : rank.name_en?.toLowerCase().includes('dev') || rank.name?.includes('مطور') ? (
                              <>
                                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-secondary)' }}>[API]</span>
                                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-secondary)' }}>[Webhooks]</span>
                                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-secondary)' }}>[Logs]</span>
                              </>
                            ) : (
                              <>
                                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-secondary)' }}>[الصلاحيات الأساسية]</span>
                              </>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-primary)', borderRadius: '10px', marginTop: 'auto', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                              <Users size={16} />
                              {locale === 'ar' ? 'الأعضاء' : 'Members'}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                              {membersCount}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => {
                              setEditingRank(rank);
                              setRankFormName(rank.name); setRankFormNameEn(rank.name_en || '');
                              setRankFormColor(rank.color); setRankFormIcon(rank.icon);
                              setRankFormDesc(rank.description || ''); setRankFormActive(rank.is_active);
                              setIsRankModalOpen(true);
                            }} className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <Edit3 size={15} /> {locale === 'ar' ? 'تعديل' : 'Edit'}
                            </button>
                            <button onClick={async () => {
                              try {
                                await fetchWithAuth(`/admin/ranks/${rank.id}/`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ is_active: !rank.is_active })
                                });
                                fetchAdminRanks();
                              } catch(e) {
                                alert('Error toggling rank status');
                              }
                            }} className="btn btn-outline" style={{ padding: '8px', borderRadius: '8px', color: rank.is_active ? '#f59e0b' : '#10b981' }} title={locale === 'ar' ? 'تغيير الحالة' : 'Toggle Status'}>
                              {rank.is_active ? <PowerOff size={16} /> : <CheckCircle2 size={16} />}
                            </button>
                            <button onClick={() => handleDeleteRank(rank.id, rank.name)} className="btn btn-outline" style={{ padding: '8px', borderRadius: '8px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} title={locale === 'ar' ? 'حذف' : 'Delete'}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </div>
          )}
"""
    content = content[:start_idx] + new_admin_section + content[end_idx:]

    # 4. Replace the Create/Edit Modal
    modal_start_str = "{/* Rank Create/Edit Modal */}"
    
    m_start_idx = content.find(modal_start_str)
    
    m_end_idx = content.find("</div>\\n\\n  );\\n\\n}") # end of file roughly
    if m_end_idx == -1:
        m_end_idx = content.find("  );\\n}")
        
    if m_start_idx != -1:
        idx = content.find("{isRankModalOpen && (", m_start_idx)
        if idx != -1:
            open_braces = 0
            for i in range(idx, len(content)):
                if content[i] == '{':
                    open_braces += 1
                elif content[i] == '}':
                    open_braces -= 1
                    if open_braces == 0:
                        m_end_idx = i + 1
                        break
                        
            new_modal = """{/* Rank Create/Edit Modal */}
      {isRankModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '600px', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', border: '1px solid var(--border-light)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Crown size={18} />
                </div>
                {editingRank ? (locale === 'ar' ? 'تعديل بيانات الرتبة' : 'Edit Rank') : (locale === 'ar' ? 'إنشاء رتبة جديدة' : 'Create New Rank')}
              </h3>
              <button onClick={() => setIsRankModalOpen(false)} style={{ background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {/* Live Preview */}
              <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {locale === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
                </div>
                <div style={{ transform: 'scale(1.1)' }}>
                  <AdminBadge rank={{ name: rankFormName || (locale === 'ar' ? 'اسم الرتبة' : 'Rank Name'), name_en: rankFormNameEn || 'Rank Name', color: rankFormColor, icon: rankFormIcon, is_active: rankFormActive }} size="md" />
                </div>
              </div>
              
              <form onSubmit={handleSaveRank} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>{locale === 'ar' ? 'اسم الرتبة (عربي) *' : 'Rank Name (AR) *'}</label>
                    <input type="text" required value={rankFormName} onChange={e => setRankFormName(e.target.value)} placeholder="مدير النظام" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>{locale === 'ar' ? 'اسم الرتبة (إنجليزي)' : 'Rank Name (EN)'}</label>
                    <input type="text" value={rankFormNameEn} onChange={e => setRankFormNameEn(e.target.value)} placeholder="System Manager" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>{locale === 'ar' ? 'وصف مختصر' : 'Short Description'}</label>
                  <input type="text" value={rankFormDesc} onChange={e => setRankFormDesc(e.target.value)} placeholder={locale === 'ar' ? 'تحكم كامل في جميع ميزات النظام' : 'Full system control and supervision'} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>{locale === 'ar' ? 'اللون (Color Picker)' : 'Color Picker'}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ position: 'relative', width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                        <input type="color" value={rankFormColor} onChange={e => setRankFormColor(e.target.value)} style={{ position: 'absolute', top: '-10px', left: '-10px', width: '60px', height: '60px', cursor: 'pointer', border: 'none', padding: 0 }} />
                      </div>
                      <input type="text" value={rankFormColor} onChange={e => setRankFormColor(e.target.value)} placeholder="#6366f1" style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '14px', outline: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>{locale === 'ar' ? 'الأيقونة (Lucide)' : 'Icon (Lucide)'}</label>
                    <div style={{ position: 'relative' }}>
                      <select value={rankFormIcon} onChange={e => setRankFormIcon(e.target.value)} style={{ width: '100%', padding: '10px 14px', paddingRight: '36px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)', appearance: 'none', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                        <option value="star">{locale === 'ar' ? 'نجمة (Star)' : 'Star'}</option>
                        <option value="shield">{locale === 'ar' ? 'درع (Shield)' : 'Shield'}</option>
                        <option value="code">{locale === 'ar' ? 'تطوير (Code)' : 'Code'}</option>
                        <option value="headphones">{locale === 'ar' ? 'دعم فني (Headphones)' : 'Headphones'}</option>
                        <option value="briefcase">{locale === 'ar' ? 'حقيبة (Briefcase)' : 'Briefcase'}</option>
                        <option value="settings">{locale === 'ar' ? 'إعدادات (Settings)' : 'Settings'}</option>
                        <option value="crown">{locale === 'ar' ? 'تاج (Crown)' : 'Crown'}</option>
                        <option value="check-circle">{locale === 'ar' ? 'توثيق (Check Circle)' : 'Check Circle'}</option>
                        <option value="receipt">{locale === 'ar' ? 'فواتير (Receipt)' : 'Receipt'}</option>
                        <option value="barchart3">{locale === 'ar' ? 'إحصائيات (BarChart)' : 'BarChart'}</option>
                        <option value="activity">{locale === 'ar' ? 'نشاط (Activity)' : 'Activity'}</option>
                      </select>
                      <ChevronDown size={16} style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <label style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={rankFormActive} onChange={e => setRankFormActive(e.target.checked)} style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }} />
                    <div style={{ width: '44px', height: '24px', background: rankFormActive ? 'var(--primary)' : 'var(--bg-tertiary)', borderRadius: '12px', transition: 'background 0.2s', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '2px', left: rankFormActive ? '22px' : '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}></div>
                    </div>
                  </label>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {locale === 'ar' ? 'الرتبة مفعلة (تظهر في القائمة)' : 'Rank is active (visible in lists)'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="submit" disabled={savingRank} className="btn btn-primary" style={{ flex: 2, padding: '12px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    {savingRank ? <div className={styles.spinner} style={{ width: '20px', height: '20px' }}></div> : <Save size={18} />}
                    {savingRank ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (editingRank ? (locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (locale === 'ar' ? 'إنشاء الرتبة' : 'Create Rank'))}
                  </button>
                  <button type="button" onClick={() => setIsRankModalOpen(false)} className="btn btn-outline" style={{ flex: 1, padding: '12px', borderRadius: '10px', fontSize: '15px', fontWeight: 600 }}>
                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
"""
            content = content[:m_start_idx] + new_modal + content[m_end_idx:]

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Successfully updated page.tsx with Admins & Ranks UI redesign!")

if __name__ == "__main__":
    main()
