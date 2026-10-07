import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { 
  RiMicFill, 
  RiMicOffFill, 
  RiVideoChatFill, 
  RiCameraOffFill, 
  RiComputerLine, 
  RiPhoneFill, 
  RiFullscreenLine, 
  RiFullscreenExitLine, 
  RiGroupFill 
} from 'react-icons/ri';

function VideoStream({ stream, isMuted = false, isLocal = false, username, avatar }) {
  const videoRef = useRef(null);
  const hasVideoTrack = stream && stream.getVideoTracks().some(t => t.enabled);

  useEffect(() => {
    if (videoRef.current && stream && hasVideoTrack) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, hasVideoTrack]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: '#0d1117',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
    }}>
      {hasVideoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || isMuted}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isLocal ? 'scaleX(-1)' : 'none' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <img
            src={avatar || `https://ui-avatars.com/api/?name=${username || 'User'}`}
            alt={username}
            style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid var(--accent-primary)', objectFit: 'cover' }}
          />
          <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{username}</span>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        color: '#fff',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span>{isLocal ? 'You' : username}</span>
        {isMuted && <RiMicOffFill size={14} style={{ color: '#ff4d4f' }} />}
      </div>
    </div>
  );
}

export default function VideoCallModal() {
  const {
    callState,
    isVideo,
    incomingCall,
    localStream,
    remoteStreams,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    isMinimized,
    setIsMinimized,
    acceptCall,
    declineCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare
  } = useCall();

  const { user } = useAuth();
  const { channels, activeChannelId } = useChat();

  const activeChannel = channels.find(c => c.id === activeChannelId);

  if (callState === 'idle') return null;

  if (callState === 'incoming' && incomingCall) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: '#161b22',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            animation: 'pulse 2s infinite'
          }}
        >
          <img
            src={incomingCall.caller.avatar || `https://ui-avatars.com/api/?name=${incomingCall.caller.username}`}
            alt={incomingCall.caller.username}
            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.98rem' }}>
              Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              From {incomingCall.caller.username}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
            <button
              onClick={declineCall}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#ff3b30',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Decline"
            >
              <RiPhoneFill size={20} style={{ transform: 'rotate(135deg)' }} />
            </button>

            <button
              onClick={acceptCall}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#34c759',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Accept"
            >
              <RiPhoneFill size={20} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (isMinimized) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '260px',
        height: '160px',
        backgroundColor: '#161b22',
        borderRadius: '16px',
        zIndex: 9999,
        boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.12)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34c759' }} /> In Call
          </span>
          <button className="btn-icon" onClick={() => setIsMinimized(false)} style={{ padding: '2px' }}>
            <RiFullscreenLine size={16} />
          </button>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <VideoStream stream={localStream} isLocal={true} username={user?.username} avatar={user?.avatar} />
        </div>
      </div>
    );
  }

  const remoteCount = Object.keys(remoteStreams).length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(10, 14, 18, 0.95)',
      backdropFilter: 'blur(16px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RiGroupFill size={18} /> {remoteCount + 1} Participant{remoteCount !== 0 ? 's' : ''}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {activeChannel?.name ? `#${activeChannel.name}` : 'Video Call'}
          </div>
        </div>

        <button className="btn-icon" onClick={() => setIsMinimized(true)} title="Minimize to PiP">
          <RiFullscreenExitLine size={22} />
        </button>
      </div>

      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: remoteCount === 0 ? '1fr' : remoteCount === 1 ? '1fr 1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto'
      }}>
        <VideoStream stream={localStream} isMuted={isMicMuted} isLocal={true} username={user?.username} avatar={user?.avatar} />

        {Object.entries(remoteStreams).map(([userId, { stream, user: remoteUser }]) => (
          <VideoStream
            key={userId}
            stream={stream}
            username={remoteUser?.username || 'Participant'}
            avatar={remoteUser?.avatar}
          />
        ))}

        {callState === 'calling' && remoteCount === 0 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            color: 'rgba(255,255,255,0.7)'
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '8px' }}>Ringing...</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Waiting for others to join</div>
          </div>
        )}
      </div>

      <div style={{
        margin: '20px auto 0 auto',
        padding: '12px 24px',
        backgroundColor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)'
      }}>
        <button
          onClick={toggleMic}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: isMicMuted ? '#ff3b30' : 'rgba(255,255,255,0.12)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMicMuted ? <RiMicOffFill size={22} /> : <RiMicFill size={22} />}
        </button>

        <button
          onClick={toggleCamera}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: isCameraOff ? '#ff3b30' : 'rgba(255,255,255,0.12)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isCameraOff ? <RiCameraOffFill size={22} /> : <RiVideoChatFill size={22} />}
        </button>

        <button
          onClick={toggleScreenShare}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: isScreenSharing ? 'var(--accent-primary)' : 'rgba(255,255,255,0.12)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <RiComputerLine size={22} />
        </button>

        <button
          onClick={endCall}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#ff3b30',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '12px',
            boxShadow: '0 4px 16px rgba(255,59,48,0.4)',
            transition: 'transform 0.15s ease'
          }}
          title="End Call"
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <RiPhoneFill size={24} style={{ transform: 'rotate(135deg)' }} />
        </button>
      </div>
    </div>
  );
}
