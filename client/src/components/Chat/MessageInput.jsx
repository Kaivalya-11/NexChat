import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import { 
  RiAttachment2, 
  RiEmotionHappyLine, 
  RiMicFill, 
  RiStopFill, 
  RiSendPlane2Fill, 
  RiCloseLine, 
  RiFileTextFill, 
  RiImage2Fill, 
  RiCamera3Fill, 
  RiHeadphoneFill, 
  RiUser3Fill, 
  RiBarChart2Fill, 
  RiStickyNoteFill, 
  RiAddLine, 
  RiDeleteBin6Line, 
  RiSearch2Line 
} from 'react-icons/ri';
import EmojiPicker from 'emoji-picker-react';
import CameraModal from './CameraModal';
import ContactModal from './ContactModal';
import PollModal from './PollModal';
const STICKERS = [
  { id: 'cat-love', name: 'Cat Love', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Y2Z285eWhmZjJmbmtraXR1ZWlhaHVwNzcxOHUzZ3N2bzI3dXk5NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/MDJ9IbxxvDUQM/giphy.gif' },
  { id: 'pepe-hype', name: 'Pepe Hype', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmhjbnZndDliYXdwZjVlM3hsbXZ4bmtic3MxeDZwZnFtcWNvMnJveiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/blSTtZehjAZ8I/giphy.gif' },
  { id: 'doge-cool', name: 'Doge Cool', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnJ2dnFqdDF3N3gwb2c3YXA1ZHczNzVnZWNpa3dsMnpwMzA4amtyMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/qrwthQPP4P6vnJh813/giphy.gif' },
  { id: 'mind-blown', name: 'Mind Blown', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGcxcnptbHhqcnhvdTcyNzZ3cnY2ajJodnd3enNiazhudTJyN2tzZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: 'fire-lit', name: 'Fire', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbjNrdHJ4MnJtdjN6OG45ZHV3NDkxdmt3Y2FicGJwbnlsaG5yM2h3NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Lopx9eUi34rbq/giphy.gif' },
  { id: 'thumbs-up', name: 'Thumbs Up', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXZpMnZxbzhhNGhxdmtzcnppNG40ZXNudGNpaXZuMm02enI3cGdrYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/13G7nlmwuVYC2Y/giphy.gif' },
  { id: 'party-blob', name: 'Party Blob', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcGtxZnFzMjhvZTV5a3MydTFxbHB6enA5czZrdTVsdzRqN25yMTRxdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l3q2K5jinAlChoCLS/giphy.gif' },
  { id: 'pika-shock', name: 'Pikachu', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWVjY2Jkb25vaW5yNHQwcTBpOHcxa3ZwbGNxZmtyNmtkOHZ4NXN3dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3kzJvEciJa94SMW3hE/giphy.gif' },
];

export default function MessageInput({ isThread = false, threadParentId = null }) {
  const { socket } = useSocket();
  const { activeChannelId, typingUsers, replyingTo, setReplyingTo, sendMessage, channels } = useChat();
  const { token, user } = useAuth();
  
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const channelId = activeChannelId;
  const currentChannel = channels?.find(c => c.id === channelId);
  
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
    e?.preventDefault();
    if (!content.trim() && media.length === 0) return;
    
    const messageData = {
      channelId,
      content: content.trim(),
      media,
      parentId: isThread ? threadParentId : null,
      quote: (!isThread && replyingTo) ? {
        messageId: replyingTo.id,
        senderName: replyingTo.sender.username,
        content: replyingTo.content || 'Attachment'
      } : null
    };

    setContent('');
    setMedia([]);
    setReplyingTo(null);
    
    if (socket) {
      socket.emit('typing-stop', { channelId });
    }
    sendMessage(messageData);
    
    setTimeout(() => {
       inputRef.current?.focus();
    }, 10);
  };

  const handleSendSticker = (stickerUrl) => {
    if (channelId) {
      sendMessage({
        channelId,
        type: 'sticker',
        content: stickerUrl,
        parentId: isThread ? threadParentId : null
      });
      setShowStickerPicker(false);
    }
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const insertFormat = (prefix, suffix) => {
    if (!inputRef.current) return;
    
    const textarea = inputRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
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
    <div className="message-input-container" style={{ padding: '0 16px 16px 16px', position: 'relative' }}>
      {showTyping && (
        <div style={{ position: 'absolute', top: '-28px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', zIndex: 10 }}>
          <div className="typing-dots">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
          <span>{channelTypers.length === 1 ? 'Someone is typing...' : 'Several people are typing...'}</span>
        </div>
      )}

      {media.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', padding: '10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          {media.map((m, i) => (
            <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {m.fileType === 'image' ? (
                <img src={m.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <RiFileTextFill size={24} style={{ color: 'var(--text-muted)' }} />
              )}
              <button 
                className="btn-icon" 
                style={{ position: 'absolute', top: 2, right: 2, padding: '2px', background: 'rgba(0,0,0,0.5)', color: 'white' }}
                onClick={() => removeMedia(i)}
              >
                <RiCloseLine size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {replyingTo && !isThread && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-hover)',
          padding: '10px 14px',
          borderLeft: '4px solid var(--accent-primary)',
          borderTop: '1px solid var(--border-color)',
          borderRight: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
        }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '2px' }}>
              Replying to {replyingTo.sender.username}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {replyingTo.content || 'Attachment'}
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={() => setReplyingTo(null)}>
            <RiCloseLine size={18} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', paddingLeft: '4px', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insertFormat('**', '**'); }} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '4px 8px', fontSize: '10px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>[bold]</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insertFormat('*', '*'); }} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '4px 8px', fontSize: '10px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>[italic]</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insertFormat('[', '](url)'); }} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '4px 8px', fontSize: '10px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>[link]</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insertFormat('`', '`'); }} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '4px 8px', fontSize: '10px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>[code]</button>
      </div>

      <form 
        onSubmit={handleSend}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          backgroundColor: 'var(--input-pill-bg)', 
          padding: '8px 12px',
          border: '1px solid var(--border-color)',
          borderTop: '2px solid var(--accent-primary)',
          transition: 'all 0.2s ease',
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn-icon" 
            title="Attach file" 
            onClick={() => setShowAttachMenu(!showAttachMenu)} 
            disabled={isUploading}
            style={{ 
               backgroundColor: showAttachMenu ? 'rgba(128, 128, 128, 0.15)' : 'transparent',
               color: showAttachMenu ? 'var(--text-main)' : 'var(--text-muted)',
               padding: '6px',
               borderRadius: '50%'
            }}
          >
            <RiAttachment2 size={20} style={{ transform: showAttachMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>

          {showAttachMenu && (
            <div 
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '0',
                marginBottom: '12px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 0',
                width: '220px',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 100,
                border: '1px solid var(--border-color)',
                animation: 'slideUpFade 0.2s ease-out'
              }}
            >
              {[
                { icon: RiFileTextFill, label: 'Document', color: '#7f66ff', accept: '.pdf,.doc,.docx,.txt,.csv,.zip,.rar,.xls,.xlsx,.ppt,.pptx' },
                { icon: RiImage2Fill, label: 'Photos & videos', color: '#007aff', accept: 'image/*,video/*' },
                { icon: RiCamera3Fill, label: 'Camera', color: '#ff2d55', action: 'camera' },
                { icon: RiHeadphoneFill, label: 'Audio', color: '#ff9500', accept: 'audio/*' },
                { icon: RiUser3Fill, label: 'Contact', color: '#34c759', action: 'contact' },
                { icon: RiBarChart2Fill, label: 'Poll', color: '#ffcc00', action: 'poll' },
                { icon: RiStickyNoteFill, label: 'New sticker', color: '#00c7be', action: 'sticker' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    if (item.accept && fileInputRef.current) {
                      fileInputRef.current.accept = item.accept;
                      fileInputRef.current.click();
                    } else if (item.action === 'camera') {
                      setShowCameraModal(true);
                    } else if (item.action === 'contact') {
                      setShowContactModal(true);
                    } else if (item.action === 'poll') {
                      setShowPollModal(true);
                    } else if (item.action === 'sticker') {
                      setShowStickerPicker(true);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 500,
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ color: item.color, display: 'flex', alignItems: 'center' }}>
                    <item.icon size={20} />
                  </div>
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {showStickerPicker && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: '12px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              width: '300px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              zIndex: 110,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RiStickyNoteFill size={18} style={{ color: '#00c7be' }} /> Send a Sticker
                </span>
                <button type="button" className="btn-icon" onClick={() => setShowStickerPicker(false)}>
                  <RiCloseLine size={18} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                {STICKERS.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSendSticker(s.url)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <img src={s.url} alt={s.name} style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
          placeholder={isUploading ? "Uploading..." : isRecording ? "Recording voice note..." : "Type a message..."}
          disabled={isUploading || isRecording}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '13px',
            padding: '8px 10px',
            resize: 'none',
            minHeight: '24px',
            maxHeight: '150px',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: '1.4'
          }}
          rows={1}
        />

        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '4px' }}>
          <div style={{ position: 'relative' }}>
            <button type="button" className="btn-icon" title="Emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <RiEmotionHappyLine size={22} />
            </button>
            {showEmojiPicker && (
              <div style={{ position: 'absolute', bottom: '100%', right: 0, zIndex: 50, marginBottom: '8px' }}>
                <EmojiPicker onEmojiClick={(emojiObj) => {
                  setContent(prev => prev + emojiObj.emoji);
                  setShowEmojiPicker(false);
                  inputRef.current?.focus();
                }} theme="dark" />
              </div>
            )}
          </div>
          
          {isRecording ? (
            <button type="button" className="btn-icon" title="Stop Recording" onClick={stopRecording} style={{ color: 'var(--accent-danger)' }}>
              <RiStopFill size={22} />
            </button>
          ) : (
            <button type="button" className="btn-icon" title="Voice Message" onClick={startRecording} disabled={isUploading}>
              <RiMicFill size={22} />
            </button>
          )}

          <button 
             type="submit" 
             style={{ 
               padding: '10px 14px', 
               marginLeft: '6px', 
               backgroundColor: '#9BB7AE', 
               color: '#1A2F26', 
               border: 'none', 
               cursor: (!content.trim() && media.length === 0) || isUploading ? 'not-allowed' : 'pointer',
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               borderRadius: 'var(--radius-md)',
               opacity: (!content.trim() && media.length === 0) || isUploading ? 0.75 : 1,
               transition: 'all 0.2s ease',
               boxShadow: '0 2px 8px rgba(155, 183, 174, 0.4)'
             }}
             disabled={(!content.trim() && media.length === 0) || isUploading}
          >
            <RiSendPlane2Fill size={18} />
          </button>
        </div>
      </form>

      {showCameraModal && (
        <CameraModal
          onClose={() => setShowCameraModal(false)}
          onAttach={(uploadedMedia) => {
            setMedia(prev => [...prev, uploadedMedia]);
            setShowCameraModal(false);
          }}
        />
      )}

      {showContactModal && (
        <ContactModal
          onClose={() => setShowContactModal(false)}
          onSendContact={(contactObj) => {
            if (channelId) {
              sendMessage({
                channelId,
                type: 'contact',
                content: JSON.stringify(contactObj),
                parentId: isThread ? threadParentId : null
              });
              setShowContactModal(false);
            }
          }}
        />
      )}

      {showPollModal && (
        <PollModal
          onClose={() => setShowPollModal(false)}
          onCreatePoll={(pollData) => {
            if (channelId) {
              sendMessage({
                channelId,
                type: 'poll',
                content: JSON.stringify(pollData),
                parentId: isThread ? threadParentId : null
              });
              setShowPollModal(false);
            }
          }}
        />
      )}
    </div>
  );
}
