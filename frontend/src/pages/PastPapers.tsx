import { useState, useEffect, useRef } from 'react';
import { BookOpen, Search, Download, FileUp, X } from 'lucide-react';
import './Dashboard.css';

interface Paper {
  id: number;
  title: string;
  subject: string;
  category: string;
  fileUrl: string;
  uploader?: { username: string };
  createdAt: string;
}

export default function PastPapers() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', category: 'MSCE', subject: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPapers = async () => {
    try {
      const token = localStorage.getItem('studybuddy_token');
      const res = await fetch(`http://localhost:5000/api/notes?type=PAST_PAPER`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if(res.ok) setPapers(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) return alert("Please select a file.");

    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('title', uploadData.title);
    formData.append('category', uploadData.category);
    formData.append('subject', uploadData.subject);
    formData.append('type', 'PAST_PAPER');

    try {
      const token = localStorage.getItem('studybuddy_token');
      const res = await fetch('http://localhost:5000/api/notes/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if(res.ok) {
        setShowUploadModal(false);
        fetchPapers(); 
        setUploadData({ title: '', category: 'MSCE', subject: '' });
      }
    } catch(err) {
      console.error(err);
    }
  };

  const filteredPapers = papers.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.subject.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="dashboard">
      <div className="dashboard-header" style={{borderBottom: '1px solid var(--bg-glass-border)', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between'}}>
        <div>
          <h2 className="greeting" style={{color: '#4DA1FF'}}>Past Papers Database 📑</h2>
          <p className="subtitle">Extensive archive of MANEB exams and mock papers.</p>
        </div>
        <button className="glass-button primary" onClick={() => setShowUploadModal(true)}>
          <FileUp size={18} />
          Upload Paper
        </button>
      </div>

      {showUploadModal && (
        <div className="sidebar-overlay" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div className="glass-panel" style={{width: '90%', maxWidth: '500px', padding: '2rem', position: 'relative'}}>
            <button className="icon-btn" style={{position: 'absolute', top: '1rem', right: '1rem'}} onClick={() => setShowUploadModal(false)}>
              <X size={20} />
            </button>
            <h3 style={{marginBottom: '1.5rem'}}>Upload Past Paper</h3>
            <form onSubmit={handleUploadSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <input type="text" className="glass-input" placeholder="Title (e.g. 2021 MSCE Physics Paper 1)" required value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} />
              <input type="text" className="glass-input" placeholder="Subject" required value={uploadData.subject} onChange={e => setUploadData({...uploadData, subject: e.target.value})} />
              <select className="glass-input" value={uploadData.category} onChange={e => setUploadData({...uploadData, category: e.target.value})}>
                <option value="Standard 8">Standard 8</option>
                <option value="JCE">JCE</option>
                <option value="MSCE">MSCE</option>
              </select>
              <input type="file" ref={fileInputRef} className="glass-input" style={{padding: '0.5rem'}} required />
              <button type="submit" className="glass-button primary w-full" style={{marginTop: '1rem'}}>Upload Paper</button>
            </form>
          </div>
        </div>
      )}

      <div className="dashboard-content" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        <div className="glass-panel" style={{padding: '1.5rem'}}>
          <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem'}}>
            <div className="search-bar" style={{flex: 1, background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', border: '1px solid var(--bg-glass-border)'}}>
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                placeholder="Search by year or subject..." 
                className="search-input" 
                style={{background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', marginLeft: '0.5rem'}}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
              <thead>
                <tr style={{borderBottom: '1px solid var(--bg-glass-border)'}}>
                  <th style={{padding: '1rem', color: 'var(--text-secondary)'}}>Paper Title</th>
                  <th style={{padding: '1rem', color: 'var(--text-secondary)'}}>Subject</th>
                  <th style={{padding: '1rem', color: 'var(--text-secondary)'}}>Level</th>
                  <th style={{padding: '1rem', color: 'var(--text-secondary)'}}>Uploaded By</th>
                  <th style={{padding: '1rem', color: 'var(--text-secondary)'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td>Loading...</td></tr> : filteredPapers.map(paper => (
                  <tr key={paper.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s'}} className="hover:bg-gray-800">
                    <td style={{padding: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <BookOpen size={16} color="#4DA1FF" />
                      {paper.title}
                    </td>
                    <td style={{padding: '1rem', color: 'var(--text-secondary)'}}>{paper.subject}</td>
                    <td style={{padding: '1rem'}}><span style={{background: 'rgba(77, 161, 255, 0.2)', color: '#4DA1FF', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem'}}>{paper.category}</span></td>
                    <td style={{padding: '1rem', color: 'var(--text-secondary)'}}>{paper.uploader?.username}</td>
                    <td style={{padding: '1rem'}}>
                      <a href={`http://localhost:5000${paper.fileUrl}`} download target="_blank" rel="noopener noreferrer">
                        <button className="glass-button icon-only">
                          <Download size={16} />
                        </button>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredPapers.length === 0 && <p style={{marginTop: '1rem', color: 'var(--text-secondary)'}}>No past papers found.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
