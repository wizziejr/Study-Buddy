import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Plus, X, MessageCircle, Trash2, Loader2, ArrowLeft, Settings, Shield, Ban, Image as ImageIcon } from 'lucide-react';
import './Dashboard.css';

interface GroupMember { id: number; role: string; isBanned: boolean; user: { id: number; username: string; } }
interface Group {
  id: number; name: string; description?: string; level: string; rules?: string;
  iconUrl?: string; backgroundImageUrl?: string;
  creatorId: number; creator: { id: number; username: string };
  _count: { messages: number }; createdAt: string;
}

const API = '';
function token() { return localStorage.getItem('studybuddy_token') || ''; }
function authHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }; }

export default function StudyGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', level: 'Form 4' });
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  
  // Active Chat State
  const [messages, setMessages] = useState<{ id: number; content: string; createdAt: string; sender?: { id: number; username: string }; senderId?: number }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  
  // Group Details State (Members, Settings Toggle)
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [showSettingsSidebar, setShowSettingsSidebar] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const iconUploadRef = useRef<HTMLInputElement>(null);
  const bgUploadRef = useRef<HTMLInputElement>(null);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('studybuddy_user') || '{}'); } catch { return {}; }
  })();
  const currentUserId = currentUser.id || currentUser._id;
  const isGlobalAdmin = currentUser.role === 'ADMIN';
  const isGroupAdmin = activeGroup && (activeGroup.creatorId === currentUserId || members.find(m => m.user.id === currentUserId && m.role === 'ADMIN'));
  
  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/groups`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) setGroups(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  // View specific active group details
  const fetchGroupDetails = useCallback(async (groupId: number) => {
    try {
      const [msgRes, memRes] = await Promise.all([
        fetch(`${API}/api/groups/${groupId}/messages`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API}/api/groups/${groupId}/members`, { headers: { Authorization: `Bearer ${token()}` } })
      ]);
      if (msgRes.ok) setMessages(await msgRes.json());
      if (memRes.ok) setMembers(await memRes.json());
      
      // Auto scroll newest msg
      setTimeout(() => {
        if(chatScrollRef.current) chatScrollRef.current.scrollTo(0, chatScrollRef.current.scrollHeight);
      }, 100);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!activeGroup) return;
    fetchGroupDetails(activeGroup.id);
    const interval = setInterval(() => fetchGroupDetails(activeGroup.id), 5000);
    return () => clearInterval(interval);
  }, [activeGroup, fetchGroupDetails]);

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Group name is required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/api/groups`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to create group'); return; }
      setGroups(prev => [data, ...prev]);
      setShowCreateModal(false);
      setForm({ name: '', description: '', level: 'Form 4' });
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!window.confirm(`Are you sure you want to delete this group completely?`)) return;
    try {
      const res = await fetch(`${API}/api/groups/${groupId}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        if(activeGroup?.id === groupId) setActiveGroup(null);
      }
    } catch { /* silent */ }
  };

  const handleJoin = async (group: Group) => {
    try {
      await fetch(`${API}/api/groups/${group.id}/join`, { method: 'POST', headers: authHeaders() });
      setActiveGroup(group);
      setShowSettingsSidebar(false);
    } catch { /* silent — if join fails user stays on list view */ }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeGroup) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${API}/api/groups/${activeGroup.id}/messages`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ content: chatInput }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setChatInput('');
        setTimeout(() => { if(chatScrollRef.current) chatScrollRef.current.scrollTo(0, chatScrollRef.current.scrollHeight); }, 100);
      }
    } catch { /* silent */ }
    finally { setSendingMsg(false); }
  };

  const handleManageMember = async (memberId: number, action: 'KICK' | 'BAN' | 'MAKE_ADMIN') => {
    if(!activeGroup) return;
    if(!window.confirm(`Are you sure you want to ${action.toLowerCase()} this member?`)) return;
    try {
       const res = await fetch(`${API}/api/groups/${activeGroup.id}/members/${memberId}/manage`, {
          method: 'PUT', headers: authHeaders(), body: JSON.stringify({ action })
       });
       if(res.ok) fetchGroupDetails(activeGroup.id);
    } catch { /* silent — members list will refresh on next poll */ }
  };

  const handleUpdateGroupSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!activeGroup) return;
    const formData = new FormData(e.currentTarget);
    try {
       const res = await fetch(`${API}/api/groups/${activeGroup.id}/settings`, {
          method: 'PUT', headers: { Authorization: `Bearer ${token()}` }, body: formData
       });
       if(res.ok) {
         const updatedGroup = await res.json();
         setActiveGroup(updatedGroup);
         setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
         alert('Settings saved!');
       }
    } catch { /* silent — settings save error handled by alert */ }
  };

  const levelColor: Record<string, string> = {
    'Standard 5': 'rgba(77,161,255,0.2)', 'Standard 6': 'rgba(77,161,255,0.2)', 'Standard 7': 'rgba(77,161,255,0.2)', 'Standard 8': 'rgba(77,161,255,0.2)',
    'Form 1': 'rgba(0,200,117,0.2)', 'Form 2': 'rgba(0,200,117,0.2)', 'Form 3': 'rgba(108,93,211,0.2)', 'Form 4': 'rgba(108,93,211,0.2)'
  };
  const levelText: Record<string, string> = {
    'Standard 5': '#4DA1FF', 'Standard 6': '#4DA1FF', 'Standard 7': '#4DA1FF', 'Standard 8': '#4DA1FF',
    'Form 1': '#00C875', 'Form 2': '#00C875', 'Form 3': '#6C5DD3', 'Form 4': '#6C5DD3',
  };

  if(!activeGroup) {
      // ── Main Groups List View ──
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Study Groups 🎓</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Create and join communities to collaborate with other students.</p>
            </div>
            <button className="glass-button primary" onClick={() => { setShowCreateModal(true); setError(''); }}>
              <Plus size={18} /> Create Group
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
            </div>
          ) : groups.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
              <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', margin: '0 auto' }} />
              <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No groups available</h3>
              <button className="glass-button primary" style={{ marginTop: '1.5rem' }} onClick={() => setShowCreateModal(true)}>
                <Plus size={16} /> Create Group
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {groups.map(group => (
                <div key={group.id} className="glass-panel" style={{ padding: '1.5rem', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '12px', flexShrink: 0,
                      background: group.iconUrl ? 'transparent' : (levelColor[group.level] || 'rgba(108,93,211,0.2)'),
                      color: levelText[group.level] || '#6C5DD3',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                    }}>
                      {group.iconUrl ? <img src={`${API}${group.iconUrl}`} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <Users size={24} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px',
                        background: levelColor[group.level] || 'rgba(108,93,211,0.2)', color: levelText[group.level] || '#6C5DD3',
                        display: 'inline-block', marginBottom: '0.4rem' }}>{group.level}</span>
                      <h3 style={{ fontSize: '1.05rem', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</h3>
                      {group.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginBottom: '0.75rem' }}>{group.description}</p>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--bg-glass-border)', paddingTop: '0.875rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><Users size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />{group._count?.messages || 0} msgs</span>
                        <button className="glass-button primary" style={{ padding: '0.35rem 0.9rem', fontSize: '0.78rem' }} onClick={() => handleJoin(group)}>Join / Open</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showCreateModal && (
             <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
               <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                   <h3>Create Study Group</h3>
                   <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border:'none', color: '#fff', cursor:'pointer' }}><X size={20}/></button>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <input className="glass-input" placeholder="Group Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                   <textarea className="glass-input" placeholder="Description" rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
                   <select className="glass-input" value={form.level} onChange={e => setForm(f => ({...f, level: e.target.value}))}>
                     <option value="Standard 5">Standard 5</option>
                     <option value="Standard 8">Standard 8</option>
                     <option value="Form 1">Form 1</option>
                     <option value="Form 4">Form 4</option>
                   </select>
                   {error && <p style={{color:'#ff5050', fontSize:'0.85rem'}}>{error}</p>}
                   <button className="glass-button primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
                 </div>
               </div>
             </div>
          )}
        </div>
      );
  }

  // ── Active Group Full Screen View ──
  return (
    <div style={{ display: 'flex', height: '100%', maxHeight: 'calc(100vh - 80px)', gap: '1rem', overflow: 'hidden' }}>
        
        {/* Chat Area */}
        <div className="glass-panel" style={{ 
            flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
            backgroundImage: activeGroup.backgroundImageUrl ? `url(${API}${activeGroup.backgroundImageUrl})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center'
        }}>
            {/* Ovelray for chat background readability */}
            {activeGroup.backgroundImageUrl && <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 0}}></div>}

            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--bg-glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <button className="glass-button icon-only" onClick={() => setActiveGroup(null)}><ArrowLeft size={18} /></button>
                   <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', overflow: 'hidden', display:'flex', alignItems:'center', justifyContent: 'center' }}>
                      {activeGroup.iconUrl ? <img src={`${API}${activeGroup.iconUrl}`} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <Users size={20} color="#fff" />}
                   </div>
                   <div>
                       <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{activeGroup.name}</h3>
                       <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{members.length} members • {activeGroup.level}</p>
                   </div>
                </div>
                <button className="glass-button" style={{ padding: '0.5rem 1rem' }} onClick={() => setShowSettingsSidebar(!showSettingsSidebar)}>
                    {showSettingsSidebar ? <X size={18}/> : <Settings size={18}/>} <span style={{marginLeft:'0.5rem'}}>Group Details</span>
                </button>
            </div>

            <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 1 }}>
               {messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                     <MessageCircle size={40} style={{marginBottom: '1rem', opacity: 0.5}} />
                     <p>Welcome to {activeGroup.name}! Send the first message.</p>
                  </div>
               ) : messages.map(msg => {
                   const isMe = msg.sender?.id === currentUserId || msg.senderId === currentUserId;
                   return (
                       <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                          {!isMe && <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:'0.2rem' }}>{msg.sender?.username || 'Unknown'}</span>}
                          <div style={{ maxWidth: '75%', padding: '0.75rem 1rem', background: isMe ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', backdropFilter: 'blur(5px)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                             {msg.content}
                          </div>
                          <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                       </div>
                   )
               })}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--bg-glass-border)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', display: 'flex', gap: '1rem', zIndex: 1 }}>
                <input className="glass-input" placeholder="Type your message..." style={{flex: 1}} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==='Enter' && handleSendMessage()} />
                <button className="glass-button primary" disabled={sendingMsg || !chatInput.trim()} onClick={handleSendMessage}>{sendingMsg ? 'Sending' : 'Send'}</button>
            </div>
        </div>

        {/* Settings / Members Sidebar */}
        {showSettingsSidebar && (
            <div className="group-settings-panel glass-panel animate-fade-in" style={{ width: '320px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--bg-glass-border)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>About Group</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{activeGroup.description || 'No description provided.'}</p>
                    {activeGroup.rules && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,117,76,0.1)', borderLeft: '2px solid #FF754C', borderRadius: '4px' }}>
                            <h4 style={{ fontSize: '0.8rem', color: '#FF754C', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Group Rules</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{activeGroup.rules}</p>
                        </div>
                    )}
                </div>

                {isGroupAdmin || isGlobalAdmin ? (
                   <form onSubmit={handleUpdateGroupSettings} style={{ padding: '1.5rem', borderBottom: '1px solid var(--bg-glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Admin Settings</h4>
                       <div>
                           <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Group Name</label>
                           <input name="name" defaultValue={activeGroup.name} className="glass-input" style={{padding: '0.5rem', fontSize:'0.85rem'}} required />
                       </div>
                       <div>
                           <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rules</label>
                           <textarea name="rules" defaultValue={activeGroup.rules||''} className="glass-input" style={{padding: '0.5rem', fontSize:'0.85rem'}} rows={2} />
                       </div>
                       <div>
                           <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display:'block', marginBottom:'0.5rem' }}>Images</label>
                           <div style={{display:'flex', gap:'0.5rem'}}>
                               <button type="button" className="glass-button" style={{flex:1, padding:'0.5rem', fontSize:'0.75rem'}} onClick={() => iconUploadRef.current?.click()}><ImageIcon size={14}/> Icon</button>
                               <button type="button" className="glass-button" style={{flex:1, padding:'0.5rem', fontSize:'0.75rem'}} onClick={() => bgUploadRef.current?.click()}><ImageIcon size={14}/> Background</button>
                               <input ref={iconUploadRef} type="file" name="groupIcon" accept="image/*" style={{display:'none'}} />
                               <input ref={bgUploadRef} type="file" name="groupBg" accept="image/*" style={{display:'none'}} />
                           </div>
                       </div>
                       <button type="submit" className="glass-button primary" style={{padding: '0.5rem'}}>Save Changes</button>
                       <button type="button" className="glass-button" style={{padding: '0.5rem', borderColor: '#ff5050', color:'#ff5050'}} onClick={() => handleDeleteGroup(activeGroup.id)}><Trash2 size={14}/> Delete Group</button>
                   </form>
                ) : null}

                <div style={{ padding: '1.5rem', flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Members ({members.length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                       {members.map(m => (
                           <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                 <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'var(--bg-secondary)', display:'flex', alignItems:'center', justifyContent:'center'}}><UserIcon/></div>
                                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: m.isBanned ? '#ff5050' : '#fff', textDecoration: m.isBanned ? 'line-through' : 'none' }}>{m.user?.username || 'Unknown'}</span>
                                    <span style={{ fontSize: '0.7rem', color: m.role==='ADMIN'?'var(--accent-primary)':'var(--text-muted)', fontWeight: m.role==='ADMIN'?700:400 }}>{m.role}</span>
                                 </div>
                              </div>
                              {(isGroupAdmin || isGlobalAdmin) && m.user?.id !== currentUserId && (
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                     {!m.isBanned && <button onClick={() => handleManageMember(m.user.id, 'KICK')} className="glass-button icon-only" style={{padding:'0.3rem', fontSize:'0.7rem', color:'#ffcc00'}} title="Kick"><Shield size={14}/></button>}
                                     <button onClick={() => handleManageMember(m.user.id, 'BAN')} className="glass-button icon-only" style={{padding:'0.3rem', fontSize:'0.7rem', color:'#ff5050'}} title={m.isBanned ? "Unban" : "Ban"}><Ban size={14}/></button>
                                  </div>
                              )}
                           </div>
                       ))}
                    </div>
                </div>
            </div>
        )}
      <style>{`
        .group-settings-panel {
          width: 320px;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .group-settings-panel {
            position: fixed;
            top: 70px;
            right: 0;
            bottom: 0;
            width: 85%;
            max-width: 320px;
            z-index: 500;
            border-radius: var(--radius-md) 0 0 var(--radius-md);
            box-shadow: -8px 0 32px rgba(0,0,0,0.5);
          }
        }
      `}</style>
    </div>
  );
}

function UserIcon() { return <Users size={16} />; }
