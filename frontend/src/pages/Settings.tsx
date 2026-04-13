import { useState, useRef, useCallback } from 'react';
import { User, Bell, Shield, Palette, Code2, Globe, Phone, GitBranch, Camera, Check, Loader2, Eye, EyeOff, Menu } from 'lucide-react';
// Developer photos
import devPhoto from '../assets/dev-photo.jpeg';
import empPhoto from '../assets/emp.jpeg';

const API = '';
function authHeaders() {
  const token = localStorage.getItem('studybuddy_token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

const tabs = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'developers', label: 'Developers', icon: Code2 },
];

// ── Appearance themes ──────────────────────────────────────────────────────
const THEMES = [
  { name: 'Deep Purple',   primary: '#6C5DD3', secondary: '#FF754C', bg: '#0A0A0F', bg2: '#13131A', glow: 'rgba(108,93,211,0.5)' },
  { name: 'Ocean Blue',    primary: '#4DA1FF', secondary: '#00C875', bg: '#060D1F', bg2: '#0D1828', glow: 'rgba(77,161,255,0.5)' },
  { name: 'Sunset Orange', primary: '#FF754C', secondary: '#FFD166', bg: '#110A06', bg2: '#1C1008', glow: 'rgba(255,117,76,0.5)' },
  { name: 'Forest Green',  primary: '#00C875', secondary: '#4DA1FF', bg: '#040F0A', bg2: '#0A1C11', glow: 'rgba(0,200,117,0.5)' },
  { name: 'Rose Gold',     primary: '#E8698B', secondary: '#F9C784', bg: '#110607', bg2: '#1C0C0F', glow: 'rgba(232,105,139,0.5)' },
  { name: 'Midnight Cyan', primary: '#00D4FF', secondary: '#A855F7', bg: '#030C10', bg2: '#061420', glow: 'rgba(0,212,255,0.5)' },
];

function applyTheme(theme: typeof THEMES[0]) {
  const r = document.documentElement.style;
  r.setProperty('--accent-primary', theme.primary);
  r.setProperty('--accent-secondary', theme.secondary);
  r.setProperty('--accent-glow', theme.glow);
  r.setProperty('--bg-primary', theme.bg);
  r.setProperty('--bg-secondary', theme.bg2);
  localStorage.setItem('sb_theme', JSON.stringify(theme));
}

// Apply saved theme on load
(() => {
  try {
    const saved = localStorage.getItem('sb_theme');
    if (saved) applyTheme(JSON.parse(saved));
  } catch { /* ignore */ }
})();

interface SettingsProps {
  setIsAuthenticated?: (val: boolean) => void;
}

