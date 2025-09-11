import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Message.css';

const Message = ({ message }) => {
  const { currentUser } = useAuth();
  const isOwn = message.sender._id === currentUser._id;
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- AUDIO PLAYER STATE/REF ---
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 - 100
  const [current, setCurrent] = useState(0); // seconds
  const [duration, setDuration] = useState(0); // seconds
  const [muted, setMuted] = useState(false);

  const audioSrc = message?.message?.audio || '';

  // Attach audio events whenever the source changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => {
      setCurrent(a.currentTime);
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    };
    const onEnded = () => setIsPlaying(false);

    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnded);

    // cleanup
    return () => {
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnded);
      // pause and reset when audioSrc changes/unmount
      a.pause();
      setIsPlaying(false);
      setProgress(0);
      setCurrent(0);
      setDuration(0);
    };
  }, [audioSrc]);

  // sync muted state
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = muted;
  }, [muted]);

  // play / pause
  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      try {
        await a.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Playback failed:', err);
      }
    }
  };

  // Seek (mouse + touch)
  const onSeek = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const a = audioRef.current;
    if (!a || !a.duration) return;
    a.currentTime = pct * a.duration;
    setProgress(pct * 100);
  };

  const toggleMute = () => setMuted((m) => !m);

  const formatTimeShort = (sec) => {
    if (!sec || Number.isNaN(sec)) return '0:00';
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    const m = Math.floor(sec / 60);
    return `${m}:${s}`;
  };

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  // prevent background scroll when modal open
  useEffect(() => {
    if (isModalOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  // close modal with Esc
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setIsModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <div className={`message ${isOwn ? 'own-message' : 'other-message'}`}>
        <div className="message-content">
          {message.messageType === 'text' && <p>{message.message.text}</p>}

          {message.messageType === 'image' && (
            <img
              src={message.message.image}
              alt="message"
              className="message-image"
              onClick={() => setIsModalOpen(true)}
            />
          )}

          {message.messageType === 'audio' && (
            <div className={`custom-audio-wrapper ${isOwn ? 'own' : 'other'}`}>
              {/* Hidden native audio element we control */}
              <audio ref={audioRef} src={audioSrc} preload="metadata" />

              {/* Play / Pause */}
              <button
                type="button"
                className="custom-audio-play"
                onClick={togglePlay}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                    <rect x="6" y="5" width="4" height="14" />
                    <rect x="14" y="5" width="4" height="14" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                    <path d="M5 3v18l15-9z" />
                  </svg>
                )}
              </button>

              {/* Progress bar */}
              <div
                className="custom-audio-progress-wrap"
                onClick={onSeek}
                onTouchStart={onSeek}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                tabIndex={0}
                onKeyDown={(e) => {
                  // allow left/right arrow to seek small steps
                  const a = audioRef.current;
                  if (!a || !a.duration) return;
                  if (e.key === 'ArrowRight') { a.currentTime = Math.min(a.duration, a.currentTime + 5); }
                  if (e.key === 'ArrowLeft') { a.currentTime = Math.max(0, a.currentTime - 5); }
                }}
              >
                <div className="custom-audio-progress">
                  <div
                    className="custom-audio-progress-bar"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* time */}
              <div className="custom-audio-time" aria-live="polite">
                {formatTimeShort(current)} / {formatTimeShort(duration)}
              </div>

              {/* mute */}
              <button
                className="custom-audio-vol"
                onClick={toggleMute}
                aria-pressed={muted}
                aria-label={muted ? 'Unmute' : 'Mute'}
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                    <path d="M5 9v6h4l5 5V4L9 9H5z" />
                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                    <path d="M5 9v6h4l5 5V4L9 9H5z" />
                  </svg>
                )}
              </button>
            </div>
          )}

          <span className="message-time">{formatTime(message.createdAt)}</span>
        </div>
      </div>

      {/* IMAGE MODAL (unchanged) */}
      {isModalOpen && (
        <div
          className="image-modal"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="image-modal-inner" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-toolbar">
              <button
                className="image-modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>
            <img
              src={message.message.image}
              alt="full"
              className="image-modal-original"
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Message;
