"use client";
import React from 'react';
import { RiMenuLine, RiMessage3Fill } from 'react-icons/ri';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import VideoCallModal from './components/Chat/VideoCallModal';
import AuthModal from './components/Auth/AuthModal';
import Sidebar from './components/Sidebar/Sidebar';
import ChatHeader from './components/Chat/ChatHeader';
import MessageList from './components/Chat/MessageList';
import MessageInput from './components/Chat/MessageInput';
import ConnectionBanner from './components/UI/ConnectionBanner';
import ThreadDrawer from './components/Chat/ThreadDrawer';
import MemberDrawer from './components/Chat/MemberDrawer';
import SearchModal from './components/UI/SearchModal';
import ProfileModal from './components/Auth/ProfileModal';
import NotificationDrawer from './components/UI/NotificationDrawer';
import MediaPreviewModal from './components/UI/MediaPreviewModal';
import FriendsView from './components/Friends/FriendsView';

function ChatLayout() {
  const { user } = useAuth();
  const [isMemberDrawerOpen, setIsMemberDrawerOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = React.useState(false);
  const [theme, setTheme] = React.useState(localStorage.getItem('chat_theme') || 'dark');
  
  const { activeChannelId } = useChat();

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('chat_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <AuthModal key="auth-modal" />
      </AnimatePresence>
    );
  }

  return (
    <div className="app-container">
      <ConnectionBanner />
      
      <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar 
          onOpenProfile={() => setIsProfileModalOpen(true)} 
          onOpenSearch={() => setIsSearchModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSelectChannel={() => setIsSidebarOpen(false)}
        />
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            key="mobile-backdrop"
            className="mobile-only" 
            onClick={() => setIsSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }}
          />
        )}
      </AnimatePresence>

      <main className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {activeChannelId === 'friends' ? (
          <FriendsView />
        ) : activeChannelId ? (
          <>
            <ChatHeader 
               onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
               onToggleMembers={() => setIsMemberDrawerOpen(!isMemberDrawerOpen)} 
               onOpenSearch={() => setIsSearchModalOpen(true)}
               onToggleNotifications={() => setIsNotificationDrawerOpen(!isNotificationDrawerOpen)}
            />
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
                   <MessageList />
                   <MessageInput />
               </div>
               
               <AnimatePresence>
                 {isMemberDrawerOpen && <MemberDrawer key="member-drawer" onClose={() => setIsMemberDrawerOpen(false)} />}
               </AnimatePresence>
               
               <AnimatePresence>
                 {isNotificationDrawerOpen && <NotificationDrawer key="notif-drawer" onClose={() => setIsNotificationDrawerOpen(false)} />}
               </AnimatePresence>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-darkest)' }}>
             <button className="btn-icon mobile-only" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ position: 'absolute', top: '16px', left: '16px', padding: '8px', backgroundColor: 'var(--bg-card)' }}>
               <RiMenuLine size={24} color="var(--text-main)" />
             </button>
             <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '32px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <RiMessage3Fill size={64} color="var(--border-highlight)" style={{ marginBottom: '24px' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>No conversations yet</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                   Create a channel or join a conversation to get started.
                </p>
             </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        <ThreadDrawer key="thread-drawer" />
      </AnimatePresence>
      
      <AnimatePresence>
        {isProfileModalOpen && <ProfileModal key="profile-modal" onClose={() => setIsProfileModalOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isSearchModalOpen && <SearchModal key="search-modal" onClose={() => setIsSearchModalOpen(false)} />}
      </AnimatePresence>

      <MediaPreviewModal />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          <CallProvider>
            <ChatLayout />
            <VideoCallModal />
          </CallProvider>
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;