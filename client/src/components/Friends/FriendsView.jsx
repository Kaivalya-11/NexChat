import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import { RiUserSmileFill, RiUserAddFill, RiSearch2Line, RiCheckLine, RiCloseLine, RiUserUnfollowLine } from 'react-icons/ri';

export default function FriendsView() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // all, requests, add
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFriends = async () => {
    try {
      const data = await api.getFriends(token);
      setFriends(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await api.getFriendRequests(token);
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'all') fetchFriends();
    else if (activeTab === 'requests') fetchRequests();
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab === 'add' && searchQuery.trim().length > 0) {
      const timer = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await api.searchUsersForFriends(token, searchQuery);
          setSearchResults(res);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeTab, token]);

  const handleSendRequest = async (userId) => {
    try {
      await api.sendFriendRequest(token, userId);
      showToast('Request sent!');
      fetchRequests(); // Refresh in background if needed
    } catch (err) {
      showToast(err.message || 'Failed to send request', 'error');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.acceptFriendRequest(token, requestId);
      fetchRequests();
      showToast('Friend request accepted');
    } catch (err) {
      showToast(err.message || 'Failed to accept request', 'error');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await api.declineFriendRequest(token, requestId);
      fetchRequests();
    } catch (err) {
      showToast(err.message || 'Failed to decline request', 'error');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    try {
      await api.removeFriend(token, friendId);
      fetchFriends();
      showToast('Friend removed');
    } catch (err) {
      showToast(err.message || 'Failed to remove friend', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'var(--accent-success)';
      case 'away': return 'var(--accent-warning)';
      case 'dnd': return 'var(--accent-danger)';
      default: return 'var(--text-dim)';
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-darkest)', height: '100%' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', minWidth: '120px' }}>
          <RiUserSmileFill size={24} /> Friends
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{ background: 'none', border: 'none', padding: '8px 12px', borderRadius: '8px', color: activeTab === 'all' ? 'var(--text-main)' : 'var(--text-muted)', backgroundColor: activeTab === 'all' ? 'var(--bg-card)' : 'transparent', cursor: 'pointer', fontWeight: activeTab === 'all' ? 600 : 500 }}
          >
            All Friends
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            style={{ background: 'none', border: 'none', padding: '8px 12px', borderRadius: '8px', color: activeTab === 'requests' ? 'var(--text-main)' : 'var(--text-muted)', backgroundColor: activeTab === 'requests' ? 'var(--bg-card)' : 'transparent', cursor: 'pointer', fontWeight: activeTab === 'requests' ? 600 : 500, position: 'relative' }}
          >
            Requests
            {requests.incoming.length > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: 'var(--accent-danger)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>
                {requests.incoming.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            style={{ background: 'none', border: 'none', padding: '8px 12px', borderRadius: '8px', color: activeTab === 'add' ? 'var(--accent-success)' : 'var(--text-muted)', backgroundColor: activeTab === 'add' ? 'rgba(39, 174, 96, 0.1)' : 'transparent', cursor: 'pointer', fontWeight: activeTab === 'add' ? 600 : 500 }}
          >
            Add Friend
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {activeTab === 'all' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              All Friends — {friends.length}
            </h3>
            {friends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
                <RiUserSmileFill size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <p>You haven't added any friends yet.</p>
                <button onClick={() => setActiveTab('add')} className="btn btn-primary" style={{ marginTop: '16px' }}>Find people on NexChat to start connecting.</button>
              </div>
            ) : (
              friends.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={f.avatar} alt={f.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', backgroundColor: getStatusColor(f.status), border: '2px solid var(--bg-card)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem' }}>{f.username}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{f.statusText}</div>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveFriend(f.id)} className="btn-icon" style={{ color: 'var(--accent-danger)' }} title="Remove Friend">
                    <RiUserUnfollowLine size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {requests.incoming.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Incoming Requests — {requests.incoming.length}
                </h3>
                {requests.incoming.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <img src={r.user.avatar} alt={r.user.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem' }}>{r.user.username}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleAcceptRequest(r.id)} className="btn-icon" style={{ backgroundColor: 'var(--accent-success)', color: 'var(--bg-darkest)', padding: '8px', borderRadius: '50%' }}>
                        <RiCheckLine size={20} />
                      </button>
                      <button onClick={() => handleDeclineRequest(r.id)} className="btn-icon" style={{ backgroundColor: 'var(--bg-darker)', color: 'var(--accent-danger)', padding: '8px', borderRadius: '50%' }}>
                        <RiCloseLine size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {requests.outgoing.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Sent Requests — {requests.outgoing.length}
                </h3>
                {requests.outgoing.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <img src={r.user.avatar} alt={r.user.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem' }}>{r.user.username}</div>
                    </div>
                    <button onClick={() => handleDeclineRequest(r.id)} className="btn-icon" style={{ color: 'var(--accent-danger)' }} title="Cancel Request">
                      <RiCloseLine size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {requests.incoming.length === 0 && requests.outgoing.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
                <RiUserAddFill size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <p>No pending friend requests.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '16px', fontWeight: 600 }}>
              Add Friend
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
              You can add friends with their NexChat username.
            </p>

            <div style={{ position: 'relative', marginBottom: '32px' }}>
              <div style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }}>
                <RiSearch2Line size={20} />
              </div>
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid var(--accent-success)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', boxShadow: '0 0 0 2px rgba(39, 174, 96, 0.1)' }}
              />
            </div>

            {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Searching...</div>}

            {!loading && searchResults.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Results</h4>
                {searchResults.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <img src={u.avatar} alt={u.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem' }}>{u.username}</div>
                    </div>
                    <button onClick={() => handleSendRequest(u.id)} className="btn" style={{ backgroundColor: 'var(--accent-success)', color: 'var(--bg-darkest)', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                      Send Request
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!loading && searchQuery.trim().length > 0 && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                No users found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: '-50%' }}
            style={{
              position: 'fixed',
              bottom: '40px',
              left: '50%',
              backgroundColor: toast.type === 'error' ? 'var(--accent-danger)' : 'var(--accent-success)',
              color: 'var(--bg-darkest)',
              padding: '12px 24px',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              fontWeight: 600,
              zIndex: 1000
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
