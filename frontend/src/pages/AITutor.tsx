import { Brain, Sparkles } from 'lucide-react';

export default function AITutor() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      alignItems: 'center', 
      justifyContent: 'center', 
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div className="glass-panel" style={{ 
        padding: '4rem 3rem', 
        maxWidth: '600px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '2rem',
        border: '1px solid var(--accent-primary)',
        boxShadow: '0 0 40px var(--accent-glow)'
      }}>
        <div style={{
          position: 'relative',
          width: '100px',
          height: '100px',
          background: 'var(--accent-primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px var(--accent-glow)'
        }}>
          <Brain size={50} color="white" />
          <div style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            background: 'var(--accent-secondary)',
            borderRadius: '50%',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite'
          }}>
            <Sparkles size={20} color="white" />
          </div>
        </div>

        <div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 800, 
            marginBottom: '1rem',
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AI Tutor: Coming Soon
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1.1rem', 
            lineHeight: 1.6,
            maxWidth: '500px'
          }}>
            We're putting the final touches on our advanced AI Tutor. Soon, you'll have 24/7 access to personalized guidance, 
            instant problem solving, and curriculum-aware assistance tailored specifically for Malawi's education system.
          </p>
        </div>

        <div style={{ 
          marginTop: '1rem',
          padding: '0.75rem 1.5rem',
          borderRadius: '99px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--bg-glass-border)',
          fontSize: '0.9rem',
          color: 'var(--text-muted)'
        }}>
          Stay tuned for the launch of the study buddy AI tutor.
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
