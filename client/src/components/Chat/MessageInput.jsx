import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import { Smile, Paperclip, Send, Mic, X, Square } from 'lucide-react';

export default function MessageInput({ isThread = false, threadParentId = null }) {
  const { socket } = useSocket();
  const { activeChannelId, typingUsers } = useChat();
  const { token } = useAuth();
  
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const channelId = activeChannelId;
  
  // Show typing indicator
  const channelTypers = typingUsers[channelId] ? Array.from(typingUsers[channelId]) : [];
  const showTyping = !isThread && channelTypers.length > 0;

  const handleTyping = (e) => {
    setContent(e.target.value);
    
    if (socket && channelId) {
      socket.emit('typing-start', { channelId });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing-stop', { channelId });
      }, 2000);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() && media.length === 0) return;
    
    const messageData = {
      channelId,
      content: content.trim(),
      media,
      parentId: isThread ? threadParentId : null
    };

    setContent('');
    setMedia([]);
    
    if (socket) {
      socket.emit('typing-stop', { channelId });
      socket.emit('send-message', messageData);
    }
    
    setTimeout(() => {
       inputRef.current?.focus();
    }, 10);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => api.uploadFile(token, file));
      const results = await Promise.all(uploadPromises);
      setMedia(prev => [...prev, ...results]);
    } catch (err) {
      alert('Error uploading file: ' + err.message);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
        
        setIsUploading(true);
        try {
          const result = await api.uploadFile(token, audioFile);
          setMedia(prev => [...prev, result]);
        } catch (err) {
          alert('Failed to upload voice note: ' + err.message);
        } finally {
          setIsUploading(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or not available');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div style={{ padding: '0 20px 24px 20px', position: 'relative' }}>
      {showTyping && (
        <div style={{ position: 'absolute', top: '-24px', left: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div className="typing-dots">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
          <span>{channelTypers.length === 1 ? 'Someone is typing...' : 'Several people are typing...'}</span>
        </div>
      )}

      {/* Media Previews */}
      {media.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', padding: '10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
          {media.map((m, i) => (
            <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {m.fileType === 'image' ? (
                <img src={m.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Paperclip size={24} style={{ color: 'var(--text-muted)' }} />
              )}
              <button 
                className="btn-icon" 
                style={{ position: 'absolute', top: 2, right: 2, padding: '2px', background: 'rgba(0,0,0,0.5)', color: 'white' }}
                onClick={() => removeMedia(i)}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form 
        onSubmit={handleSend}
        style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          backgroundColor: 'var(--bg-card)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '8px',
          border: '1px solid var(--border-color)',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--shadow-sm)'
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
      >
        <button type="button" className="btn-icon" title="Attach file" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          <Paperclip size={20} />
        </button>
        <input 
           type="file" 
           multiple 
           ref={fileInputRef} 
           style={{ display: 'none' }} 
           onChange={handleFileChange}
        />
        
        <textarea 
          ref={inputRef}
          value={content}
          onChange={handleTyping}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder={isUploading ? "Uploading..." : isRecording ? "Recording voice note..." : (isThread ? "Reply to thread..." : "Message channel...")}
          disabled={isUploading || isRecording}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            fontSize: '0.95rem',
            padding: '8px 12px',
            resize: 'none',
            minHeight: '24px',
            maxHeight: '150px',
            outline: 'none',
            fontFamily: 'inherit'
          }}
          rows={1}
        />

        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '4px' }}>
          <button type="button" className="btn-icon" title="Emoji">
            <Smile size={20} />
          </button>
          
          {isRecording ? (
            <button type="button" className="btn-icon" title="Stop Recording" onClick={stopRecording} style={{ color: 'var(--accent-danger)' }}>
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
            <button type="button" className="btn-icon" title="Voice Message" onClick={startRecording} disabled={isUploading}>
              <Mic size={20} />
            </button>
          )}

          <button 
             type="submit" 
             className="btn btn-primary" 
             style={{ padding: '8px', marginLeft: '4px', borderRadius: 'var(--radius-md)' }}
             disabled={(!content.trim() && media.length === 0) || isUploading}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
