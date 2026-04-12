import { useState, useEffect } from 'react';
import { Users, FileText, Trash2, Search } from 'lucide-react';
import './Dashboard.css';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  level: string;
  createdAt: string;
}

interface Note {
  id: number;
  title: string;
  subject: string;
  category: string;
  level: string;
  createdAt: string;
  uploaderId: number;
  uploader: { username: string };
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'PRIMARY' | 'SECONDARY'>('PRIMARY');
  const [userQuery, setUserQuery] = useState('');
  const [noteQuery, setNoteQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('studybuddy_token');
      const [usersRes, notesRes] = await Promise.all([
        fetch('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/notes', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (notesRes.ok) setNotes(await notesRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = localStorage.getItem('studybuddy_token');
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete user');
      fetchData();
    } catch(err) {
      setActionError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      const token = localStorage.getItem('studybuddy_token');
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete note');
      fetchData();
    } catch(err) {
      setActionError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const filteredUsers = users.filter(u => {
    const isPrimary = u.level?.includes('Standard');
    if (activeTab === 'PRIMARY' && !isPrimary && u.role !== 'ADMIN') return false;
    if (activeTab === 'SECONDARY' && isPrimary && u.role !== 'ADMIN') return false;
    if (userQuery && !u.username.toLowerCase().includes(userQuery.toLowerCase())) return false;
    return true;
  });

  const filteredNotes = notes.filter(n => {
    const isPrimary = n.level?.includes('Standard');
    if (activeTab === 'PRIMARY' && !isPrimary) return false;
    if (activeTab === 'SECONDARY' && isPrimary) return false;
    if (noteQuery && !n.title.toLowerCase().includes(noteQuery.toLowerCase()) && !n.subject.toLowerCase().includes(noteQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="dashboard">
      <div className="dashboard-header" style={{borderBottom: '1px solid var(--bg-glass-border)', paddingBottom: '1.5rem'}}>
        <div>
          <h2 className="greeting" style={{color: 'var(--accent-secondary)'}}>System Admin Portal 🛡️</h2>
          <p className="subtitle">Manage users, content, and monitor platform health.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel" style={{borderColor: 'rgba(255,117,76, 0.3)'}}>
          <div className="icon-wrapper bg-blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Users</p>
            <h3 className="stat-value">{users.length}</h3>
          </div>
        </div>
        <div className="stat-card glass-panel" style={{borderColor: 'rgba(77,161,255, 0.3)'}}>
          <div className="icon-wrapper" style={{color: '#4DA1FF', background: 'rgba(77, 161, 255, 0.2)'}}>
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Resources</p>
            <h3 className="stat-value">{notes.length}</h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', marginBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('PRIMARY')}
          style={{ padding: '0.75rem 2rem', fontWeight: 600, background: activeTab === 'PRIMARY' ? 'var(--accent-primary)' : 'transparent', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', transition: 'all 0.3s' }}
        >
          Primary Section (Std 5-8)
        </button>
        <button 
          onClick={() => setActiveTab('SECONDARY')}
          style={{ padding: '0.75rem 2rem', fontWeight: 600, background: activeTab === 'SECONDARY' ? 'var(--accent-secondary)' : 'transparent', border: '1px solid var(--accent-secondary)', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', transition: 'all 0.3s' }}
        >
          Secondary Section (Form 1-4)
        </button>
      </div>

      <div className="dashboard-content" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
        
        {/* USERS DIRECTORY */}
        <div className="glass-panel" style={{padding: '1.5rem', maxHeight: '600px', overflowY: 'auto'}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <h3 className="section-title" style={{marginBottom: 0}}>User Directory</h3>
             <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '4px', gap: '0.5rem' }}>
               <Search size={14} color="var(--text-secondary)" />
               <input type="text" placeholder="Filter users..." value={userQuery} onChange={e => setUserQuery(e.target.value)} style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '0.85rem' }} />
             </div>
          </div>
          {actionError && <div style={{background: 'rgba(255,0,0,0.1)', color: '#ff5050', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem'}}>{actionError}</div>}
          
          {loading ? <p>Loading users...</p> : (
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem'}}>
              <thead>
                <tr style={{borderBottom: '1px solid var(--bg-glass-border)'}}>
                  <th style={{padding: '0.75rem', color: 'var(--text-secondary)'}}>Username</th>
                  <th style={{padding: '0.75rem', color: 'var(--text-secondary)'}}>Level</th>
                  <th style={{padding: '0.75rem', color: 'var(--text-secondary)'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                    <td style={{padding: '0.75rem'}}>{u.username} <span style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>({u.role})</span></td>
                    <td style={{padding: '0.75rem', color: 'var(--text-secondary)'}}>{u.level || 'N/A'}</td>
                    <td style={{padding: '0.75rem'}}>
                      {u.role !== 'ADMIN' && (
                        <button onClick={() => handleDeleteUser(u.id)} className="glass-button icon-only" style={{color: '#ff5050', padding: '0.3rem'}}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* RESOURCE MANAGEMENT */}
        <div className="glass-panel" style={{padding: '1.5rem', maxHeight: '600px', overflowY: 'auto'}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <h3 className="section-title" style={{marginBottom: 0}}>Resources</h3>
             <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '4px', gap: '0.5rem' }}>
               <Search size={14} color="var(--text-secondary)" />
               <input type="text" placeholder="Filter notes..." value={noteQuery} onChange={e => setNoteQuery(e.target.value)} style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '0.85rem' }} />
             </div>
          </div>
          
          {loading ? <p>Loading resources...</p> : (
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem'}}>
              <thead>
                <tr style={{borderBottom: '1px solid var(--bg-glass-border)'}}>
                  <th style={{padding: '0.75rem', color: 'var(--text-secondary)'}}>Title</th>
                  <th style={{padding: '0.75rem', color: 'var(--text-secondary)'}}>Subject/Level</th>
                  <th style={{padding: '0.75rem', color: 'var(--text-secondary)'}}>Uploader</th>
                  <th style={{padding: '0.75rem', color: 'var(--text-secondary)'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotes.map((n) => (
                  <tr key={n.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                    <td style={{padding: '0.75rem', fontWeight: 500}}>{n.title}</td>
                    <td style={{padding: '0.75rem', color: 'var(--text-secondary)'}}>{n.subject} <br/><span style={{fontSize:'0.7rem'}}>{n.level}</span></td>
                    <td style={{padding: '0.75rem'}}>{n.uploader?.username || 'Unknown'}</td>
                    <td style={{padding: '0.75rem'}}>
                      <button onClick={() => handleDeleteNote(n.id)} className="glass-button icon-only" style={{color: '#ff5050', padding: '0.3rem'}}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredNotes.length === 0 && (
                   <tr><td colSpan={4} style={{padding: '1rem', textAlign: 'center', color: 'var(--text-muted)'}}>No resources found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
