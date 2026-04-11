import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './mobile.css'
import App from './App.tsx'

// Apply saved theme instantly before React mounts
try {
  const saved = localStorage.getItem('sb_theme');
  if (saved) {
    const t = JSON.parse(saved);
    const r = document.documentElement.style;
    r.setProperty('--accent-primary', t.primary);
    r.setProperty('--accent-secondary', t.secondary);
    r.setProperty('--accent-glow', t.glow);
    r.setProperty('--bg-primary', t.bg);
    r.setProperty('--bg-secondary', t.bg2);
  }
} catch { /* ignore */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

