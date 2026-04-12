import { useState, useEffect } from 'react';
import { Users, FileText, Trash2, Search, ArrowLeft, X, Calendar, Flame, Clock, Award, Shield, Mail, Phone as PhoneIcon } from 'lucide-react';
import './Dashboard.css';

interface User {
  id: number;
  username: string;
  email: string | null;
  phone: string;
  role: string;
  level: string | null;
  points: number;
  createdAt: string;
  profilePicUrl: string | null;
  backgroundImageUrl: string | null;
  currentStreak: number;
  studyTimeDaily: number;
  canViewAllSecondary: boolean;
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
  const [view, setView] = useState<'dashboard' | 'users'>('dashboard');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
        <button 
          className="stat-card glass-panel" 
          onClick={() => setView('users')}
          style={{borderColor: 'rgba(255,117,76, 0.4)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.3s'}}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div className="icon-wrapper bg-blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Users</p>
            <h3 className="stat-value" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              {users.length}
              <span style={{fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px'}}>View List</span>
            </h3>
          </div>
        </button>
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

      {view === 'dashboard' ? (
        <>
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
            
            {/* USERS DIRECTORY (Simplified) */}
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
                        <td style={{padding: '0.75rem'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            {u.profilePicUrl ? (
                              <img src={u.profilePicUrl} style={{width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover'}} />
                            ) : (
                              <div style={{width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Users size={12} /></div>
                            )}
                            <span>{u.username}</span>
                            {u.role === 'ADMIN' && <Shield size={12} style={{color: 'var(--accent-secondary)'}} title="Administrator" />}
                          </div>
                        </td>
                        <td style={{padding: '0.75rem', color: 'var(--text-secondary)'}}>{u.level || 'N/A'}</td>
                        <td style={{padding: '0.75rem'}}>
                          {u.role !== 'ADMIN' && (
                            <button onClick={() => handleDeleteUser(u.id)} className="glass-button icon-only" style={{color: '#ff5050', padding: '0.3rem', border: 'none'}}>
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
                          <button onClick={() => handleDeleteNote(n.id)} className="glass-button icon-only" style={{color: '#ff5050', padding: '0.3rem', border: 'none'}}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        /* FULL USER DIRECTORY VIEW */
        <div className="animate-fade-in" style={{marginTop: '2rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
            <button className="glass-button icon-only" onClick={() => setView('dashboard')} style={{padding: '0.6rem'}}>
              <ArrowLeft size={18} />
            </button>
            <h2 className="greeting" style={{fontSize: '1.5rem'}}>User Management Console</h2>
          </div>

          <div className="glass-panel" style={{padding: '2rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
              <div>
                <h3 style={{fontSize: '1.2rem', marginBottom: '0.25rem'}}>All Registered Users</h3>
                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Manage {users.length} accounts currently on the platform.</p>
              </div>
              <div style={{display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', width: '350px'}}>
                <Search size={18} style={{color: 'var(--text-muted)', marginRight: '0.75rem'}} />
                <input 
                  type="text" 
                  placeholder="Search by name, email, phone or level..." 
                  value={userQuery} 
                  onChange={e => setUserQuery(e.target.value)} 
                  style={{background: 'none', border: 'none', color: '#fff', width: '100%', outline: 'none'}}
                />
              </div>
            </div>

            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem'}}>
                <thead>
                  <tr style={{textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem'}}>
                    <th style={{padding: '1rem'}}>USER</th>
                    <th style={{padding: '1rem'}}>CONTACT INFO</th>
                    <th style={{padding: '1rem'}}>LEVEL</th>
                    <th style={{padding: '1rem'}}>ROLE</th>
                    <th style={{padding: '1rem'}}>POINTS</th>
                    <th style={{padding: '1rem', textAlign: 'right'}}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => 
                    u.username.toLowerCase().includes(userQuery.toLowerCase()) || 
                    u.email?.toLowerCase().includes(userQuery.toLowerCase()) ||
                    u.phone.includes(userQuery) ||
                    u.level?.toLowerCase().includes(userQuery.toLowerCase())
                  ).map(u => (
                    <tr key={u.id} className="glass-panel" style={{background: 'rgba(255,255,255,0.03)', borderRadius: '12px'}}>
                      <td style={{padding: '1rem', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                          {u.profilePicUrl ? (
                            <img src={u.profilePicUrl} style={{width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover'}} />
                          ) : (
                            <div style={{width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Users size={20} /></div>
                          )}
                          <div>
                            <p style={{fontWeight: 600}}>{u.username}</p>
                            <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}><Calendar size={10} style={{display: 'inline', marginRight: '4px'}} /> Since {new Date(u.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{padding: '1rem'}}>
                        <p style={{fontSize: '0.85rem'}}><Mail size={12} style={{display: 'inline', marginRight: '6px', opacity: 0.6}} /> {u.email || 'No email'}</p>
                        <p style={{fontSize: '0.85rem', marginTop: '0.2rem'}}><PhoneIcon size={12} style={{display: 'inline', marginRight: '6px', opacity: 0.6}} /> {u.phone}</p>
                      </td>
                      <td style={{padding: '1rem'}}>
                        <span style={{padding: '2px 8px', background: 'rgba(108,93,211,0.1)', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid rgba(108,93,211,0.2)'}}>{u.level || 'N/A'}</span>
                      </td>
                      <td style={{padding: '1rem'}}>
                        <span style={{color: u.role === 'ADMIN' ? 'var(--accent-secondary)' : 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: u.role === 'ADMIN' ? 600 : 400}}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{padding: '1rem'}}>
                        <p style={{fontWeight: 700, color: 'var(--accent-primary)'}}>{u.points}</p>
                      </td>
                      <td style={{padding: '1rem', textAlign: 'right', borderTopRightRadius: '12px', borderBottomRightRadius: '12px'}}>
                        <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
                           <button className="glass-button" onClick={() => setSelectedUser(u)} style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem'}}>View Profile</button>
                           {u.role !== 'ADMIN' && (
                             <button className="glass-button" onClick={() => handleDeleteUser(u.id)} style={{background: 'rgba(255,80,80,0.1)', borderColor: 'rgba(255,80,80,0.2)', color: '#ff5050', padding: '0.4rem'}}>
                               <Trash2 size={16} />
                             </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE MODAL */}
      {selectedUser && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'}}>
          <div className="glass-panel animate-fade-in" style={{width: '100%', maxWidth: '600px', padding: '2.5rem', position: 'relative', overflow: 'hidden'}}>
            <button 
              onClick={() => setSelectedUser(null)} 
              style={{position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', zIndex: 10}}
            >
              <X size={20} />
            </button>

            {/* Profile Header */}
            <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <div style={{position: 'relative'}}>
                {selectedUser.profilePicUrl ? (
                  <img src={selectedUser.profilePicUrl} style={{width: '90px', height: '90px', borderRadius: '24px', objectFit: 'cover', border: '2px solid var(--accent-primary)'}} />
                ) : (
                  <div style={{width: '90px', height: '90px', borderRadius: '24px', background: 'rgba(108,93,211,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--accent-primary)'}}>
                    <Users size={40} color="var(--accent-primary)" />
                  </div>
                )}
                {selectedUser.role === 'ADMIN' && (
                  <div style={{position: 'absolute', bottom: '-8px', right: '-8px', background: 'var(--accent-secondary)', padding: '4px', borderRadius: '50%', border: '2px solid #000'}}>
                    <Shield size={14} color="#fff" />
                  </div>
                )}
              </div>
              <div>
                <h2 style={{fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.1rem'}}>{selectedUser.username}</h2>
                <p style={{color: 'var(--text-secondary)', fontSize: '1rem'}}>{selectedUser.level || 'Not specified'}</p>
                <div style={{display: 'flex', gap: '0.75rem', marginTop: '0.5rem'}}>
                  <span style={{fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '2px 10px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)'}}>ID: #{selectedUser.id}</span>
                  <span style={{fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600}}>Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2.5rem'}}>
              <div className="glass-panel" style={{padding: '1rem', textAlign: 'center', background: 'rgba(255,117,76, 0.05)', borderColor: 'rgba(255,117,76,0.1)'}}>
                <Flame size={20} color="var(--accent-secondary)" style={{marginBottom: '0.5rem'}} />
                <p style={{fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px'}}>Streak</p>
                <p style={{fontSize: '1.2rem', fontWeight: 700}}>{selectedUser.currentStreak} Days</p>
              </div>
              <div className="glass-panel" style={{padding: '1rem', textAlign: 'center', background: 'rgba(108,93,211, 0.05)', borderColor: 'rgba(108,93,211,0.1)'}}>
                <Clock size={20} color="var(--accent-primary)" style={{marginBottom: '0.5rem'}} />
                <p style={{fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px'}}>Study Time</p>
                <p style={{fontSize: '1.2rem', fontWeight: 700}}>{selectedUser.studyTimeDaily}m</p>
              </div>
              <div className="glass-panel" style={{padding: '1rem', textAlign: 'center', background: 'rgba(0,210,135, 0.05)', borderColor: 'rgba(0,210,135,0.1)'}}>
                <Award size={20} color="#00D287" style={{marginBottom: '0.5rem'}} />
                <p style={{fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px'}}>Points</p>
                <p style={{fontSize: '1.2rem', fontWeight: 700}}>{selectedUser.points}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <div style={{width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Mail size={16} color="var(--text-secondary)"/></div>
                <div>
                  <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Email Address</p>
                  <p style={{fontSize: '0.95rem'}}>{selectedUser.email || 'No email provided'}</p>
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <div style={{width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><PhoneIcon size={16} color="var(--text-secondary)"/></div>
                <div>
                  <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Phone Number</p>
                  <p style={{fontSize: '0.95rem'}}>{selectedUser.phone}</p>
                </div>
              </div>
            </div>

            <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
               <button className="glass-button primary w-full" onClick={() => setSelectedUser(null)}>Done Viewing</button>
               {selectedUser.role !== 'ADMIN' && (
                 <button className="glass-button" onClick={() => { handleDeleteUser(selectedUser.id); setSelectedUser(null); }} style={{borderColor: '#ff5050', color: '#ff5050'}}>Delete Account</button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
