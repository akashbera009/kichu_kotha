// frontend/src/components/Chat/Sidebar.js
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const Sidebar = ({ contacts, onSelectUser, onAddContact, selectedUser, isOpen = true, onClose }) => {
  const { currentUser, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContacts = contacts.filter((contact) =>
    contact.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  const formatLastSeen = (lastSeen) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return lastSeenDate.toLocaleDateString();
  };

  return (
 <div className={`sidebar ${isOpen ? "active" : ""}`}>
      {/* <div className="search-bar">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div> */}

      <div className="contacts-section">
        <div className="section-header">
          <h4>Contacts</h4>
          {/* <button className="add-contact-btn" onClick={onAddContact} title="Add Contact">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button> */}
        </div>

        <div className="contacts-list">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <div
                key={contact._id}
                className={`contact-item ${
                  selectedUser?._id === contact._id ? "selected" : ""
                }`}
                onClick={() => onSelectUser(contact)}
              >
                <div className="contact-avatar">
                  {contact.profilePic ? (
                    <img src={contact.profilePic} alt={contact.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {contact.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div
                    className={`online-indicator ${
                      contact.isOnline ? "online" : "offline"
                    }`}
                  ></div>
                </div>
                <div className="contact-info">
                  <h5>{contact.username}</h5>
                  <p className="last-seen">
                    {contact.isOnline
                      ? "Online"
                      : formatLastSeen(contact.lastSeen)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="no-contacts">
              <p>No contacts found</p>
            </div>
          )}
        </div>
      </div>
      <button
        className="add-contact-btn-2"
        onClick={onAddContact}
        title="Add Contact"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <div className="sidebar-header">
        <div className="user-info">
          <div className="user-avatar">
            {currentUser?.profilePic ? (
              <img src={currentUser.profilePic} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">
                {currentUser?.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="user-details">
            <h3>{currentUser?.username} (Me)</h3>
            {/* <span className="online-status">Online</span> */}
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
                  {/* <button className="sidebar-close" onClick={onClose} title="Close sidebar">
            ✕
          </button> */}
      </div>
    </div>
  );
};

export default Sidebar;
