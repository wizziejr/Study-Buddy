import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, Phone, Mail, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import bgImage from '../assets/open-book-wooden-table.jpg';
import './Auth.css';

type AuthMode = 'login' | 'register' | 'forgot' | 'otp_verify';

// Password rules
const pwRules = [
  { label: 'At least 7 characters', test: (p: string) => p.length >= 7 },
  { label: 'One uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One symbol (!, @, #, ? …)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const isPasswordValid = (p: string) => pwRules.every(r => r.test(p));

export default function Auth({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });

  // Register fields
  const [regData, setRegData] = useState({
    username: '', phoneSuffix: '', email: '', password: '', confirmPassword: '', level: 'MSCE'
  });

  // Forgot / OTP fields
  const [forgotPhone, setForgotPhone] = useState('');
  const [otpData, setOtpData] = useState({ otp: '', newPassword: '', confirmPassword: '' });
  const [pendingPhone, setPendingPhone] = useState('');

  const clearMessages = () => { setError(''); setSuccess(''); };

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginData.identifier, password: loginData.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem('studybuddy_token', data.token);
      localStorage.setItem('studybuddy_user', JSON.stringify(data));
      onLogin();
      navigate('/');
    } catch (err) { setError(err instanceof Error ? err.message : "An error occurred"); }
  };

  // ── REGISTER ──────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!isPasswordValid(regData.password)) return setError('Password does not meet all requirements below.');
    if (regData.password !== regData.confirmPassword) return setError("Passwords don't match");
    const phone = '+265' + regData.phoneSuffix.replace(/^0+/, '');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regData.username,
          phone,
          email: regData.email || undefined,
          password: regData.password,
          level: regData.level,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem('studybuddy_token', data.token);
      localStorage.setItem('studybuddy_user', JSON.stringify(data));
      onLogin();
      navigate('/');
    } catch (err) { setError(err instanceof Error ? err.message : "An error occurred"); }
  };

  // ── FORGOT PASSWORD (send OTP) ─────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    const phone = '+265' + forgotPhone.replace(/^0+/, '');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPendingPhone(phone);
      setSuccess(`OTP sent to ${phone}. Check your phone (or see backend console in development).`);
      setTimeout(() => setMode('otp_verify'), 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "An error occurred"); }
  };

  // ── VERIFY OTP + RESET ─────────────────────────────────────────────────────
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (otpData.newPassword !== otpData.confirmPassword) return setError("Passwords don't match");
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pendingPhone, otp: otpData.otp, newPassword: otpData.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Password reset! Redirecting to login...');
      setTimeout(() => { setMode('login'); clearMessages(); }, 2000);
    } catch (err) { setError(err instanceof Error ? err.message : "An error occurred"); }
  };

  const ErrorBanner = () => error ? (
    <div className="auth-banner error">{error}</div>
  ) : null;

  const SuccessBanner = () => success ? (
    <div className="auth-banner success">{success}</div>
  ) : null;

  return (
    <div className="auth-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="auth-card glass-panel animate-fade-in">

        {/* ── LOGO ── */}
        <div className="text-center mb-6">
          <h1 className="logo-text" style={{ justifyContent: 'center', margin: '0 0 0.5rem 0' }}>
            Study<span>Buddy</span>
          </h1>
          {mode === 'login' && <>
            <h2 className="auth-title">Welcome back! 👋</h2>
            <p className="subtitle">Log in to continue your study streak</p>
          </>}
          {mode === 'register' && <>
            <h2 className="auth-title">Create Account</h2>
            <p className="subtitle">Join the fastest growing study platform in Malawi</p>
          </>}
          {mode === 'forgot' && <>
            <h2 className="auth-title">Forgot Password</h2>
            <p className="subtitle">We'll send an OTP to your Malawi number</p>
          </>}
          {mode === 'otp_verify' && <>
            <h2 className="auth-title">Verify OTP 🔐</h2>
            <p className="subtitle">Enter the 6-digit code sent to {pendingPhone}</p>
          </>}
        </div>

        <ErrorBanner />
        <SuccessBanner />

        {/* ────────────── LOGIN ────────────────────────────────────────────── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <Phone className="input-icon" size={18} />
              <input type="text" placeholder="Phone (+265...), Username, or Email" className="glass-input auth-input" required
                value={loginData.identifier} onChange={e => setLoginData({ ...loginData, identifier: e.target.value })} />
            </div>
            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" className="glass-input auth-input" required
                value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '-0.5rem', fontSize: '0.8rem', color: '#666' }}>
              Test login: username "Aqua_Slovic", password "Wizzie07?"
            </div>
            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
              <span className="switch-link" onClick={() => { setMode('forgot'); clearMessages(); }} style={{ fontSize: '0.85rem' }}>
                Forgot Password?
              </span>
            </div>
            <button type="submit" className="glass-button primary w-full submit-btn">Sign In</button>
            <p className="auth-switch-inline">
              No account? <span className="switch-link" onClick={() => { setMode('register'); clearMessages(); }}>Register here</span>
            </p>
          </form>
        )}

        {/* ────────────── REGISTER ─────────────────────────────────────────── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <UserIcon className="input-icon" size={18} />
              <input type="text" placeholder="Unique Username" className="glass-input auth-input" required
                value={regData.username} onChange={e => setRegData({ ...regData, username: e.target.value })} />
            </div>

            {/* Phone with +265 prefix */}
            <div className="phone-group">
              <span className="phone-prefix">+265</span>
              <input type="tel" placeholder="Phone number (e.g. 881234567)" className="glass-input auth-input phone-input" required
                value={regData.phoneSuffix} onChange={e => setRegData({ ...regData, phoneSuffix: e.target.value.replace(/\D/g, '') })} />
            </div>

            <div className="input-group">
              <Mail className="input-icon" size={18} />
              <input type="email" placeholder="Email (optional)" className="glass-input auth-input"
                value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} />
            </div>

            <select className="glass-input" value={regData.level} onChange={e => setRegData({ ...regData, level: e.target.value })}>
              <option value="Standard 8">Standard 8</option>
              <option value="JCE">JCE (Form 2)</option>
              <option value="MSCE">MSCE (Form 4)</option>
            </select>

            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input type={showPassword ? 'text' : 'password'} placeholder="Create Password" className="glass-input auth-input" required
                value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {/* Password strength checklist */}
            {regData.password.length > 0 && (
              <div className="pw-rules">
                {pwRules.map(rule => {
                  const ok = rule.test(regData.password);
                  return (
                    <div key={rule.label} className={`pw-rule ${ok ? 'ok' : 'fail'}`}>
                      {ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input type={showPassword ? 'text' : 'password'} placeholder="Confirm Password" className="glass-input auth-input" required
                value={regData.confirmPassword} onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })} />
            </div>

            <button type="submit" className="glass-button primary w-full submit-btn">Create Account</button>
            <p className="auth-switch-inline">
              Already have one? <span className="switch-link" onClick={() => { setMode('login'); clearMessages(); }}>Log in</span>
            </p>
          </form>
        )}

        {/* ────────────── FORGOT PASSWORD ──────────────────────────────────── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="auth-form">
            <div className="phone-group">
              <span className="phone-prefix">+265</span>
              <input type="tel" placeholder="Phone number" className="glass-input auth-input phone-input" required
                value={forgotPhone} onChange={e => setForgotPhone(e.target.value.replace(/\D/g, ''))} />
            </div>
            <button type="submit" className="glass-button primary w-full submit-btn">Send OTP</button>
            <p className="auth-switch-inline">
              <span className="switch-link" onClick={() => { setMode('login'); clearMessages(); }}>
                <ArrowLeft size={14} style={{ display: 'inline', marginRight: 4 }} /> Back to Login
              </span>
            </p>
          </form>
        )}

        {/* ────────────── OTP VERIFY ───────────────────────────────────────── */}
        {mode === 'otp_verify' && (
          <form onSubmit={handleOtpVerify} className="auth-form">
            <input type="text" maxLength={6} placeholder="6-digit OTP Code" className="glass-input"
              style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}
              required value={otpData.otp} onChange={e => setOtpData({ ...otpData, otp: e.target.value })} />
            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input type="password" placeholder="New Password" className="glass-input auth-input" required
                value={otpData.newPassword} onChange={e => setOtpData({ ...otpData, newPassword: e.target.value })} />
            </div>
            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input type="password" placeholder="Confirm New Password" className="glass-input auth-input" required
                value={otpData.confirmPassword} onChange={e => setOtpData({ ...otpData, confirmPassword: e.target.value })} />
            </div>
            <button type="submit" className="glass-button primary w-full submit-btn">Reset Password</button>
            <p className="auth-switch-inline">
              <span className="switch-link" onClick={() => { setMode('forgot'); clearMessages(); }}>
                Didn't get the code? Resend
              </span>
            </p>
          </form>
        )}

      </div>
    </div>
  );
}
