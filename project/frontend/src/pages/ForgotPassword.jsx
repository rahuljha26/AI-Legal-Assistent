import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';

const MailIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;

export default function ForgotPassword() {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await authAPI.passwordReset({ email });
      setMessage('If an account matches that email, a password reset link has been sent. Please check your inbox.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '40px 36px', boxShadow: '0 8px 64px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 6 }}>Forgot Password</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>Enter your email to receive a password reset link.</p>

        {message && <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px', color: '#6ee7b7', fontSize: 13, marginBottom: 16 }}>{message}</div>}
        {error && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EMAIL ADDRESS</label>
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', display: 'flex', pointerEvents: 'none' }}><MailIcon/></span>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%', padding: '12px 14px 12px 40px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', marginBottom: 20, transition: '0.2s', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Remember your password? <Link to="/login" style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
