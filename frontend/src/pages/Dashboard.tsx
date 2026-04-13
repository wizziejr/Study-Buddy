import { useState, useEffect } from 'react';
import { BookOpen, Brain, Clock, Flame, Phone } from 'lucide-react';
import './Dashboard.css';

interface UserData {
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  level?: string;
  phone?: string;
  points?: number;
  currentStreak?: number;
  studyTimeDaily?: number;
  canViewAllSecondary?: boolean;
}

interface NoteData {
  id: number;
  title: string;
  subject: string;
  category: string;
  type: string;
  createdAt: string;
  uploaderId: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<UserData>({});
  const [myNotes, setMyNotes] = useState<NoteData[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('studybuddy_token');
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          localStorage.setItem('studybuddy_user', JSON.stringify(data));
        } else {
          setUser(JSON.parse(localStorage.getItem('studybuddy_user') || '{}'));
        }
      } catch {
        setUser(JSON.parse(localStorage.getItem('studybuddy_user') || '{}'));
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const token = localStorage.getItem('studybuddy_token');
        const res = await fetch('/api/notes', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setMyNotes(data.filter((n: NoteData) => n.uploaderId === user.id));
        }
      } catch { /* silent — fall through with empty notes */ }
    };
    if (user.id) fetchNotes();
  }, [user.id]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="greeting">Welcome back, {user.username || 'Student'}! </h2>
          <p className="subtitle">You're on a {user.currentStreak || 0}-day study streak. Keep it up!</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Phone size={14} /> {user.phone || 'No phone added'}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="icon-wrapper">
            <Flame size={24} className="icon-burn" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Current Streak</p>
            <h3 className="stat-value">{user.currentStreak || 0} Days</h3>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="icon-wrapper">
            <Clock size={24} className="icon-blue" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Study Time Today</p>
            <h3 className="stat-value">{user.studyTimeDaily || 0} mins</h3>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="icon-wrapper">
            <BookOpen size={24} className="icon-green" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Your Uploaded Resources</p>
            <h3 className="stat-value">{myNotes.length}</h3>
          </div>
        </div>
        <div className="stat-card glass-panel activate-ai">
          <div className="icon-wrapper">
            <Brain size={24} className="icon-purple" />
          </div>
          <div className="stat-info">
            <p className="stat-label">AI Interactions</p>
            <h3 className="stat-value">{user.points || 0}</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-section glass-panel">
          <h3 className="section-title">Your Uploaded Notes & Past Papers</h3>
          {myNotes.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>You haven't uploaded any resources yet.</p>
          ) : (
            <ul className="activity-list">
              {myNotes.map(note => (
                <li key={note.id} className="activity-item">
                  <div className={`activity-icon ${note.type === 'NOTE' ? 'bg-blue' : 'bg-purple'}`}>
                    <BookOpen size={16} />
                  </div>
                  <div className="activity-text" style={{ flex: 1 }}>
                    <p><strong>{note.title}</strong> — {note.subject}</p>
                    <span>{note.category} • {new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="recommended-section glass-panel">
          <h3 className="section-title">Account Details</h3>
          <div style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: '0.5rem' }}><strong>Role:</strong> {user.role}</p>
            <p style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> {user.email || 'N/A'}</p>
            <p style={{ marginBottom: '0.5rem' }}><strong>Level:</strong> {user.level || 'Not set'}</p>
            {user.level && user.level.includes('Form') && (
               <p style={{ marginBottom: '0.5rem' }}><strong>Views all secondary notes:</strong> {user.canViewAllSecondary ? 'Yes' : 'No'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
