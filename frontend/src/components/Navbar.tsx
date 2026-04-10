import { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Menu, X } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('studybuddy_user') || '{}');
    } catch { return {}; }
  })();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('studybuddy_token');
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch { /* silent */ }
  };

  const markRead = async () => {
    const token = localStorage.getItem('studybuddy_token');
    await fetch('http://localhost:5000/api/notifications/mark-read', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="navbar glass-panel">
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

        <div className="user-profile">
          <div className="avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">{user.username || 'Student'}</span>
            <span className="user-level">{user.level || user.role || 'Member'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
