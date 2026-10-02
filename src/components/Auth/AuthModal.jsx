import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  RiUser3Line, 
  RiMailLine, 
  RiLockLine, 
  RiLoginBoxLine, 
  RiUserAddLine 
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register({ username, password, email });
        localStorage.setItem('saved_chat_username', username);
        localStorage.setItem('saved_chat_password', password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#070913',
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.22) 0%, transparent 45%),
          radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.18) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.12) 0%, transparent 60%)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflow: 'hidden',
        zIndex: 9999
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Decorative Background Mesh Wave Pattern */}
      <svg
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '600px',
          height: '600px',
          opacity: 0.12,
          pointerEvents: 'none'
        }}
        viewBox="0 0 500 500"
      >
        <path
          d="M0,250 C150,180 350,320 500,250 L500,500 L0,500 Z"
          fill="none"
          stroke="url(#grid-grad)"
          strokeWidth="1.5"
        />
        <path
          d="M0,280 C150,210 350,350 500,280 L500,500 L0,500 Z"
          fill="none"
          stroke="url(#grid-grad)"
          strokeWidth="1.5"
        />
        <defs>
          <linearGradient id="grid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating Glass Decorative Shapes */}
      <motion.div
        animate={{ y: [-8, 8, -8], rotate: [0, 6, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '12%',
          right: '18%',
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          transform: 'rotate(15deg)',
          pointerEvents: 'none'
        }}
      />
      <motion.div
        animate={{ y: [10, -10, 10], rotate: [0, -8, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          bottom: '16%',
          left: '12%',
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          transform: 'rotate(-25deg)',
          pointerEvents: 'none'
        }}
      />
      <motion.div
        animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '25%',
          left: '15%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167, 139, 246, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Glassmorphism Auth Container Card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 25 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        style={{
          width: '100%',
          maxWidth: '430px',
          padding: '40px 36px 36px',
          backgroundColor: 'rgba(18, 22, 38, 0.62)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          borderRadius: '28px',
          border: '1px solid rgba(255, 255, 255, 0.13)',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 40px rgba(99, 102, 241, 0.08)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '1.85rem',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg, #c4b5fd 0%, #818cf8 50%, #60a5fa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Welcome to NexChat
            </span>
            <span style={{ fontSize: '1.7rem' }}>🚀</span>
          </h2>
          <p
            style={{
              margin: '8px 0 0',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.95rem',
              fontWeight: 400
            }}
          >
            Connect with your team instantly.
          </p>
        </div>

        {/* Error Notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                padding: '12px 16px',
                borderRadius: '14px',
                marginBottom: '20px',
                fontSize: '0.88rem',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Username Field */}
          <div>
            <label
              style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: '0.88rem',
                fontWeight: 500,
                marginBottom: '8px'
              }}
            >
              Username
            </label>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '16px',
                border: focusedInput === 'username'
                  ? '1.5px solid #6366f1'
                  : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: focusedInput === 'username'
                  ? '0 0 20px rgba(99, 102, 241, 0.35), inset 0 0 10px rgba(99, 102, 241, 0.1)'
                  : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <RiUser3Line
                size={20}
                style={{
                  position: 'absolute',
                  left: '16px',
                  color: focusedInput === 'username' ? '#a78bfa' : 'rgba(255, 255, 255, 0.4)',
                  transition: 'color 0.2s ease'
                }}
              />
              <input
                type="text"
                placeholder="alex.smith"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.98rem',
                  fontWeight: 400
                }}
              />
            </div>
          </div>

          {/* Email Field (Sign Up Mode) */}
          {!isLogin && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <label
                style={{
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.75)',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  marginBottom: '8px'
                }}
              >
                Email
              </label>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '16px',
                  border: focusedInput === 'email'
                    ? '1.5px solid #6366f1'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: focusedInput === 'email'
                    ? '0 0 20px rgba(99, 102, 241, 0.35), inset 0 0 10px rgba(99, 102, 241, 0.1)'
                    : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <RiMailLine
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    color: focusedInput === 'email' ? '#a78bfa' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'color 0.2s ease'
                  }}
                />
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 48px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '0.98rem',
                    fontWeight: 400
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Password Field */}
          <div>
            <label
              style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: '0.88rem',
                fontWeight: 500,
                marginBottom: '8px'
              }}
            >
              Password
            </label>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '16px',
                border: focusedInput === 'password'
                  ? '1.5px solid #6366f1'
                  : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: focusedInput === 'password'
                  ? '0 0 20px rgba(99, 102, 241, 0.35), inset 0 0 10px rgba(99, 102, 241, 0.1)'
                  : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <RiLockLine
                size={20}
                style={{
                  position: 'absolute',
                  left: '16px',
                  color: focusedInput === 'password' ? '#a78bfa' : 'rgba(255, 255, 255, 0.4)',
                  transition: 'color 0.2s ease'
                }}
              />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.98rem',
                  fontWeight: 400
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 12px 35px rgba(99, 102, 241, 0.55)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              marginTop: '6px',
              borderRadius: '50px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.02rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.25s ease'
            }}
          >
            {isLogin ? <RiLoginBoxLine size={20} /> : <RiUserAddLine size={20} />}
            <span>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}</span>
          </motion.button>
        </form>

        {/* Footer Mode Switch Link */}
        <div style={{ textAlign: 'center', marginTop: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px'
            }}
          >
            <span>{isLogin ? "Need an account?" : "Already have an account?"}</span>
            <span style={{ color: '#60a5fa', fontWeight: 600 }}>{isLogin ? 'Sign up' : 'Sign in'}</span>
          </button>
          {/* Active Accent Dot/Pill Indicator */}
          <div
            style={{
              width: '18px',
              height: '2.5px',
              backgroundColor: '#6366f1',
              borderRadius: '3px',
              boxShadow: '0 0 8px #6366f1'
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
