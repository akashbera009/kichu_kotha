// frontend/src/components/Chat/ContactsModal.js
import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import './ContactsModal.css';

const ContactsModal = ({ onClose, onAddContact, currentContacts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      setError('');
      
      try {
        const response = await userAPI.searchUsers(searchTerm);
        const users = response.data.data;
        
        // Filter out users that are already contacts
        const currentContactIds = currentContacts.map(contact => contact._id);
        const filteredUsers = users.filter(user => !currentContactIds.includes(user._id));
        
        setSearchResults(filteredUsers);
      } catch (error) {
        setError('Failed to search users. Please try again.');
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, currentContacts]);

  const handleAddContact = async (user) => {
    try {
      await userAPI.addContact(user._id);
      onAddContact(user);
    } catch (error) {
      setError('Failed to add contact. Please try again.');
      console.error('Add contact error:', error);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="contacts-modal">
        <div className="modal-header">
          <h2>Add Contact</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="search-section">
            <div className="search-input-container">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="search-icon">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search users by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            {error && (
              <div className="error-message">{error}</div>
            )}
          </div>

          <div className="search-results">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Searching...</p>
              </div>
            ) : searchTerm.length < 2 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="empty-icon">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                <p>Search for users to add as contacts</p>
                <span>Type at least 2 characters to start searching</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="empty-icon">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <p>No users found</p>
                <span>Try searching with a different username</span>
              </div>
            ) : (
              <div className="users-list">
                {searchResults.map(user => (
                  <div key={user._id} className="user-item">
                    <div className="user-avatar">
                      {user.profilePic ? (
                        <img src={user.profilePic} alt={user.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className={`online-indicator ${user.isOnline ? 'online' : 'offline'}`}></div>
                    </div>
                    
                    <div className="user-info">
                      <h4>{user.username}</h4>
                      <p className="user-status">
                        {user.isOnline ? 'Online' : `Last seen ${new Date(user.lastSeen).toLocaleDateString()}`}
                      </p>
                    </div>
                    
                    <button
                      className="add-btn"
                      onClick={() => handleAddContact(user)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <line x1="20" y1="8" x2="20" y2="14"/>
                        <line x1="23" y1="11" x2="17" y2="11"/>
                      </svg>
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactsModal;