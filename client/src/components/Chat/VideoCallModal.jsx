// components/Chat/VideoCallModal.js
import React, { useEffect, useState } from 'react';
import './VideoCallModal.css';

const VideoCallModal = ({
  myVideoRef,
  userVideoRef,
  receivingCall,
  caller,
  name,
  callAccepted,
  callEnded,
  callStarted,
  callDuration,
  selectedUser,
  currentUser,
  connectionState,
  mediaError,
  isVideoEnabled,
  isAudioEnabled,
  isScreenSharing,
  answerCall,
  rejectCall,
  leaveCall,
  toggleVideo,
  toggleAudio,
  startScreenShare,
  stopScreenShare,
  onClose
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimer, setControlsTimer] = useState(null);

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    if (callAccepted && !receivingCall) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimer(timer);

      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [callAccepted, receivingCall, showControls]);

  const handleMouseMove = () => {
    if (callAccepted && !showControls) {
      setShowControls(true);
    }
    if (controlsTimer) {
      clearTimeout(controlsTimer);
    }
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    setControlsTimer(timer);
  };

  const handleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await stopScreenShare();
      } else {
        await startScreenShare();
      }
    } catch (error) {
      console.error('Screen share error:', error);
      alert('Failed to start screen sharing. Please try again.');
    }
  };

  const getCallStatusText = () => {
    if (mediaError) return `Error: ${mediaError}`;
    if (receivingCall && !callAccepted) return 'Incoming call...';
    if (!callAccepted && !receivingCall) return 'Calling...';
    if (connectionState === 'connecting') return 'Connecting...';
    if (connectionState === 'connected' && callStarted) return `Connected • ${callDuration}`;
    if (connectionState === 'disconnected') return 'Reconnecting...';
    if (connectionState === 'failed') return 'Connection failed';
    return 'Connecting...';
  };

  const getConnectionQuality = () => {
    switch (connectionState) {
      case 'connected': return 'good';
      case 'connecting': return 'poor';
      case 'disconnected':
      case 'failed': return 'poor';
      default: return 'fair';
    }
  };

  if (isMinimized) {
    return (
      <div className="video-call-minimized">
        <div className="minimized-content">
          <div className="minimized-user-info">
            <div className="minimized-avatar">
              {selectedUser?.profilePic ? (
                <img src={selectedUser.profilePic} alt={selectedUser.username} />
              ) : (
                <div className="avatar-placeholder">
                  {selectedUser?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="minimized-details">
              <span className="minimized-name">{selectedUser?.username}</span>
              <span className="minimized-status">{getCallStatusText()}</span>
            </div>
          </div>
          <div className="minimized-controls">
            <button 
              className={`control-btn audio ${!isAudioEnabled ? 'disabled' : ''}`}
              onClick={toggleAudio}
              title={isAudioEnabled ? 'Mute' : 'Unmute'}
            >
              {isAudioEnabled ? '🎤' : '🔇'}
            </button>
            <button 
              className="control-btn maximize"
              onClick={() => setIsMinimized(false)}
              title="Maximize"
            >
              ⬆️
            </button>
            <button 
              className="control-btn end-call"
              onClick={leaveCall}
              title="End Call"
            >
              📞
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`video-call-modal ${callAccepted ? 'call-active' : ''}`}
      onMouseMove={handleMouseMove}
    >
      <div className="video-call-container">
        {/* Header */}
        <div className={`call-header ${showControls ? 'visible' : 'hidden'}`}>
          <div className="call-info">
            <div className="user-info">
              <div className="user-avatar">
                {selectedUser?.profilePic ? (
                  <img src={selectedUser.profilePic} alt={selectedUser.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {selectedUser?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-details">
                <h3>{selectedUser?.username || name}</h3>
                <div className="call-status">
                  <span className={`connection-indicator ${getConnectionQuality()}`}></span>
                  <span className="status-text">{getCallStatusText()}</span>
                </div>
              </div>
            </div>
            <div className="header-actions">
              <button 
                className="header-btn"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13H5v-2h14v2z"/>
                </svg>
              </button>
              <button 
                className="header-btn close"
                onClick={onClose}
                title="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div className="videos-container">
          {/* Remote Video */}
          <div className="remote-video-container">
            <video
              ref={userVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />
            {!callAccepted && (
              <div className="video-placeholder">
                <div className="placeholder-avatar">
                  {selectedUser?.profilePic ? (
                    <img src={selectedUser.profilePic} alt={selectedUser.username} />
                  ) : (
                    <div className="avatar-placeholder large">
                      {selectedUser?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3>{selectedUser?.username || name}</h3>
                <p>{getCallStatusText()}</p>
              </div>
            )}
          </div>

          {/* Local Video */}
          <div className={`local-video-container ${!isVideoEnabled ? 'video-disabled' : ''}`}>
            <video
              ref={myVideoRef}
              autoPlay
              muted
              playsInline
              className="local-video"
            />
            {!isVideoEnabled && (
              <div className="video-disabled-overlay">
                <div className="disabled-avatar">
                  {currentUser?.profilePic ? (
                    <img src={currentUser.profilePic} alt={currentUser.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {currentUser?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className={`call-controls ${showControls ? 'visible' : 'hidden'}`}>
          {receivingCall && !callAccepted ? (
            // Incoming call controls
            <div className="incoming-call-controls">
              <button 
                className="control-btn answer"
                onClick={answerCall}
                title="Answer Call"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
              </button>
              <button 
                className="control-btn reject"
                onClick={rejectCall}
                title="Reject Call"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.7l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9V9.72C15.15 9.25 13.6 9 12 9z"/>
                </svg>
              </button>
            </div>
          ) : (
            // Active call controls
            <div className="active-call-controls">
              <button 
                className={`control-btn audio ${!isAudioEnabled ? 'disabled' : ''}`}
                onClick={toggleAudio}
                title={isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  {isAudioEnabled ? (
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                  ) : (
                    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                  )}
                </svg>
              </button>

              <button 
                className={`control-btn video ${!isVideoEnabled ? 'disabled' : ''}`}
                onClick={toggleVideo}
                title={isVideoEnabled ? 'Turn Off Video' : 'Turn On Video'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  {isVideoEnabled ? (
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  ) : (
                    <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
                  )}
                </svg>
              </button>

              {callAccepted && (
                <button 
                  className={`control-btn screen-share ${isScreenSharing ? 'active' : ''}`}
                  onClick={handleScreenShare}
                  title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
                  </svg>
                </button>
              )}

              <button 
                className="control-btn end-call"
                onClick={leaveCall}
                title="End Call"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.7l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9V9.72C15.15 9.25 13.6 9 12 9z"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {mediaError && (
          <div className="error-message">
            <div className="error-content">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
              <p>{mediaError}</p>
              <button onClick={() => window.location.reload()}>
                Refresh Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallModal;