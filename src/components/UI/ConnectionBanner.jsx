import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { RiWifiLine, RiWifiOffLine, RiRefreshLine } from 'react-icons/ri';

export default function ConnectionBanner() {
  const { connectionState } = useSocket();

  if (connectionState === 'connected') {
    return null; // hide when connected (or use CSS fade out)
  }

  let icon = <RiWifiLine size={16} />;
  let text = 'Connected';
  
  if (connectionState === 'connecting') {
    icon = <RiRefreshLine size={16} className="spin" />;
    text = 'Connecting to server...';
  } else if (connectionState === 'disconnected') {
    icon = <RiWifiOffLine size={16} />;
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
