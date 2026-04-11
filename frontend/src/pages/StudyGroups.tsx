import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, X, MessageCircle, Trash2, Loader2 } from 'lucide-react';

interface Group {
  id: number;
  name: string;
  description?: string;
  level: string;
  creator: { id: number; username: string };
  _count: { messages: number };
  createdAt: string;
}

const API = 'http://localhost:5000';

function token() {
  return localStorage.getItem('studybuddy_token') || '';
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };
}

export default function StudyGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', level: 'MSCE' });
  const [activeChat, setActiveChat] = useState<Group | null>(null);
  const [messages, setMessages] = useState<{ id: number; content: string; sender: { username: string }; createdAt: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('studybuddy_user') || '{}'); } catch { return {}; }
  })();

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/groups`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) setGroups(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  // Poll messages every 5s while chat is open
  const fetchMessages = useCallback(async (groupId: number) => {
    try {
      const res = await fetch(`${API}/api/groups/${groupId}/messages`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) setMessages(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    fetchMessages(activeChat.id);
    const interval = setInterval(() => fetchMessages(activeChat.id), 5000);
    return () => clearInterval(interval);
  }, [activeChat, fetchMessages]);

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Group name is required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/api/groups`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to create group'); return; }
      setGroups(prev => [data, ...prev]);
      setShowModal(false);
      setForm({ name: '', description: '', level: 'MSCE' });
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (group: Group) => {
    if (!window.confirm(`Delete "${group.name}"?`)) return;
    try {
      const res = await fetch(`${API}/api/groups/${group.id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) setGroups(prev => prev.filter(g => g.id !== group.id));
    } catch { /* silent */ }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeChat) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${API}/api/groups/${activeChat.id}/messages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ content: chatInput }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setChatInput('');
      }
    } catch { /* silent */ }
    finally { setSendingMsg(false); }
  };

  const levelColor: Record<string, string> = {
    'Standard 8': 'rgba(77,161,255,0.2)',
    'JCE': 'rgba(0,200,117,0.2)',
    'MSCE': 'rgba(108,93,211,0.2)',
  };
  const levelText: Record<string, string> = {
    'Standard 8': '#4DA1FF',
    'JCE': '#00C875',
    'MSCE': '#6C5DD3',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Study Groups 🎓</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Create and join communities to collaborate with other students.</p>
        </div>
        <button className="glass-button primary" onClick={() => { setShowModal(true); setError(''); }}>
          <Plus size={18} /> Create Group
        </button>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
        </div>
      ) : groups.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No groups yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Be the first to create a study group!</p>
          <button className="glass-button primary" style={{ marginTop: '1.5rem' }} onClick={() => { setShowModal(true); setError(''); }}>
            <Plus size={16} /> Create First Group
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {groups.map(group => (
            <div key={group.id} className="glass-panel" style={{ padding: '1.5rem', transition: 'all 0.2s', cursor: 'default' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '12px', flexShrink: 0,
                  background: levelColor[group.level] || 'rgba(108,93,211,0.2)',
                  color: levelText[group.level] || '#6C5DD3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Users size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    background: levelColor[group.level] || 'rgba(108,93,211,0.2)',
                    color: levelText[group.level] || '#6C5DD3',
                    padding: '0.2rem 0.6rem', borderRadius: '99px',
                    display: 'inline-block', marginBottom: '0.4rem',
                  }}>{group.level}</span>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</h3>
                  {group.description && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                      {group.description}
                    </p>
                  )}
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Created by <strong style={{ color: 'var(--text-secondary)' }}>{group.creator.username}</strong>
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--bg-glass-border)', paddingTop: '0.875rem', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <MessageCircle size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      {group._count.messages} message{group._count.messages !== 1 ? 's' : ''}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {(group.creator.id === currentUser._id || currentUser.role === 'ADMIN') && (
                        <button
                          className="glass-button"
                          style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', borderColor: '#FF754C', color: '#FF754C' }}
                          onClick={() => handleDelete(group)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <button
                        className="glass-button primary"
                        style={{ padding: '0.35rem 0.9rem', fontSize: '0.78rem' }}
                        onClick={() => { setActiveChat(group); setMessages([]); }}
                      >
                        Open Chat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Group Modal ─────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
          backdropFilter: 'blur(4px)',
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '2rem', margin: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Create Study Group</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Group Name *</label>
                <input
                  className="glass-input"
                  placeholder="e.g. MSCE Mathematics Distinction Seekers"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Description (optional)</label>
                <textarea
                  className="glass-input"
                  placeholder="What is this group about?"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Education Level *</label>
                <select
                  className="glass-input"
                  value={form.level}
                  onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                >
                  <option value="Standard 8">Standard 8</option>
                  <option value="JCE">JCE</option>
                  <option value="MSCE">MSCE</option>
                </select>
              </div>

              {error && (
                <p style={{ color: '#FF754C', fontSize: '0.875rem', background: 'rgba(255,117,76,0.1)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,117,76,0.3)' }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button className="glass-button" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="glass-button primary" style={{ flex: 1 }} onClick={handleCreate} disabled={saving}>
                  {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                  {saving ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat Modal ─────────────────────────── */}
      {activeChat && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
          backdropFilter: 'blur(4px)',
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', height: '80vh', maxHeight: '700px', display: 'flex', flexDirection: 'column', margin: '1rem' }}>
            {/* Chat Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--bg-glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 700 }}>{activeChat.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{activeChat.level}</span>
              </div>
              <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                  <MessageCircle size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p>No messages yet. Say hello! 👋</p>
                </div>
              ) : messages.map(msg => {
                const isMe = msg.sender.username === currentUser.username;
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{msg.sender.username}</span>}
                    <div style={{
                      maxWidth: '70%', padding: '0.6rem 1rem', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)',
                      fontSize: '0.9rem', lineHeight: 1.5,
                    }}>
                      {msg.content}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--bg-glass-border)', display: 'flex', gap: '0.75rem' }}>
              <input
                className="glass-input"
                placeholder="Type a message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                style={{ flex: 1 }}
              />
              <button className="glass-button primary" onClick={handleSendMessage} disabled={sendingMsg || !chatInput.trim()}>
                {sendingMsg ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
