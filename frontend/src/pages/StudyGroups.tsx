import { Users, Plus } from 'lucide-react';

export default function StudyGroups() {
  return (
    <div className="groups-page" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="greeting">Study Groups 🎓</h2>
          <p className="subtitle">Join active communities and collaborate with other students.</p>
        </div>
        <button className="glass-button primary">
          <Plus size={18} /> Create Group
        </button>
      </div>

      <div className="groups-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-panel" style={{ padding: '1.5rem', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div className="bg-blue" style={{
                width: '50px', height: '50px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: 'rgba(77, 161, 255, 0.2)', color: '#4DA1FF'
              }}>
                <Users size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <span className="note-badge" style={{
                  fontSize: '0.7rem', background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.5rem',
                  borderRadius: '99px', marginBottom: '0.5rem', display: 'inline-block', fontWeight: 600
                }}>MSCE • 2026</span>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Mathematics Distinction Seekers</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  A dedicated group for students aiming for distinctions in MSCE Math.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--bg-glass-border)', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>145 Members</span>
                  <button className="glass-button primary small" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>Join Group</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
