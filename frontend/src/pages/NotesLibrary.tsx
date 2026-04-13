import { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Download, ThumbsUp, FileUp, X } from 'lucide-react';
import './NotesLibrary.css';

interface Note {
  id: number;
  title: string;
  subject: string;
  description: string;
  category: string;
  fileUrl: string;
  likes: number;
  uploader?: { username: string };
  createdAt: string;
}

export default function NotesLibrary() {
  const [activeTab, setActiveTab] = useState('All Levels');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [uploadData, setUploadData] = useState({ title: '', description: '', category: 'MSCE', subject: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('studybuddy_token');
      const res = await fetch(`/api/notes?type=NOTE&category=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if(res.ok) setNotes(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) return alert("Please select a file.");

    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('category', uploadData.category);
    formData.append('subject', uploadData.subject);
    formData.append('type', 'NOTE');

    try {
      const token = localStorage.getItem('studybuddy_token');
      const res = await fetch('/api/notes/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // Do NOT set content-type manually with FormData
        body: formData
      });
      if(res.ok) {
        setShowUploadModal(false);
        fetchNotes(); // Reload notes
        setUploadData({ title: '', description: '', category: 'MSCE', subject: '' });
      } else {
        const error = await res.json();
        alert(error.message);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.subject.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="notes-container">
      <div className="notes-header">
        <div>
          <h2 className="greeting" style={{color: 'var(--accent-primary)'}}>Notes Library </h2>
          <p className="subtitle">Discover, share, and study community notes.</p>
        </div>
        <button className="glass-button primary" onClick={() => setShowUploadModal(true)}>
          <FileUp size={18} />
          Upload Note
        </button>
      </div>

      {showUploadModal && (
        <div className="sidebar-overlay" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div className="glass-panel" style={{width: '90%', maxWidth: '500px', padding: '2rem', position: 'relative'}}>
            <button className="icon-btn" style={{position: 'absolute', top: '1rem', right: '1rem'}} onClick={() => setShowUploadModal(false)}>
              <X size={20} />
            </button>
            <h3 style={{marginBottom: '1.5rem'}}>Upload Material</h3>
            <form onSubmit={handleUploadSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <input type="text" className="glass-input" placeholder="Title" required value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} />
              <input type="text" className="glass-input" placeholder="Subject (e.g. Mathematics)" required value={uploadData.subject} onChange={e => setUploadData({...uploadData, subject: e.target.value})} />
              <select className="glass-input" value={uploadData.category} onChange={e => setUploadData({...uploadData, category: e.target.value})}>
                <option value="Standard 8" style={{color: 'var(--text-primary)', background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)'}}>Standard 8</option>
                <option value="JCE" style={{color: 'var(--text-primary)', background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)'}}>JCE</option>
                <option value="MSCE" style={{color: 'var(--text-primary)', background: 'var(--bg-glass)', border: '1px solid var(--bg-glass-border)'}}>MSCE</option>
              </select>
              <textarea className="glass-input" placeholder="Short description" rows={3} value={uploadData.description} onChange={e => setUploadData({...uploadData, description: e.target.value})}></textarea>
              <input type="file" ref={fileInputRef} className="glass-input" style={{padding: '0.5rem'}} required />
              <button type="submit" className="glass-button primary w-full" style={{marginTop: '1rem'}}>Upload to Network</button>
            </form>
          </div>
        </div>
      )}

      <div className="notes-controls">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search notes by subject or topic..." 
            className="glass-input search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {['All Levels', 'Standard 8', 'JCE', 'MSCE'].map(tab => (
            <button 
              key={tab}
              className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="notes-grid">
        {loading ? <p>Loading resources from Network...</p> : filteredNotes.map(note => (
          <div key={note.id} className="note-card glass-panel">
            <div className="note-header">
              <span className="note-category">{note.category}</span>
              <BookOpen size={20} className="note-icon" />
            </div>
            <h3 className="note-title">{note.title}</h3>
            <p className="note-subject">{note.subject}</p>
            <p className="note-author">By: {note.uploader?.username || 'Anonymous'} • {new Date(note.createdAt).toLocaleDateString()}</p>
            <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem'}}>{note.description}</p>
            
            <div className="note-footer">
              <div className="note-stats">
                <span className="stat"><ThumbsUp size={14} /> {note.likes || 0}</span>
              </div>
              <a href={`${note.fileUrl}`} download target="_blank" rel="noopener noreferrer" style={{textDecoration: 'none'}}>
                <button className="glass-button icon-only">
                  <Download size={16} />
                </button>
              </a>
            </div>
          </div>
        ))}
        {!loading && filteredNotes.length === 0 && <p style={{color: 'var(--text-secondary)'}}>No notes found for this filter. Be the first to upload one!</p>}
      </div>
    </div>
  );
}
