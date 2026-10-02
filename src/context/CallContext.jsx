import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';

const CallContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function CallProvider({ children }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { channels } = useChat();

  const [callState, setCallState] = useState('idle'); // 'idle', 'calling', 'incoming', 'connected'
  const [isVideo, setIsVideo] = useState(true);
  const [activeCallChannelId, setActiveCallChannelId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // userId -> { stream, user }

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const peerConnectionsRef = useRef({}); // userId -> RTCPeerConnection
  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);

  // Sound effects helper
  const playRingtone = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 1200);
    } catch (e) {}
  }, []);

  // Cleanup helper
  const cleanupCall = useCallback(() => {
    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Close peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => {
      try { pc.close(); } catch (e) {}
    });
    peerConnectionsRef.current = {};

    setRemoteStreams({});
    setCallState('idle');
    setActiveCallChannelId(null);
    setIncomingCall(null);
    setIsMicMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setIsMinimized(false);
  }, []);

  // Initialize WebRTC Peer Connection
  const createPeerConnection = useCallback((targetUserId, targetUserInfo) => {
    if (peerConnectionsRef.current[targetUserId]) {
      return peerConnectionsRef.current[targetUserId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[targetUserId] = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStreams(prev => ({
        ...prev,
        [targetUserId]: { stream, user: targetUserInfo }
      }));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-signal', {
          toUserId: targetUserId,
          signal: event.candidate,
          type: 'candidate'
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[targetUserId];
          return next;
        });
      }
    };

    return pc;
  }, [socket]);

  // Handle incoming socket call signals
  useEffect(() => {
    if (!socket || !user) return;

    const handleIncomingCall = ({ channelId, caller, isVideo: callIsVideo }) => {
      if (callState !== 'idle') {
        // Busy
        socket.emit('reject-call', { channelId });
        return;
      }
      setIncomingCall({ caller, channelId, isVideo: callIsVideo });
      setCallState('incoming');
      playRingtone();
    };

    const handleCallAccepted = async ({ channelId, user: acceptorUser }) => {
      if (acceptorUser.id === user.id) return;
      setCallState('connected');

      // Create WebRTC Offer
      try {
        const pc = createPeerConnection(acceptorUser.id, acceptorUser);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('webrtc-signal', {
          toUserId: acceptorUser.id,
          signal: offer,
          type: 'offer'
        });
      } catch (err) {
        console.error('Error creating WebRTC offer:', err);
      }
    };

    const handleCallRejected = () => {
      alert('Call declined');
      cleanupCall();
    };

    const handleCallEnded = () => {
      cleanupCall();
    };

    const handleWebRTCSignal = async ({ fromUserId, signal, type }) => {
      try {
        let pc = peerConnectionsRef.current[fromUserId];
        if (!pc && type === 'offer') {
          pc = createPeerConnection(fromUserId, { id: fromUserId, username: 'Participant' });
        }

        if (!pc) return;

        if (type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('webrtc-signal', {
            toUserId: fromUserId,
            signal: answer,
            type: 'answer'
          });
        } else if (type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (type === 'candidate') {
          await pc.addIceCandidate(new RTCIceCandidate(signal));
        }
      } catch (err) {
        console.error('Error handling WebRTC signal:', err);
      }
    };

    const handleParticipantMediaToggled = ({ userId: toggledUserId }) => {
      setRemoteStreams(prev => {
        if (!prev[toggledUserId]) return prev;
        const current = prev[toggledUserId];
        const newStream = new MediaStream(current.stream.getTracks());
        return {
          ...prev,
          [toggledUserId]: { ...current, stream: newStream }
        };
      });
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('webrtc-signal', handleWebRTCSignal);
    socket.on('participant-media-toggled', handleParticipantMediaToggled);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('webrtc-signal', handleWebRTCSignal);
      socket.off('participant-media-toggled', handleParticipantMediaToggled);
    };
  }, [socket, user, callState, createPeerConnection, playRingtone, cleanupCall]);

  // Start Call
  const startCall = async (channelId, videoMode = true) => {
    try {
      setIsVideo(videoMode);
      setActiveCallChannelId(channelId);
      setCallState('calling');

      // Acquire User Media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoMode,
        audio: true
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Broadcast call initiation
      if (socket) {
        socket.emit('call-user', { channelId, isVideo: videoMode });
      }
    } catch (err) {
      alert('Could not access camera/microphone: ' + err.message);
      cleanupCall();
    }
  };

  // Accept Incoming Call
  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      const videoMode = incomingCall.isVideo;
      setIsVideo(videoMode);
      setActiveCallChannelId(incomingCall.channelId);
      setCallState('connected');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoMode,
        audio: true
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      if (socket) {
        socket.emit('accept-call', { channelId: incomingCall.channelId });
      }
      setIncomingCall(null);
    } catch (err) {
      alert('Could not access media device: ' + err.message);
      declineCall();
    }
  };

  // Decline Incoming Call
  const declineCall = () => {
    if (socket && incomingCall) {
      socket.emit('reject-call', { channelId: incomingCall.channelId });
    }
    cleanupCall();
  };

  // End Current Call
  const endCall = () => {
    if (socket && activeCallChannelId) {
      socket.emit('end-call', { channelId: activeCallChannelId });
    }
    cleanupCall();
  };

  // Toggle Mute Audio
  const toggleMic = () => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicMuted(!audioTrack.enabled);
    }

    const updatedStream = new MediaStream(localStreamRef.current.getTracks());
    localStreamRef.current = updatedStream;
    setLocalStream(updatedStream);

    if (socket && activeCallChannelId) {
      socket.emit('call-toggle-media', {
        channelId: activeCallChannelId,
        mediaType: 'audio',
        isEnabled: audioTrack ? audioTrack.enabled : true
      });
    }
  };

  // Toggle Camera
  const toggleCamera = async () => {
    if (!localStreamRef.current) return;

    let videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    } else {
      try {
        const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = vStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newTrack);

        Object.values(peerConnectionsRef.current).forEach(pc => {
          pc.addTrack(newTrack, localStreamRef.current);
        });
        setIsCameraOff(false);
      } catch (err) {
        console.error('Error acquiring video track:', err);
        return;
      }
    }

    const updatedStream = new MediaStream(localStreamRef.current.getTracks());
    localStreamRef.current = updatedStream;
    setLocalStream(updatedStream);

    if (socket && activeCallChannelId) {
      socket.emit('call-toggle-media', {
        channelId: activeCallChannelId,
        mediaType: 'video',
        isEnabled: videoTrack ? videoTrack.enabled : true
      });
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoTrack = camStream.getVideoTracks()[0];
        
        const sender = Object.values(peerConnectionsRef.current)
          .map(pc => pc.getSenders().find(s => s.track.kind === 'video'))
          .find(Boolean);

        if (sender) sender.replaceTrack(videoTrack);

        localStreamRef.current = camStream;
        setLocalStream(camStream);
        setIsScreenSharing(false);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Switch to display media
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => toggleScreenShare();

        Object.values(peerConnectionsRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        localStreamRef.current = screenStream;
        setLocalStream(screenStream);
        setIsScreenSharing(true);
      } catch (e) {
        console.error('Screen sharing canceled or failed:', e);
      }
    }
  };

  const value = {
    callState,
    isVideo,
    activeCallChannelId,
    incomingCall,
    localStream,
    remoteStreams,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    isMinimized,
    setIsMinimized,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  return useContext(CallContext);
}
