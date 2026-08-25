# -*- coding: utf-8 -*-
import re

with open('app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

settings_old = '''          {activeItem === 'settings' && !isAdminMode && (
            <div className={styles.settingsGrid}>
              { }
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '24px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontWeight: 700 }}>{locale === 'ar' ? 'تعديل البريد الإلكتروني وكلمة المرور' : 'Modify Credentials'}</h3>

                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>{locale === 'ar' ? 'البريد الإلكتروني:' : 'Email address:'}</label>
                    <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>{locale === 'ar' ? 'كلمة مرور جديدة (اتركها فارغة إذا لم تكن ترغب بالتعديل):' : 'New Password:'}</label>
                    <input type="password" autoComplete="new-password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="******" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    {locale === 'ar' ? 'تعديل البيانات' : 'Update Credentials'}
                  </button>
                </form>

                <h3 style={{ fontWeight: 700, marginTop: '20px' }}>{locale === 'ar' ? 'إعدادات الحماية والأمان الإضافية' : 'Extra Security Parameters'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px' }}>
                    <span>{locale === 'ar' ? 'تفعيل المصادقة الثنائية (2FA)' : 'Enable Two-Factor Authentication'}</span>
                    <input type="checkbox" checked={twoFactor} onChange={(e) => { setTwoFactor(e.target.checked); handleToggleSecurity('2fa', e.target.checked); }} />
                  </label>

                  <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{locale === 'ar' ? 'تفعيل تسجيل الدخول بخطوتين' : 'Enable Two-step passcode'}</span>
                      <input type="checkbox" checked={twoStepEnabled} onChange={(e) => { setTwoStepEnabled(e.target.checked); handleToggleSecurity('2step', e.target.checked); }} />
                    </div>
                    {twoStepEnabled && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <input type="password" placeholder={locale === 'ar' ? 'الرمز السري بخطوتين...' : 'Enter 2-step password...'} value={twoStepPassword} onChange={(e) => setTwoStepPassword(e.target.value)} style={{ flex: 1, padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                        <button onClick={() => handleToggleSecurity('2step', true)} className="btn btn-primary btn-sm">
                          {locale === 'ar' ? 'حفظ الرمز' : 'Save Passcode'}
                        </button>
                      </div>
                    )}
                  </div>

                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px' }}>
                    <span>{locale === 'ar' ? 'تقييد ومنع الدخول من عناوين IP إضافية' : 'Restrict Login to Authorized IP only'}</span>
                    <input type="checkbox" checked={restrictIp} onChange={(e) => { setRestrictIp(e.target.checked); handleToggleSecurity('ip', e.target.checked); }} />
                  </label>
                </div>
              </div>

              { }
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '24px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontWeight: 700 }}>{locale === 'ar' ? 'الأجهزة النشطة وسجل الدخول' : 'Active Sessions & Login Logs'}</h3>

                <h5>{locale === 'ar' ? 'الجلسات المسجلة حالياً:' : 'Active Registered Sessions:'}</h5>
                <div style={{ maxHeight: '180px', overflow: 'auto', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                  <table className={styles.table} style={{ fontSize: '12px' }}>
                    <tbody>
                      {sessionLogs.map(s => (
                        <tr key={s.id}>
                          <td>{s.ip_address}</td>
                          <td>{s.browser_agent ? s.browser_agent.substring(0, 30) : '-'}...</td>
                          <td>{new Date(s.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h5>{locale === 'ar' ? 'سجل محاولات الدخول:' : 'Login history Log:'}</h5>
                <div style={{ maxHeight: '180px', overflow: 'auto', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                  <table className={styles.table} style={{ fontSize: '12px' }}>
                    <tbody>
                      {loginHistory.map(lh => (
                        <tr key={lh.id}>
                          <td>{lh.ip_address}</td>
                          <td>
                            <span style={{ color: lh.status === 'success' ? '#27ae60' : '#eb5757' }}>
                              {lh.status}
                            </span>
                          </td>
                          <td>{new Date(lh.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}'''

settings_new = '''          {activeItem === 'settings' && !isAdminMode && (
            <div className={styles.settingsGrid}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '24px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontWeight: 700 }}>{locale === 'ar' ? 'تعديل البريد الإلكتروني وكلمة المرور' : 'Modify Credentials'}</h3>

                  <div>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>{locale === 'ar' ? 'البريد الإلكتروني:' : 'Email address:'}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ flex: 1, padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                      <button onClick={handleChangeEmailRequest} className="btn btn-outline">{locale === 'ar' ? 'تغيير' : 'Change'}</button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>{locale === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ flex: 1, padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                      <button onClick={handleChangePhoneRequest} className="btn btn-outline">{locale === 'ar' ? 'تغيير' : 'Change'}</button>
                    </div>
                  </div>

                  <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                    <h5 style={{ fontWeight: 600 }}>{locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</h5>
                    <div>
                      <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={locale === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <input type="password" required value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder={locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={locale === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                      {locale === 'ar' ? 'حفظ كلمة المرور' : 'Save Password'}
                    </button>
                  </form>
                </div>

                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '24px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontWeight: 700 }}>{locale === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { key: 'notify_new_login', label: locale === 'ar' ? 'تنبيه تسجيل دخول جديد' : 'New Login Alert', val: notifyNewLogin, setter: setNotifyNewLogin },
                      { key: 'notify_password_change', label: locale === 'ar' ? 'تنبيه تغيير كلمة المرور' : 'Password Change Alert', val: notifyPasswordChange, setter: setNotifyPasswordChange },
                      { key: 'notify_package_expiry', label: locale === 'ar' ? 'تنبيه قرب انتهاء الباقة' : 'Package Expiry Alert', val: notifyPackageExpiry, setter: setNotifyPackageExpiry },
                      { key: 'notify_whatsapp_disconnect', label: locale === 'ar' ? 'تنبيه فصل جهاز واتساب' : 'WhatsApp Device Disconnect Alert', val: notifyWhatsappDisconnect, setter: setNotifyWhatsappDisconnect },
                      { key: 'notify_webhook_failure', label: locale === 'ar' ? 'تنبيه فشل Webhook' : 'Webhook Failure Alert', val: notifyWebhookFailure, setter: setNotifyWebhookFailure }
                    ].map(item => (
                      <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px' }}>
                        <span>{item.label}</span>
                        <input type="checkbox" checked={item.val} onChange={(e) => { item.setter(e.target.checked); handleToggleSecurity(item.key, e.target.checked); }} />
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '24px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontWeight: 700 }}>{locale === 'ar' ? 'إعدادات الحماية والأمان الإضافية' : 'Extra Security Parameters'}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px' }}>
                      <span>{locale === 'ar' ? 'تفعيل المصادقة الثنائية عبر SMS' : 'Enable 2FA via SMS'}</span>
                      <input type="checkbox" checked={twoFactor} onChange={(e) => { setTwoFactor(e.target.checked); handleToggleSecurity('2fa', e.target.checked); }} />
                    </label>

                    <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{locale === 'ar' ? 'تقييد الدخول بعناوين IP محددة' : 'Restrict Login to Authorized IPs only'}</span>
                        <input type="checkbox" checked={restrictIp} onChange={(e) => { setRestrictIp(e.target.checked); handleToggleSecurity('ip', e.target.checked); }} />
                      </label>
                      {restrictIp && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                          <p style={{ fontSize: '12px', color: 'var(--error)' }}>
                            {locale === 'ar' ? 'تحذير: لن تتمكن من الدخول إلا من خلال العناوين المحددة. أدخل العناوين مفصولة بفاصلة (,)' : 'Warning: You will only be able to login from the specified IPs. Enter comma-separated IPs.'}
                          </p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" placeholder="192.168.1.1, 10.0.0.1" value={allowedIps} onChange={(e) => setAllowedIps(e.target.value)} style={{ flex: 1, padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '4px' }} />
                            <button onClick={handleSaveAllowedIps} className="btn btn-primary btn-sm">
                              {locale === 'ar' ? 'حفظ IPs' : 'Save IPs'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '24px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontWeight: 700 }}>{locale === 'ar' ? 'الأجهزة النشطة وسجل الدخول' : 'Active Sessions & Login Logs'}</h3>

                  <h5>{locale === 'ar' ? 'الجلسات المسجلة حالياً:' : 'Active Registered Sessions:'}</h5>
                  <div style={{ maxHeight: '180px', overflow: 'auto', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                    <table className={styles.table} style={{ fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>{locale === 'ar' ? 'IP' : 'IP'}</th>
                          <th>{locale === 'ar' ? 'المتصفح' : 'Browser'}</th>
                          <th>{locale === 'ar' ? 'آخر نشاط' : 'Last Activity'}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionLogs.map(s => (
                          <tr key={s.id}>
                            <td>{s.ip_address}</td>
                            <td>{s.browser_agent ? s.browser_agent.substring(0, 30) : '-'}...</td>
                            <td>{new Date(s.last_activity || s.created_at).toLocaleString()}</td>
                            <td>
                              <button onClick={() => handleLogoutDevice(s.id)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>
                                {locale === 'ar' ? 'تسجيل خروج' : 'Logout'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h5>{locale === 'ar' ? 'سجل محاولات الدخول:' : 'Login history Log:'}</h5>
                  <div style={{ maxHeight: '180px', overflow: 'auto', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                    <table className={styles.table} style={{ fontSize: '12px' }}>
                      <tbody>
                        {loginHistory.map(lh => (
                          <tr key={lh.id}>
                            <td>{lh.ip_address}</td>
                            <td>
                              <span style={{ color: lh.status === 'success' ? '#27ae60' : '#eb5757' }}>
                                {lh.status === 'success' ? (locale === 'ar' ? 'ناجحة' : 'Success') : (locale === 'ar' ? 'فاشلة' : 'Failed')}
                              </span>
                            </td>
                            <td>{new Date(lh.created_at).toLocaleString()}</td>
                            {lh.failure_reason && (
                              <td style={{ color: 'var(--text-secondary)' }}>
                                {lh.failure_reason}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '24px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontWeight: 700 }}>{locale === 'ar' ? 'سجل العمليات (Audit Log)' : 'Audit Log'}</h3>
                  <div style={{ maxHeight: '250px', overflow: 'auto', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                    <table className={styles.table} style={{ fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>{locale === 'ar' ? 'العملية' : 'Action'}</th>
                          <th>{locale === 'ar' ? 'التفاصيل' : 'Details'}</th>
                          <th>{locale === 'ar' ? 'IP' : 'IP'}</th>
                          <th>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map(al => (
                          <tr key={al.id}>
                            <td>{al.action}</td>
                            <td>{al.details || '-'}</td>
                            <td>{al.ip_address}</td>
                            <td>{new Date(al.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                        {auditLogs.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center' }}>
                              {locale === 'ar' ? 'لا توجد عمليات مسجلة' : 'No audit logs found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}'''

if settings_old in content:
    content = content.replace(settings_old, settings_new)
else:
    print("Could not find the target text to replace.")

with open('app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
