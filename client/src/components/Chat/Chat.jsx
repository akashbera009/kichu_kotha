

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { userAPI } from '../../services/api';
import Sidebar from './Sidebar';
import Loading from '../Common/Loading';
import ChatArea from './ChatArea';
import ContactsModal from './ContactsModal';
import './Chat.css';

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const socket = useSocket();

  // NEW: sidebar state and mobile detection
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // default to closed on mobile, open on desktop
      setSidebarOpen(!mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Fetch user's contacts from API
    const fetchContacts = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await userAPI.getContacts();
        setContacts(response.data.data || []);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setError('Failed to load contacts. Please try again.');
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchContacts();
    }
  }, [currentUser]);

  // socket listeners (unchanged)...
  useEffect(() => {
    if (!socket) return;

    const handleUserOnline = (userId) => {
      setContacts(prev =>
        prev.map(contact =>
          contact._id === userId
            ? { ...contact, isOnline: true, lastSeen: new Date() }
            : contact
        )
      );
    };

    const handleUserOffline = (userId) => {
      setContacts(prev =>
        prev.map(contact =>
          contact._id === userId
            ? { ...contact, isOnline: false, lastSeen: new Date() }
            : contact
        )
      );
    };

    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);

    return () => {
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
    };
  }, [socket]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    // optionally close sidebar on mobile when selecting a user
    if (isMobile) setSidebarOpen(false);
  };

  // ... other functions unchanged

  if (loading && contacts.length === 0) {
    return (
      <Loading/>
    );
  }

  return (
    <div className="chat-container">
      {/* Mobile toggle button */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(prev => !prev)}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {/* simple icon: hamburger / close */}
        <span className="hamburger">{sidebarOpen ? '✕' : '☰'}</span>
      </button>

      {/* overlay (mobile only) */}
      <div
        className={`sidebar-overlay ${sidebarOpen && isMobile ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        contacts={contacts}
        onSelectUser={handleSelectUser}
        onAddContact={() => setShowContactsModal(true)}
        onRefreshContacts={async () => {
          try {
            setLoading(true);
            const response = await userAPI.getContacts();
            setContacts(response.data.data || []);
            setError('');
          } catch (err) {
            setError('Failed to refresh contacts.');
          } finally {
            setLoading(false);
          }
        }}
        selectedUser={selectedUser}
        loading={loading}
        error={error}
        isOpen={sidebarOpen}         // NEW prop
        onClose={() => setSidebarOpen(false)} // NEW prop
      />

      {selectedUser ? (
        <ChatArea
          selectedUser={selectedUser}
          socket={socket}
        />
      ) : (
        <div className="no-chat-selected">
          <div className="no-chat-content">
            <p className='welcome message '>welcome to</p>
            <h2>কিছু কথা</h2>
            <p>Select a contact to start chatting</p>

                {contacts.length != 0 && !loading && (
                  <button className='contact-select'
                    onClick={() => setSidebarOpen(prev => !prev)}
                    aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                  >Select Contact</button>
                )}
            
            {contacts.length === 0 && !loading && (
              <div className="no-contacts-message">
                <p>No contacts yet.</p>
                <button
                  className="add-first-contact-btn"
                  onClick={() => setShowContactsModal(true)}
                >
                  Add Your First Contact
                </button>
              </div>
            )}
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button
                  className="retry-btn"
                  onClick={() => {/* optional retry */}}
                >
                  Retry
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}

      {showContactsModal && (
        <ContactsModal
          onClose={() => setShowContactsModal(false)}
          onAddContact={(user) => {
            setContacts(prev => [...prev, user]);
            setShowContactsModal(false);
          }}
          currentContacts={contacts}
        />
      )}
    </div>
  );
};

export default Chat;
