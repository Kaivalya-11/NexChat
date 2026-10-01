import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, UserPlus, Zap } from 'lucide-react';

export default function AuthModal() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState(localStorage.getItem('saved_chat_username') || '');
  const [password, setPassword] = useState(localStorage.getItem('saved_chat_password') || '');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register({ username, password, email });
        // Save signed up user data to use while login
        localStorage.setItem('saved_chat_username', username);
        localStorage.setItem('saved_chat_password', password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (user) => {
    setError('');
    setLoading(true);
    try {
      await login(user, 'password123');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ background: 'var(--bg-darkest)' }}>
      <div className="modal-content" style={{ padding: '32px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>
          Welcome to Real-Time Chat
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Connect with your team instantly.
        </p>

        {error && (
          <div style={{ background: 'var(--accent-danger)', color: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-input" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>or try a demo account</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => demoLogin('alice')} disabled={loading}>
            <Zap size={16} style={{ color: 'var(--accent-warning)' }}/> Alice
          </button>
          <button className="btn btn-secondary" onClick={() => demoLogin('bob')} disabled={loading}>
            <Zap size={16} style={{ color: 'var(--accent-warning)' }}/> Bob
          </button>
          <button className="btn btn-secondary" onClick={() => demoLogin('charlie')} disabled={loading}>
            <Zap size={16} style={{ color: 'var(--accent-warning)' }}/> Charlie
          </button>
          <button className="btn btn-secondary" onClick={() => demoLogin('sarah')} disabled={loading}>
            <Zap size={16} style={{ color: 'var(--accent-warning)' }}/> Sarah
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button className="btn-icon" onClick={() => setIsLogin(!isLogin)} style={{ width: '100%', color: 'var(--accent-primary)' }}>
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
