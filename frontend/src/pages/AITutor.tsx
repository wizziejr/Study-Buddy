import { useState } from 'react';
import { Send, Upload, Bot, User, Brain } from 'lucide-react';

export default function AITutor() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hi! I am your StudyBuddy AI Tutor. I specialize in the Malawi curriculum. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if(!input.trim()) return;
    const userMsg = input;
    setMessages([...messages, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('studybuddy_token');
      const res = await fetch('http://localhost:5000/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg, level: 'MSCE', subject: 'General' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get AI response');

      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: `Error: ${err instanceof Error ? err.message : "An error occurred"}. Please make sure backend is running.` }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="greeting">AI Tutor 🤖</h2>
          <p className="subtitle">Step-by-step guidance tailored for Malawi students.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select className="glass-input" style={{ width: 'auto', padding: '0.4rem 1rem' }}>
            <option>Level: MSCE</option>
            <option>Level: JCE</option>
            <option>Level: Std 8</option>
          </select>
          <select className="glass-input" style={{ width: 'auto', padding: '0.4rem 1rem' }}>
            <option>Mathematics</option>
            <option>Biology</option>
            <option>Physics</option>
            <option>English</option>
          </select>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: '1rem', alignItems: 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: msg.role === 'user' ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                color: 'white'
              }}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div style={{
                background: msg.role === 'user' ? 'rgba(255,117,76, 0.1)' : 'rgba(108,93,211, 0.1)',
                padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)',
                border: msg.role === 'user' ? '1px solid rgba(255,117,76, 0.2)' : '1px solid rgba(108,93,211, 0.2)',
                maxWidth: '75%', color: 'var(--text-primary)', lineHeight: '1.6'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} />
              </div>
              <div style={{ background: 'rgba(108,93,211, 0.1)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(108,93,211, 0.2)', color: 'var(--text-secondary)' }}>
                Thinking...
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--bg-glass-border)', display: 'flex', gap: '1rem' }}>
          <button className="glass-button icon-only" title="Upload Document">
            <Upload size={18} />
          </button>
          <button className="glass-button icon-only" title="Generate Quiz based on chat" style={{ color: 'var(--accent-primary)' }}>
            <Brain size={18} />
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              className="glass-input"
              placeholder="Type your question here... e.g. 'Explain Newton's second law'"
              style={{ paddingRight: '3rem' }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              style={{
                position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                background: 'var(--accent-primary)', border: 'none', width: '32px', height: '32px',
                borderRadius: 'var(--radius-sm)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
