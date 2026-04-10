import { useState } from 'react';
import { User, Bell, Shield, Palette, Code2, Globe, Phone, GitBranch } from 'lucide-react';

// Attempt to load wizzie.jpg — works automatically once the file is placed in /src/assets/
let devPhoto: string | undefined;
try {
  // @ts-ignore — dynamic import handled by Vite's glob import
  const modules = import.meta.glob('../assets/wizzie.jpg', { eager: true, as: 'url' });
  devPhoto = modules['../assets/wizzie.jpg'] as string;
} catch {
  devPhoto = undefined;
}

const tabs = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'developers', label: 'Developers', icon: Code2 },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('developers');
  const user = (() => { try { return JSON.parse(localStorage.getItem('studybuddy_user') || '{}'); } catch { return {}; } })();

  return (
    <div style={{ display: 'flex', gap: '1.5rem', minHeight: '100%' }}>

      {/* ── Sidebar Tabs ──────────────────────────────────────────────────── */}
      <div className="glass-panel" style={{ width: '220px', flexShrink: 0, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.5rem', marginBottom: '0.5rem' }}>Settings</h3>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)',
              fontWeight: 500, fontSize: '0.9rem', textAlign: 'left', width: '100%',
              transition: 'all 0.2s',
              background: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeTab === tab.id ? '0 4px 15px var(--accent-glow)' : 'none',
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content Panel ─────────────────────────────────────────────────── */}
      <div className="glass-panel animate-fade-in" style={{ flex: 1, padding: '2rem' }}>

        {/* ══ PROFILE ══ */}
        {activeTab === 'profile' && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>My Profile</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Update your personal information.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Username</label>
                <input className="glass-input" defaultValue={user.username || ''} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Phone</label>
                <input className="glass-input" defaultValue={user.phone || ''} disabled style={{ opacity: 0.6 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Email (optional)</label>
                <input className="glass-input" placeholder="Add email..." defaultValue={user.email || ''} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Education Level</label>
                <select className="glass-input" defaultValue={user.level || 'MSCE'}>
                  <option value="Standard 8">Standard 8</option>
                  <option value="JCE">JCE</option>
                  <option value="MSCE">MSCE</option>
                </select>
              </div>
              <button className="glass-button primary" style={{ width: 'fit-content' }}>Save Changes</button>
            </div>
          </div>
        )}

        {/* ══ NOTIFICATIONS ══ */}
        {activeTab === 'notifications' && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Notifications</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Control how you receive alerts.</p>
            {[
              { label: 'New uploads in your subjects', desc: 'Get notified when someone uploads a note or past paper' },
              { label: 'Study Group activity', desc: 'Messages and announcements from your groups' },
              { label: 'AI Tutor suggestions', desc: 'Weekly study tips tailored to your level' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--bg-glass-border)' }}>
                <div>
                  <p style={{ fontWeight: 500 }}>{item.label}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.desc}</p>
                </div>
                <div style={{ width: '44px', height: '24px', background: 'var(--accent-primary)', borderRadius: '99px', cursor: 'pointer' }} />
              </div>
            ))}
          </div>
        )}

        {/* ══ PRIVACY ══ */}
        {activeTab === 'privacy' && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Privacy & Security</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Keep your account safe.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
              <p style={{ fontWeight: 600, marginBottom: '-0.5rem' }}>Change Password</p>
              <input type="password" className="glass-input" placeholder="Current password" />
              <input type="password" className="glass-input" placeholder="New password" />
              <input type="password" className="glass-input" placeholder="Confirm new password" />
              <button className="glass-button primary" style={{ width: 'fit-content' }}>Update Password</button>
            </div>
          </div>
        )}

        {/* ══ APPEARANCE ══ */}
        {activeTab === 'appearance' && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Appearance</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Personalise your StudyBuddy experience.</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {[['#6C5DD3', 'Default Purple'], ['#FF754C', 'Sunset Orange'], ['#4DA1FF', 'Ocean Blue'], ['#00C875', 'Forest Green']].map(([color, name]) => (
                <div key={color} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: color, boxShadow: `0 4px 16px ${color}66` }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ DEVELOPERS ══ */}
        {activeTab === 'developers' && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Developers</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>The minds behind StudyBuddy AI.</p>

            {/* Developer Card */}
            <div style={{
              display: 'flex', gap: '2rem', alignItems: 'flex-start',
              padding: '2rem', borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(108,93,211,0.12), rgba(255,117,76,0.05))',
              border: '1px solid rgba(108,93,211,0.3)',
              flexWrap: 'wrap',
            }}>
              {/* Photo */}
              <div style={{ flexShrink: 0 }}>
                {devPhoto ? (
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
                ) : (
                  <div style={{
                    width: '130px', height: '130px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '3px solid var(--accent-primary)',
                    boxShadow: '0 0 24px var(--accent-glow)',
                    fontSize: '0.65rem', color: '#fff', gap: '0.25rem', padding: '0.5rem',
                    textAlign: 'center',
                  }}>
                    <User size={32} />
                    <span>Add wizzie.jpg to assets/</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Wisdom Malata</h3>
                  <span style={{
                    background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                    padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem',
                    fontWeight: 700, color: '#fff', letterSpacing: '0.05em',
                  }}>LEAD DEV</span>
                </div>
                <p style={{ color: 'var(--accent-secondary)', fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>
                  Full Stack Developer &amp; AI Engineer
                </p>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Wisdom Malata is a passionate Full Stack Developer and AI Engineer from Malawi,
                  dedicated to bridging the digital gap in African education. He designed and built
                  StudyBuddy AI from the ground up — from database architecture and REST API design
                  to the premium glassmorphism UI — with the mission of giving every Malawian student
                  access to world-class learning tools. Proficient in React, Node.js, Python, and
                  modern AI integration, Wisdom continues to push the boundary of what technology
                  can do for African youth.
                </p>

                {/* Links */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <a href="https://wisdom-malata.vercel.app" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <button className="glass-button" style={{ gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                      <Globe size={15} /> Portfolio
                    </button>
                  </a>
                  <a href="https://github.com/Aqua-Slovic" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <button className="glass-button" style={{ gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                      <GitBranch size={15} /> GitHub
                    </button>
                  </a>
                  <button className="glass-button" style={{ gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}>
                    <Phone size={15} /> +265 992 393 452
                  </button>
                </div>
              </div>
            </div>

            {/* Platform credits */}
            <div style={{ marginTop: '2rem', padding: '1rem 1.5rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--bg-glass-border)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-primary)' }}>StudyBuddy AI</strong> — Built for Malawian students (Standard 8, JCE & MSCE) · Powered by <strong style={{ color: 'var(--accent-primary)' }}>Google Gemini 1.5 Flash</strong> · Database hosted on <strong>SQLite + Prisma</strong> · SMS via <strong>Africa's Talking</strong>.
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                © {new Date().getFullYear()} Wisdom Malata / Aqua_Slovic. All rights reserved.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
