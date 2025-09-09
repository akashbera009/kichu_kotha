// frontend/src/components/Chat/Message.js
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Message.css';
import { useEffect } from 'react';

const Message = ({ message }) => {
  const { currentUser } = useAuth();
  const isOwn = message.sender._id === currentUser._id;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  

  return (
    <div className={`message ${isOwn ? 'own-message' : 'other-message'}`}>
      <div className="message-content">
        {message.messageType === 'text' && (
          <p>{message.message.text}</p>
        )}
        {message.messageType === 'image' && (
          <img 
            src={message.message.image} 
            alt="message" 
            className="message-image"
          />
        )}
        {message.messageType === 'audio' && (
          <audio controls className="message-audio">
            <source src={message.message.audio} type="audio/webm" />
            Your browser does not support the audio element.
          </audio>
        )}
        <span className="message-time">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default Message;