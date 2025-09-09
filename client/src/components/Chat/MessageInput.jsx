// frontend/src/components/Chat/MessageInput.js
import React, { useState, useRef, useEffect } from 'react';
import { messageAPI } from '../../services/api';
import './MessageInput.css';

const MessageInput = ({ onSendMessage, onTypingStart, onTypingStop }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Handle typing indicators
    onTypingStart();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop();
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendMessage({
      message: { text: message.trim() },
      messageType: 'text'
    });

    setMessage('');
    onTypingStop();
  };

 const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  console.log('Selected file:', file); // Add this
  
  setUploading(true);
  try {
    const formData = new FormData();
    formData.append('file', file);

    console.log('Uploading file...'); // Add this
    const response = await messageAPI.uploadFile(formData);
    console.log('Upload response:', response); // Add this
    
    const fileUrl = response.data.url;

    const messageType = file.type.startsWith('image/') ? 'image' : 'audio';
    const messageData = {
      message: messageType === 'image' ? { image: fileUrl } : { audio: fileUrl },
      messageType
    };

    console.log('Sending message:', messageData); // Add this
    onSendMessage(messageData);
  } catch (error) {
    console.error('Error uploading file:', error);
    alert('Failed to upload file. Please try again.');
  } finally {
    setUploading(false);
    fileInputRef.current.value = '';
  }
};
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'voice-message.webm');

        setUploading(true);
        try {
          const response = await messageAPI.uploadFile(formData);
          const audioUrl = response.data.url;

          onSendMessage({
            message: { audio: audioUrl },
            messageType: 'audio'
          });
        } catch (error) {
          console.error('Error uploading voice message:', error);
          alert('Failed to send voice message. Please try again.');
        } finally {
          setUploading(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="message-input-container">
      {isRecording && (
        <div className="recording-indicator">
          <div className="recording-dot"></div>
          <span>Recording... {formatRecordingTime(recordingTime)}</span>
          <button type="button" className="stop-recording-btn" onClick={stopRecording}>
            Stop
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-actions">
          <button
            type="button"
            className="action-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Upload Image"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </button>

          <button
            type="button"
            className={`action-button ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={uploading}
            title={isRecording ? 'Stop Recording' : 'Voice Message'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
        </div>

        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="message-input"
          disabled={isRecording || uploading}
        />

        <button
          type="submit"
          className="send-button"
          disabled={!message.trim() || isRecording || uploading}
        >
          {uploading ? (
            <div className="sending-spinner"></div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9 22,2"/>
            </svg>
          )}
        </button>
      </form>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default MessageInput;