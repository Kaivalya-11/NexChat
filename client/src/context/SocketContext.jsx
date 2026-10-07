import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected'); // 'connecting', 'connected', 'disconnected'
  const [onlineUsers, setOnlineUsers] = useState(new Map());

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(null);
      }
      return;
    }

    setConnectionState('connecting');
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    const newSocket = io(socketUrl, {
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setConnectionState('connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setConnectionState('disconnected');
    });

    newSocket.on('connect_error', (err) => {
      if (err.message.includes('Authentication error')) {
        logout(); // Token expired or invalid
      }
      setConnectionState('disconnected');
    });

    newSocket.on('presence-update', (data) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userId, {
          status: data.status,
          lastSeen: data.lastSeen,
          statusText: data.user?.statusText || ''
        });
        return newMap;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, logout]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionState, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
