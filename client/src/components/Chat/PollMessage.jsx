import React from 'react';
import { 
  RiBarChart2Fill, 
  RiCheckboxCircleFill, 
  RiCheckboxBlankCircleLine, 
  RiCheckboxFill, 
  RiCheckboxBlankLine 
} from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';

export default function PollMessage({ message }) {
  const { user } = useAuth();
  const { activeChannelId, votePoll } = useChat();

  let poll = { question: 'Poll', options: [], allowMultiple: false };
  try {
    poll = typeof message.content === 'string' ? JSON.parse(message.content) : message.content;
  } catch (e) {
    return <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>[Poll content unavailable]</div>;
  }

  const allVoters = new Set();
  poll.options.forEach(opt => (opt.votes || []).forEach(v => allVoters.add(v)));
  const totalVoters = allVoters.size;

  const handlePollVote = (optionIndex) => {
    votePoll(message.id, optionIndex, activeChannelId);
  };

  return (
    <div style={{
      marginTop: '6px',
      width: '100%',
      maxWidth: '340px',
      backgroundColor: 'var(--bg-dark)',
      borderRadius: '14px',
      padding: '14px',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ padding: '6px', backgroundColor: 'rgba(255, 204, 0, 0.15)', borderRadius: '8px', color: '#ffcc00' }}>
          <RiBarChart2Fill size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.3' }}>
            {poll.question}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {poll.allowMultiple ? 'Select one or more' : 'Select one option'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {poll.options.map((option, idx) => {
          const votes = option.votes || [];
          const userVoted = votes.includes(user.id);
          const percentage = totalVoters > 0 ? Math.round((votes.length / totalVoters) * 100) : 0;

          return (
            <div
              key={idx}
              onClick={() => handlePollVote(idx)}
              style={{
                position: 'relative',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-hover)',
                border: `1px solid ${userVoted ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${percentage}%`,
                  backgroundColor: userVoted ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.06)',
                  transition: 'width 0.3s ease',
                  zIndex: 0
                }}
              />

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px', flex: 1, paddingRight: '8px' }}>
                <div style={{ color: userVoted ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                  {poll.allowMultiple ? (
                    userVoted ? <RiCheckboxFill size={18} /> : <RiCheckboxBlankLine size={18} />
                  ) : (
                    userVoted ? <RiCheckboxCircleFill size={18} /> : <RiCheckboxBlankCircleLine size={18} />
                  )}
                </div>
                <span style={{ fontSize: '0.88rem', color: userVoted ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: userVoted ? 600 : 400 }}>
                  {option.text}
                </span>
              </div>

              <div style={{ position: 'relative', zIndex: 1, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{votes.length}</span>
                <span>({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <span>{totalVoters} {totalVoters === 1 ? 'vote' : 'votes'} total</span>
        <span>Click an option to vote</span>
      </div>
    </div>
  );
}
