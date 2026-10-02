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
  const { activeChannelId, typingUsers, replyingTo, setReplyingTo } = useChat();
  const { token, user } = useAuth();
  
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Modals
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

  // Contact state
  const [usersList, setUsersList] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [customContactName, setCustomContactName] = useState('');
  const [customContactPhone, setCustomContactPhone] = useState('');

  // Camera state
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraErr, setCameraErr] = useState('');

  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const channelId = activeChannelId;
  
  // Show typing indicator
  const channelTypers = typingUsers[channelId] ? Array.from(typingUsers[channelId]) : [];
  const showTyping = !isThread && channelTypers.length > 0;

  // Load users list for contact picker
  useEffect(() => {
    if (showContactModal && token) {
      api.getAllUsers(token)
        .then(data => setUsersList(data || []))
        .catch(err => console.error('Error fetching users:', err));
    }
  }, [showContactModal, token]);

  // Handle live camera stream
  useEffect(() => {
    if (showCameraModal) {
      setCameraErr('');
      setCapturedImage(null);
      navigator.mediaDevices?.getUserMedia({ video: true })
        .then(stream => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          setCameraErr('Camera access unavailable or denied');
        });
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setCapturedImage(null);
    }
  }, [showCameraModal]);

  const snapPhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setCapturedImage(canvas.toDataURL('image/jpeg'));
    }
  };

  const uploadCapturedPhoto = async () => {
    if (!capturedImage) return;
    setIsUploading(true);
    setShowCameraModal(false);
    try {
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const uploaded = await api.uploadFile(token, file);
      setMedia(prev => [...prev, uploaded]);
    } catch (err) {
      alert('Failed to upload camera snapshot: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

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
      socket.emit('send-message', messageData);
    }
    
    setTimeout(() => {
       inputRef.current?.focus();
    }, 10);
  };

  const handleSendSticker = (stickerUrl) => {
    if (socket && channelId) {
      socket.emit('send-message', {
        channelId,
        type: 'sticker',
        content: stickerUrl,
        parentId: isThread ? threadParentId : null
      });
      setShowStickerPicker(false);
    }
  };

  const handleSendContact = (contactObj) => {
    if (socket && channelId) {
      socket.emit('send-message', {
        channelId,
        type: 'contact',
        content: JSON.stringify(contactObj),
        parentId: isThread ? threadParentId : null
      });
      setShowContactModal(false);
      setCustomContactName('');
      setCustomContactPhone('');
    }
  };

  const handleCreatePoll = (e) => {
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

    if (socket && channelId) {
      socket.emit('send-message', {
        channelId,
        type: 'poll',
        content: JSON.stringify(pollData),
        parentId: isThread ? threadParentId : null
      });
      setShowPollModal(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setAllowMultiple(false);
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

      {/* Media Previews */}
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

      <form 
        onSubmit={handleSend}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          backgroundColor: 'var(--msg-card-bg)', 
          borderRadius: replyingTo && !isThread ? '0 0 24px 24px' : '24px', 
          padding: '6px 10px 6px 14px',
          border: '1px solid var(--border-color)',
          borderTop: replyingTo && !isThread ? 'none' : '1px solid var(--border-color)',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--shadow-sm)'
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
               backgroundColor: showAttachMenu ? 'rgba(255,255,255,0.08)' : 'transparent',
               color: showAttachMenu ? '#ffffff' : 'rgba(255,255,255,0.55)',
               padding: '6px'
            }}
          >
            <RiAttachment2 size={20} style={{ transform: showAttachMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>

          {/* WhatsApp Style Attachment Menu */}
          {showAttachMenu && (
            <div 
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '0',
                marginBottom: '12px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '16px',
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

          {/* Sticker Picker Drawer */}
          {showStickerPicker && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: '12px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
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
               padding: '8px 12px', 
               marginLeft: '6px', 
               borderRadius: '12px', 
               backgroundColor: '#14b8a6', 
               color: '#ffffff', 
               border: 'none', 
               cursor: (!content.trim() && media.length === 0) || isUploading ? 'not-allowed' : 'pointer',
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               boxShadow: '0 4px 12px rgba(20, 184, 166, 0.4)',
               opacity: (!content.trim() && media.length === 0) || isUploading ? 0.6 : 1,
               transition: 'all 0.2s ease'
             }}
             disabled={(!content.trim() && media.length === 0) || isUploading}
          >
            <RiSendPlane2Fill size={18} />
          </button>
        </div>
      </form>

      {/* --- CAMERA MODAL --- */}
      {showCameraModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '520px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '16px', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiCamera3Fill size={20} style={{ color: '#ff2d55' }} /> Take Photo
              </h3>
              <button className="btn-icon" onClick={() => setShowCameraModal(false)}>
                <RiCloseLine size={22} />
              </button>
            </div>

            {cameraErr ? (
              <div style={{ color: '#ff4d4f', padding: '20px', textAlign: 'center' }}>{cameraErr}</div>
            ) : capturedImage ? (
              <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }} />
            ) : (
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: '12px', backgroundColor: '#000', marginBottom: '16px' }} />
            )}

            <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
              {capturedImage ? (
                <>
                  <button className="btn btn-secondary" onClick={() => setCapturedImage(null)} style={{ flex: 1 }}>
                    Retake
                  </button>
                  <button className="btn btn-primary" onClick={uploadCapturedPhoto} style={{ flex: 1 }}>
                    Attach Photo
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={snapPhoto} disabled={!!cameraErr} style={{ width: '100%', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <RiCamera3Fill size={20} /> Capture Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- CONTACT MODAL --- */}
      {showContactModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '440px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiUser3Fill size={20} style={{ color: '#34c759' }} /> Share Contact
              </h3>
              <button className="btn-icon" onClick={() => setShowContactModal(false)}>
                <RiCloseLine size={22} />
              </button>
            </div>

            {/* Filter Search */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-dark)', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', border: '1px solid var(--border-color)' }}>
              <RiSearch2Line size={18} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
              <input
                type="text"
                placeholder="Search users..."
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', width: '100%' }}
              />
            </div>

            {/* Users list */}
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {usersList
                .filter(u => u.id !== user.id && u.username.toLowerCase().includes(contactSearch.toLowerCase()))
                .map(u => (
                  <div
                    key={u.id}
                    onClick={() => handleSendContact({ name: u.username, email: u.email, avatar: u.avatar, userId: u.id, phone: u.phone || '+1 (555) 019-2834' })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                  >
                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}`} alt={u.username} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{u.username}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Custom Contact Form */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>OR CUSTOM CONTACT:</div>
              <input
                type="text"
                placeholder="Full Name"
                value={customContactName}
                onChange={e => setCustomContactName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-main)', marginBottom: '8px', outline: 'none' }}
              />
              <input
                type="text"
                placeholder="Phone Number / Email"
                value={customContactPhone}
                onChange={e => setCustomContactPhone(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-main)', marginBottom: '12px', outline: 'none' }}
              />
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={!customContactName.trim()}
                onClick={() => handleSendContact({ name: customContactName.trim(), phone: customContactPhone.trim() || '+1 (555) 000-0000' })}
              >
                Send Custom Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- POLL MODAL --- */}
      {showPollModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '460px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RiBarChart2Fill size={20} style={{ color: '#ffcc00' }} /> Create Poll
              </h3>
              <button className="btn-icon" onClick={() => setShowPollModal(false)}>
                <RiCloseLine size={22} />
              </button>
            </div>

            <form onSubmit={handleCreatePoll}>
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowPollModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '100px' }}>
                  Create Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
