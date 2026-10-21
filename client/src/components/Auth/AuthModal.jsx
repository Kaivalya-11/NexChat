import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  RiUser3Line,
  RiMailLine,
  RiLockLine,
  RiLoginBoxLine,
  RiUserAddLine,
  RiShieldStarLine,
  RiTerminalBoxLine,
  RiMessage3Fill
} from 'react-icons/ri';

export default function AuthModal() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState(localStorage.getItem('saved_chat_username') || '');
  const [password, setPassword] = useState(localStorage.getItem('saved_chat_password') || '');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [bindTerminal, setBindTerminal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register({ username, password, email });
      }
      if (bindTerminal) {
        localStorage.setItem('saved_chat_username', username);
        localStorage.setItem('saved_chat_password', password);
      } else {
        localStorage.removeItem('saved_chat_username');
        localStorage.removeItem('saved_chat_password');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="modal-overlay force-dark"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0B1013',
        background: `
          radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.08), transparent 45%),
          #0B1013
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        overflowY: 'auto',
        zIndex: 9999,
        fontFamily: 'var(--font-body)'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background HUD Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(16, 185, 129, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16, 185, 129, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
        zIndex: 0
      }} />



      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        style={{
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* App Logo/Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#11181C',
          border: '1px solid #1F2E35',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 16px -2px rgba(16, 185, 129, 0.2)'
        }}>
          <RiMessage3Fill size={32} color="#10B981" />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '32px',
          fontWeight: 700,
          color: '#F1F5F9',
          margin: '0 0 12px 0',
          letterSpacing: '-0.02em'
        }}>
          NexChat
        </h1>

        <p style={{
          fontFamily: 'var(--font-family)',
          fontSize: '14px',
          color: '#94A3B8',
          textAlign: 'center',
          lineHeight: '1.5',
          margin: '0 0 32px 0',
          maxWidth: '360px'
        }}>
          {isLogin
            ? 'Welcome back! Please enter your credentials to access your secure communications.'
            : 'Get started with NexChat your all-in-one space to connect, collaborate, and stay in sync with the world around you.'}
        </p>
        {/* Error Notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              style={{
                width: '100%',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid #F43F5E',
                color: '#F43F5E',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '0.88rem',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase'
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credential Console */}
        <div style={{
          width: '100%',
          backgroundColor: '#11181C',
          border: '1px solid #1F2E35',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 500 }}>
                  Username
                </label>
              </div>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#162026',
                border: focusedInput === 'username' ? '1px solid #10B981' : '1px solid #1F2E35',
                boxShadow: focusedInput === 'username' ? '0 0 0 2px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(52, 211, 153, 0.15)' : 'none',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}>
                <RiUser3Line size={18} style={{ position: 'absolute', left: '16px', color: focusedInput === 'username' ? '#10B981' : '#64748B' }} />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={() => setFocusedInput('username')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  style={{ width: '100%', padding: '12px 16px 12px 42px', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#F1F5F9', fontSize: '14px', fontFamily: 'var(--font-family)' }}
                />
              </div>
            </div>

            {!isLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                  Email address
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#162026',
                  border: focusedInput === 'email' ? '1px solid #10B981' : '1px solid #1F2E35',
                  boxShadow: focusedInput === 'email' ? '0 0 0 2px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(52, 211, 153, 0.15)' : 'none',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}>
                  <RiMailLine size={18} style={{ position: 'absolute', left: '16px', color: focusedInput === 'email' ? '#10B981' : '#64748B' }} />
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    required={!isLogin}
                    style={{ width: '100%', padding: '12px 16px 12px 42px', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#F1F5F9', fontSize: '14px', fontFamily: 'var(--font-family)' }}
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                Password
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#162026',
                border: focusedInput === 'password' ? '1px solid #10B981' : '1px solid #1F2E35',
                boxShadow: focusedInput === 'password' ? '0 0 0 2px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(52, 211, 153, 0.15)' : 'none',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}>
                <RiTerminalBoxLine size={18} style={{ position: 'absolute', left: '16px', color: focusedInput === 'password' ? '#10B981' : '#64748B' }} />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  style={{ width: '100%', padding: '12px 16px 12px 42px', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#F1F5F9', fontSize: '14px', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            {/* Bind Terminal Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <div
                onClick={() => setBindTerminal(!bindTerminal)}
                style={{
                  width: '34px',
                  height: '18px',
                  backgroundColor: bindTerminal ? '#10B981' : '#1F2E35',
                  borderRadius: '9999px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: bindTerminal ? '18px' : '2px',
                  width: '14px',
                  height: '14px',
                  backgroundColor: bindTerminal ? '#0B1013' : '#94A3B8',
                  borderRadius: '50%',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', color: '#F1F5F9', fontWeight: 500 }}>Remember me</span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Keep me logged in for 30 days</span>
              </div>
            </div>

            {/* Primary Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 16px',
                marginTop: '8px',
                backgroundColor: '#10B981',
                border: 'none',
                borderRadius: '8px',
                color: '#0B1013',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'var(--font-heading)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 0 14px rgba(16, 185, 129, 0.35)'
              }}
              onMouseOver={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#34D399';
              }}
              onMouseOut={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#10B981';
              }}
            >
              <RiLockLine size={18} />
              <span>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}</span>
            </button>
          </form>
        </div>

        {/* Registration CTA */}
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          style={{
            background: 'none',
            border: 'none',
            color: '#10B981',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '8px',
            textDecoration: 'none',
            transition: 'color 0.15s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#34D399'}
          onMouseOut={(e) => e.currentTarget.style.color = '#10B981'}
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>

        {/* Security Footer */}
        <div style={{ marginTop: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10B981' }}>
            <RiShieldStarLine size={16} />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>END-TO-END SECURE</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
