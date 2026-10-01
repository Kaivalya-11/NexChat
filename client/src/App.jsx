import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
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
import './index.css';

function ChatLayout() {
  const { user } = useAuth();
  const [isMemberDrawerOpen, setIsMemberDrawerOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [theme, setTheme] = React.useState(localStorage.getItem('chat_theme') || 'dark');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('chat_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  if (!user) {
    return <AuthModal />;
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
        />
      </div>

      {isSidebarOpen && (
        <div 
          className="mobile-only" 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
        />
      )}

      <main className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <ChatHeader 
           onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
           onToggleMembers={() => setIsMemberDrawerOpen(!isMemberDrawerOpen)} 
           onOpenSearch={() => setIsSearchModalOpen(true)}
        />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
               <MessageList />
               <MessageInput />
           </div>
           {isMemberDrawerOpen && <MemberDrawer onClose={() => setIsMemberDrawerOpen(false)} />}
        </div>
      </main>

      <ThreadDrawer />
      
      {isProfileModalOpen && <ProfileModal onClose={() => setIsProfileModalOpen(false)} />}
      {isSearchModalOpen && <SearchModal onClose={() => setIsSearchModalOpen(false)} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          <ChatLayout />
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;