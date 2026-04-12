import { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Menu, X, Settings as SettingsIcon } from 'lucide-react';
import './Navbar.css';
import Settings from '../pages/Settings';

interface NotificationItem {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface UserData {
  profilePicUrl?: string;
  level?: string;
  role?: string;
}

export default function Navbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<UserData>(() => {
    try {
      return JSON.parse(localStorage.getItem('studybuddy_user') || '{}');
    } catch { return {}; }
  });

  useEffect(() => {
    // Listen for localstorage changes if user updates profile
    const onStorage = () => {
      try {
        setUser(JSON.parse(localStorage.getItem('studybuddy_user') || '{}'));
      } catch { /* ignore malformed JSON */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);


  const markRead = async () => {
    const token = localStorage.getItem('studybuddy_token');
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  useEffect(() => {
    const poll = async () => {
      try {
        const tok = localStorage.getItem('studybuddy_token');
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${tok}` },
        });
        if (res.ok) setNotifications(await res.json());
      } catch { /* silent */ }
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      // Only close settings if click is fully outside the profile ref (which includes the dropdown)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('studybuddy_token');
    localStorage.removeItem('studybuddy_user');
    window.location.href = '/login';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="navbar glass-panel" style={{ zIndex: 100 }}>
      <div className="search-bar" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="mobile-toggle icon-btn" onClick={toggleSidebar} style={{ padding: '0.5rem', display: 'none' }}>
          <Menu size={20} />
        </button>
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search subjects, notes, past papers..."
          className="search-input"
        />
      </div>

      <div className="nav-actions">
        {/* 🔔 Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="icon-btn" onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markRead(); }}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-dot" style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: 'var(--accent-secondary)', display: 'block'
              }} />
            )}
          </button>

          {showNotifs && (
            <div className="glass-panel" style={{
              position: 'absolute', right: 0, top: '110%',
              width: '320px', maxHeight: '380px', overflowY: 'auto',
              zIndex: 1000, padding: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ fontWeight: 600 }}>Notifications</h4>
                <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
              {notifications.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No notifications yet.</p>
              ) : notifications.map(n => (
                <div key={n.id} style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: n.isRead ? 'transparent' : 'rgba(108,93,211,0.1)',
                  borderLeft: n.isRead ? 'none' : '3px solid var(--accent-primary)',
                  marginBottom: '0.5rem',
                }}>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{n.message}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div 
          className="user-profile my-profile-custom" 
          ref={profileRef}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <div className="avatar" style={{ overflow: 'hidden' }}>
            {user.profilePicUrl ? (
               <img src={`${user.profilePicUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
               <User size={20} />
            )}
          </div>
          <div className="user-info">
            <span className="user-name">My Profile</span>
            <span className="user-level">{user.level || user.role || 'Member'}</span>
          </div>
          <button 
             onClick={() => setShowSettings(!showSettings)}
             style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem', marginLeft: '0.25rem' }}
             title="Settings"
          >
             <SettingsIcon size={20} style={{ transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'rotate(45deg)'} onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'} />
          </button>

          {showSettings && (
            <div className="settings-dropdown glass-panel">
              <div style={{ height: '100%', overflowY: 'auto' }}>
                 <Settings setIsAuthenticated={handleSignOut} />
               </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .my-profile-custom {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.4rem 0.8rem;
          border-radius: 99px;
          border: 1px solid rgba(255,255,255, 0.1);
          transition: background 0.2s;
        }
        .my-profile-custom:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .settings-dropdown {
          position: absolute;
          top: 110%;
          right: 0;
          width: 600px;
          height: 500px;
          z-index: 1000;
          overflow: hidden;
          cursor: default;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
        }
        @media (max-width: 990px) {
          .my-profile-custom .user-info {
            display: none;
          }
          .settings-dropdown {
            position: fixed;
            top: 70px;
            left: 5%;
            right: 5%;
            width: 90%;
            height: calc(100vh - 90px);
          }
        }
      `}</style>
    </header>
  );
}
