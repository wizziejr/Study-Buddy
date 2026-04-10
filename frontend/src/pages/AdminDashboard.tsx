import { useState, useEffect } from 'react';
import { Users, FileText, Activity, Trash2 } from 'lucide-react';
import './Dashboard.css';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('studybuddy_token');
      const res = await fetch('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if(res.ok) setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = localStorage.getItem('studybuddy_token');
      const res = await fetch(`http://localhost:5000/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete');
      
      // Update UI 
      fetchUsers();
    } catch(err: any) {
      setActionError(err.message);
    }
  };

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
            <h3 className="stat-value">458</h3>
          </div>
        </div>
        <div className="stat-card glass-panel" style={{borderColor: 'rgba(108,93,211, 0.3)'}}>
          <div className="icon-wrapper" style={{color: 'var(--accent-primary)', background: 'rgba(108,93,211,0.2)'}}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Security Audits</p>
            <h3 className="stat-value">All Clear</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-content" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div className="glass-panel" style={{padding: '1.5rem'}}>
          <h3 className="section-title">User Directory</h3>
          {actionError && <div style={{background: 'rgba(255,0,0,0.1)', color: '#ff5050', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem'}}>{actionError}</div>}
          {loading ? <p>Loading users...</p> : (
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid var(--bg-glass-border)'}}>
                    <th style={{padding: '1rem', color: 'var(--text-secondary)'}}>Username</th>
                    <th style={{padding: '1rem', color: 'var(--text-secondary)'}}>Email</th>
                    <th style={{padding: '1rem', color: 'var(--text-secondary)'}}>Role</th>
                    <th style={{padding: '1rem', color: 'var(--text-secondary)'}}>Level</th>
                    <th style={{padding: '1rem', color: 'var(--text-secondary)'}}>Joined</th>
                    <th style={{padding: '1rem', color: 'var(--text-secondary)'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s'}} className="hover:bg-gray-800">
                      <td style={{padding: '1rem', fontWeight: 600}}>{u.username}</td>
                      <td style={{padding: '1rem', color: 'var(--text-secondary)'}}>{u.email}</td>
                      <td style={{padding: '1rem'}}>
                        <span style={{background: u.role==='ADMIN' ? 'rgba(255,117,76,0.2)' : 'rgba(108,93,211,0.2)', color: u.role==='ADMIN' ? 'var(--accent-secondary)' : 'var(--accent-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600}}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{padding: '1rem'}}>{u.level || 'N/A'}</td>
                      <td style={{padding: '1rem', color: 'var(--text-secondary)'}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{padding: '1rem'}}>
                        {u.role !== 'ADMIN' && (
                          <button onClick={() => handleDeleteUser(u.id)} className="glass-button icon-only" style={{color: '#ff5050', padding: '0.4rem'}}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