export default function Settings({ setIsAuthenticated }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [showMenu, setShowMenu] = useState(false);

  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('studybuddy_user') || '{}'); } catch { return {}; } })();

  // ── Profile state ────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    username: storedUser.username || '',
    email: storedUser.email || '',
    level: storedUser.level || 'Form 4',
    canViewAllSecondary: storedUser.canViewAllSecondary || false,
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(storedUser.profilePicUrl || storedUser.avatar || null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setAvatarSrc(src);
      const updated = { ...storedUser, avatar: src };
      localStorage.setItem('studybuddy_user', JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Preview is applied via body style after save; no local state needed
      void (reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setProfileSaving(true); setProfileMsg(null);
    try {
      const formData = new FormData();
      formData.append('username', profileForm.username);
      formData.append('email', profileForm.email);
      formData.append('level', profileForm.level);
      formData.append('canViewAllSecondary', String(profileForm.canViewAllSecondary));
      
      const pFile = fileRef.current?.files?.[0];
      if (pFile) formData.append('profilePic', pFile);
      const bFile = bgFileRef.current?.files?.[0];
      if (bFile) formData.append('backgroundPic', bFile);

      const token = localStorage.getItem('studybuddy_token') || '';
      const res = await fetch(`${API}/api/auth/update-profile`, {
        method: 'PUT', 
        headers: { Authorization: `Bearer ${token}` }, // no content-type so fetch sets boundary
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setProfileMsg({ type: 'error', text: data.message }); return; }
      const updated = { ...storedUser, ...data, avatar: data.profilePicUrl || storedUser.avatar };
      localStorage.setItem('studybuddy_user', JSON.stringify(updated));
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      
      // Update backgrounds right away if possible
      if (data.backgroundImageUrl) {
        document.body.style.backgroundImage = `url(${data.backgroundImageUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      }
    } catch { setProfileMsg({ type: 'error', text: 'Network error. Make sure the server is running.' }); }
    finally { setProfileSaving(false); }
  };

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('studybuddy_token');
      localStorage.removeItem('studybuddy_user');
      if (setIsAuthenticated) {
        setIsAuthenticated(false);
      } else {
        window.location.href = '/login';
      }
    }
  };

  // ── Notifications state ───────────────────────────────────────────────────
  const [notifToggles, setNotifToggles] = useState({ uploads: true, groups: true, tutor: false });

  // ── Password state ────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  const savePassword = async () => {
    setPwMsg(null);
    if (!pwForm.currentPassword || !pwForm.newPassword) { setPwMsg({ type: 'error', text: 'All fields are required' }); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg({ type: 'error', text: 'New passwords do not match' }); return; }
    setPwSaving(true);
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwMsg({ type: 'error', text: data.message }); return; }
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { setPwMsg({ type: 'error', text: 'Network error. Make sure the server is running.' }); }
    finally { setPwSaving(false); }
  };

  // ── Appearance state ──────────────────────────────────────────────────────
  const savedTheme = (() => { try { return JSON.parse(localStorage.getItem('sb_theme') || 'null'); } catch { return null; } })();
  const [activeTheme, setActiveTheme] = useState<typeof THEMES[0]>(savedTheme || THEMES[0]);
  const [customPrimary, setCustomPrimary] = useState(activeTheme.primary);
  const [customSecondary, setCustomSecondary] = useState(activeTheme.secondary);
  const [customBg, setCustomBg] = useState(activeTheme.bg);

  const applyCustom = useCallback(() => {
    const custom = { name: 'Custom', primary: customPrimary, secondary: customSecondary, bg: customBg, bg2: customBg, glow: `${customPrimary}80` };
    applyTheme(custom);
    setActiveTheme(custom);
  }, [customPrimary, customSecondary, customBg]);

  // ── Shared styles ─────────────────────────────────────────────────────────
  const msgStyle = (type: 'success' | 'error') => ({
    color: type === 'success' ? '#00C875' : '#FF754C',
    background: type === 'success' ? 'rgba(0,200,117,0.08)' : 'rgba(255,117,76,0.08)',
    border: `1px solid ${type === 'success' ? 'rgba(0,200,117,0.3)' : 'rgba(255,117,76,0.3)'}`,
    padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem',
  });

  const pwInputWrapper = (show: boolean, toggle: () => void, field: keyof typeof pwForm, placeholder: string) => (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        className="glass-input"
        placeholder={placeholder}
        value={pwForm[field]}
        onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
        style={{ paddingRight: '3rem' }}
      />
      <button
        onClick={toggle}
        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  const tabBgMap: Record<string, string> = {
    profile: '#161426',
    notifications: '#0A1C14',
    privacy: '#28140D',
    appearance: '#0B2026',
    developers: '#281219',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', position: 'relative', background: tabBgMap[activeTab] || 'var(--bg-secondary)', transition: 'background 0.3s' }}>

      {/* ── Menu Toggle Header ── */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--bg-glass-border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
           onClick={() => setShowMenu(!showMenu)}
           className="glass-button" 
           style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}
        >
          <Menu size={18} />
          <span style={{ fontWeight: 600 }}>{tabs.find(t => t.id === activeTab)?.label} ▾</span>
        </button>
      </div>

      {/* ── Overlay Menu List ── */}
      {showMenu && (
        <div className="glass-panel animate-fade-in" style={{
           position: 'absolute', top: '70px', left: '1rem', width: '220px', zIndex: 100,
           padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
           boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          <h3 style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem', marginBottom: '0.25rem' }}>Menu Options</h3>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowMenu(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)',
                fontWeight: 500, fontSize: '0.9rem', textAlign: 'left', width: '100%',
                transition: 'all 0.2s',
                background: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Content Panel ── */}
      <div className="animate-fade-in" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>

        {/* ══ PROFILE ══ */}
        {activeTab === 'profile' && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>My Profile</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Customise your public identity and personal info.</p>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '90px', height: '90px', borderRadius: '50%',
                  border: '3px solid var(--accent-primary)', boxShadow: '0 0 20px var(--accent-glow)',
                  overflow: 'hidden', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {avatarSrc && avatarSrc.startsWith('/uploads') ? <img src={`${avatarSrc}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                     avatarSrc ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <User size={36} color="#fff" />}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'var(--accent-primary)', border: '2px solid var(--bg-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <Camera size={13} color="#fff" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{storedUser.username || 'Student'}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{storedUser.phone || ''}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{storedUser.role || 'USER'} · {storedUser.level || 'Form 4'}</p>
                <button onClick={() => bgFileRef.current?.click()} className="glass-button" style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                   Change Background Image
                </button>
                <input ref={bgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgChange} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Username</label>
                <input className="glass-input" value={profileForm.username} onChange={e => setProfileForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Phone (cannot change)</label>
                <input className="glass-input" value={storedUser.phone || ''} disabled style={{ opacity: 0.5 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Email (optional)</label>
                <input className="glass-input" placeholder="Add email..." value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Education Level</label>
                <select className="glass-input" value={profileForm.level} onChange={e => setProfileForm(f => ({ ...f, level: e.target.value }))}>
                  <option value="Standard 5">Standard 5</option>
                  <option value="Standard 6">Standard 6</option>
                  <option value="Standard 7">Standard 7</option>
                  <option value="Standard 8">Standard 8</option>
                  <option value="Form 1">Form 1</option>
                  <option value="Form 2">Form 2</option>
                  <option value="Form 3">Form 3</option>
                  <option value="Form 4">Form 4</option>
                </select>
              </div>
              {profileForm.level.includes("Form") && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input type="checkbox" id="canViewAll" checked={profileForm.canViewAllSecondary} onChange={e => setProfileForm(f => ({ ...f, canViewAllSecondary: e.target.checked }))} />
                  <label htmlFor="canViewAll" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>View notes for all secondary forms</label>
                </div>
              )}

              {profileMsg && <p style={msgStyle(profileMsg.type)}>{profileMsg.text}</p>}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <button className="glass-button primary" onClick={saveProfile} disabled={profileSaving}>
                  {profileSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="glass-button" onClick={handleSignOut} style={{ borderColor: '#FF754C', color: '#FF754C' }}>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ NOTIFICATIONS ══ */}
        {activeTab === 'notifications' && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Notifications</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Control how you receive alerts.</p>
            {[
              { key: 'uploads' as const, label: 'New uploads in your subjects', desc: 'Get notified when someone uploads a note or past paper' },
              { key: 'groups' as const, label: 'Study Group activity', desc: 'Messages and announcements from your groups' },
              { key: 'tutor' as const, label: 'Tutor suggestions', desc: 'Weekly study tips tailored to your level' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--bg-glass-border)' }}>
                <div>
                  <p style={{ fontWeight: 500 }}>{item.label}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifToggles(t => ({ ...t, [item.key]: !t[item.key] }))}
                  style={{
                    width: '48px', height: '26px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                    background: notifToggles[item.key] ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.3s', position: 'relative', flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '3px', left: notifToggles[item.key] ? 'calc(100% - 22px)' : '3px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#fff', transition: 'left 0.3s',
                  }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ══ PRIVACY & SECURITY ══ */}
        {activeTab === 'privacy' && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Privacy & Security</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Keep your account safe with a strong password.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--bg-glass-border)' }}>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Change Password</h3>
                {pwInputWrapper(showPw.current, () => setShowPw(s => ({ ...s, current: !s.current })), 'currentPassword', 'Current password')}
                {pwInputWrapper(showPw.new, () => setShowPw(s => ({ ...s, new: !s.new })), 'newPassword', 'New password')}
                {pwInputWrapper(showPw.confirm, () => setShowPw(s => ({ ...s, confirm: !s.confirm })), 'confirmPassword', 'Confirm new password')}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Password must be 7+ characters with uppercase, lowercase, and a symbol.
                </p>
                {pwMsg && <p style={msgStyle(pwMsg.type)}>{pwMsg.text}</p>}
                <button className="glass-button primary" onClick={savePassword} disabled={pwSaving} style={{ width: 'fit-content' }}>
                  {pwSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Shield size={16} />}
                  {pwSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ APPEARANCE ══ */}
        {activeTab === 'appearance' && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Appearance</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Personalise StudyBuddy completely — colours change across the whole app instantly.</p>

            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preset Themes</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              {THEMES.map(theme => {
                const isActive = activeTheme.name === theme.name;
                return (
                  <button
                    key={theme.name}
                    onClick={() => { applyTheme(theme); setActiveTheme(theme); setCustomPrimary(theme.primary); setCustomSecondary(theme.secondary); setCustomBg(theme.bg); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      outline: isActive ? `2px solid var(--accent-primary)` : '2px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                        boxShadow: isActive ? `0 4px 20px ${theme.glow}` : 'none',
                        transition: 'all 0.3s',
                      }} />
                      {isActive && (
                        <div style={{
                          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Check size={20} color="#fff" />
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{theme.name}</span>
                  </button>
                );
              })}
            </div>

            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Custom Colours</h4>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
              {[
                { label: 'Primary Accent', val: customPrimary, set: setCustomPrimary },
                { label: 'Secondary Accent', val: customSecondary, set: setCustomSecondary },
                { label: 'Background', val: customBg, set: setCustomBg },
              ].map(({ label, val, set }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={val}
                      onChange={e => set(e.target.value)}
                      style={{ width: '48px', height: '48px', border: '2px solid var(--bg-glass-border)', borderRadius: '8px', cursor: 'pointer', background: 'none', padding: '2px' }}
                    />
                    <input
                      className="glass-input"
                      value={val}
                      onChange={e => set(e.target.value)}
                      style={{ width: '110px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="glass-button primary" onClick={applyCustom} style={{ marginBottom: '1rem' }}>
              <Palette size={16} /> Apply Custom Theme
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Theme is saved and persists across page refreshes.</p>
          </div>
        )}

        {/* ══ DEVELOPERS ══ */}
        {activeTab === 'developers' && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Developers</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>The minds behind this platform.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Wisdom Malata */}
              <div style={{
                display: 'flex', gap: '2rem', alignItems: 'flex-start',
                padding: '2rem', borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(108,93,211,0.12), rgba(255,117,76,0.05))',
                border: '1px solid rgba(108,93,211,0.3)', flexWrap: 'wrap',
              }}>
                <div style={{ flexShrink: 0 }}>
                  <img
                    src={devPhoto}
                    alt="Wisdom Malata"
                    style={{
                      width: '130px', height: '130px', borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--accent-primary)',
                      boxShadow: '0 0 24px var(--accent-glow)',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Wisdom Malata</h3>
                    <span style={{
                      background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                      padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem',
                      fontWeight: 700, color: '#fff', letterSpacing: '0.05em',
                    }}>AQUA_SLOVIC</span>
                  </div>
                  <p style={{ color: 'var(--accent-secondary)', fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>
                    Founder & Lead Developer
                  </p>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Wisdom Malata is the visionary architect behind StudyBuddy. Driven by a mission to democratize
                    education in Malawi, he engineered the entire platform from the core database systems to
                    the premium user experience. His dedication ensures that every student has a digital
                    partner in their academic journey.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <a href="https://github.com/Aqua-Slovic" target="_blank" rel="noopener noreferrer" className="glass-button" style={{ textDecoration: 'none', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                      <GitBranch size={15} /> GitHub
                    </a>
                  </div>
                </div>
              </div>

              {/* Prince Mtipe */}
              <div style={{
                display: 'flex', gap: '2rem', alignItems: 'flex-start',
                padding: '2rem', borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(77,161,255,0.12), rgba(0,200,117,0.05))',
                border: '1px solid rgba(77,161,255,0.3)', flexWrap: 'wrap',
              }}>
                <div style={{ flexShrink: 0 }}>
                  <img
                    src={empPhoto}
                    alt="Prince Mtipe"
                    style={{
                      width: '130px', height: '130px', borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #4DA1FF',
                      boxShadow: '0 0 24px rgba(77,161,255,0.4)',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Prince Mtipe</h3>
                    <span style={{
                      background: 'linear-gradient(90deg, #4DA1FF, #00C875)',
                      padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem',
                      fontWeight: 700, color: '#fff', letterSpacing: '0.05em',
                    }}>EMPRIN</span>
                  </div>
                  <p style={{ color: '#4DA1FF', fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>
                    Front End Developer & Software Engineer
                  </p>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    "I believe that software should not only be functional but beautiful and intuitive. 
                    As a Front End Developer, my goal with StudyBuddy is to create an interface that 
                    inspires students to learn. Every pixel and every interaction is designed to make 
                    studying feel like a premium experience, because every student deserves the best 
                    tools to succeed."
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="glass-button" style={{ gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                      <Code2 size={15} /> Software Engineer
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Credits */}
            <div style={{ marginTop: '2rem', padding: '1rem 1.5rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--bg-glass-border)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Welcome to <strong style={{ color: 'var(--text-primary)' }}>StudyBuddy</strong>. The ultimate study platform.
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                © {new Date().getFullYear()} Wisdom Malata / Aqua_Slovic. All rights reserved.
              </p>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select.glass-input option { background: var(--bg-secondary, #13131A); color: #fff; }
      `}</style>
    </div>
  );
}
