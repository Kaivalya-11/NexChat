import React, { useState } from 'react';
import { RiBarChart2Fill, RiCloseLine, RiDeleteBin6Line, RiAddLine } from 'react-icons/ri';

export default function PollModal({ onClose, onCreatePoll }) {
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validOpts = pollOptions.map(o => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || validOpts.length < 2) {
      alert('Please enter a question and at least 2 options.');
      return;
    }

    const pollData = {
      question: pollQuestion.trim(),
      options: validOpts.map((text, i) => ({ id: i, text, votes: [] })),
      allowMultiple
    };

    onCreatePoll(pollData);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)', borderRadius: '16px', width: '90%', maxWidth: '460px',
        padding: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RiBarChart2Fill size={20} style={{ color: '#ffcc00' }} /> Create Poll
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <RiCloseLine size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              QUESTION
            </label>
            <input
              type="text"
              placeholder="Ask a question..."
              value={pollQuestion}
              onChange={e => setPollQuestion(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-main)', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              OPTIONS
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {pollOptions.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={e => {
                      const next = [...pollOptions];
                      next[i] = e.target.value;
                      setPollOptions(next);
                    }}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-main)', outline: 'none' }}
                  />
                  {pollOptions.length > 2 && (
                    <button type="button" className="btn-icon" style={{ color: '#ff4d4f' }} onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}>
                      <RiDeleteBin6Line size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {pollOptions.length < 10 && (
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ''])}
                style={{ marginTop: '8px', background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RiAddLine size={18} /> Add Option
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <input
              type="checkbox"
              id="allowMultiple"
              checked={allowMultiple}
              onChange={e => setAllowMultiple(e.target.checked)}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <label htmlFor="allowMultiple" style={{ color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
              Allow multiple answers
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '100px' }}>
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
