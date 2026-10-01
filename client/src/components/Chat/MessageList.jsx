import React, { useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import MessageItem from './MessageItem';

export default function MessageList() {
  const { messages, loadingMessages } = useChat();
  const { user } = useAuth();
  const bottomRef = useRef(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (loadingMessages && messages.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading messages...
      </div>
    );
  }

  // Simple grouping logic by day could be added here
  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto', 
      padding: '20px 20px 0 20px', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'var(--bg-darkest)'
    }}>
      {messages.length === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👋</div>
          <h3>Start of the conversation</h3>
          <p>Send a message to break the ice!</p>
        </div>
      )}

      {messages.map((msg, index) => {
        const prevMsg = index > 0 ? messages[index - 1] : null;
        // Group if same sender and within 5 mins
        const isGrouped = prevMsg && 
                          prevMsg.sender.id === msg.sender.id && 
                          new Date(msg.createdAt) - new Date(prevMsg.createdAt) < 300000;

        return (
          <MessageItem 
            key={msg.id} 
            message={msg} 
            isGrouped={isGrouped} 
            isOwn={msg.sender.id === user.id} 
          />
        );
      })}
      <div ref={bottomRef} style={{ height: '20px' }} />
    </div>
  );
}
