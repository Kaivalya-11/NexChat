import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { Wifi, WifiOff, RefreshCcw } from 'lucide-react';

export default function ConnectionBanner() {
  const { connectionState } = useSocket();

  if (connectionState === 'connected') {
    return null; // hide when connected (or use CSS fade out)
  }

  let icon = <Wifi size={14} />;
  let text = 'Connected';
  
  if (connectionState === 'connecting') {
    icon = <RefreshCcw size={14} className="spin" />;
    text = 'Connecting to server...';
  } else if (connectionState === 'disconnected') {
    icon = <WifiOff size={14} />;
    text = 'Offline. Trying to reconnect...';
  }

  return (
    <div className={`connection-banner ${connectionState}`}>
      {icon}
      <span>{text}</span>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
