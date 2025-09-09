import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { messageAPI } from "../../services/api";
import Message from "./Message";
import MessageInput from "./MessageInput";
import "./ChatArea.css";

const ChatArea = ({ selectedUser, socket }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [typing, setTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { currentUser } = useAuth();

  // Track if we should scroll to bottom
  const shouldScrollToBottomRef = useRef(true);
  const isInitialLoadRef = useRef(true);

  // Fetch messages for the selected user
  const fetchMessages = async (userId, limit = 20, before = null) => {
    try {
      setLoading(true);
      const response = await messageAPI.getMessages(userId, limit, before);
      setMessages(response.data.data);
      setHasMoreMessages(response.data.hasMore);
      isInitialLoadRef.current = false;
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch older messages when load more button is clicked
  const fetchOlderMessages = async () => {
    if (!selectedUser || !hasMoreMessages || loadingOlder || messages.length === 0) {
      return;
    }

    try {
      setLoadingOlder(true);
      const oldestMessage = messages[0];
      const beforeTimestamp = oldestMessage.createdAt;
      
      const response = await messageAPI.getOlderMessages(
        selectedUser._id,
        beforeTimestamp,
        20
      );
      
      const olderMessages = response.data.data;

      if (olderMessages.length > 0) {
        // Store current scroll position
        const container = messagesContainerRef.current;
        const scrollHeight = container.scrollHeight;
        const scrollTop = container.scrollTop;

        // Prepend older messages
        setMessages((prev) => [...olderMessages, ...prev]);

        // Restore scroll position to prevent jump
        setTimeout(() => {
          const newScrollHeight = container.scrollHeight;
          const heightDifference = newScrollHeight - scrollHeight;
          container.scrollTop = scrollTop + heightDifference;
        }, 0);

        setHasMoreMessages(response.data.hasMore);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error fetching older messages:", error);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Effect for selected user change
  useEffect(() => {
    if (selectedUser) {
      setMessages([]);
      setHasMoreMessages(true);
      shouldScrollToBottomRef.current = true;
      isInitialLoadRef.current = true;
      fetchMessages(selectedUser._id);
    }
  }, [selectedUser]);

  // Socket effects
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    const handleReceiveMessage = (message) => {
      if (
        message.sender._id === selectedUser._id ||
        message.receiver._id === selectedUser._id
      ) {
        setMessages((prev) => [...prev, message]);
        shouldScrollToBottomRef.current = true;
      }
    };

    // Listen for message sent confirmation
    const handleMessageSent = (message) => {
      setMessages((prev) => [...prev, message]);
      shouldScrollToBottomRef.current = true;
    };

    // Listen for typing indicators
    const handleTypingStart = (userId) => {
      if (userId === selectedUser._id) {
        setTyping(true);
      }
    };

    const handleTypingStop = (userId) => {
      if (userId === selectedUser._id) {
        setTyping(false);
      }
    };

    // Listen for message read status
    const handleMessageRead = (messageId) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, status: "read" } : msg
        )
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageSent", handleMessageSent);
    socket.on("typingStart", handleTypingStart);
    socket.on("typingStop", handleTypingStop);
    socket.on("messageRead", handleMessageRead);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageSent", handleMessageSent);
      socket.off("typingStart", handleTypingStart);
      socket.off("typingStop", handleTypingStop);
      socket.off("messageRead", handleMessageRead);
    };
  }, [socket, selectedUser]);

  const handleSendMessage = (messageData) => {
    if (!socket) {
      console.log("No socket connection!");
      return;
    }

    socket.emit("sendMessage", {
      receiverId: selectedUser._id,
      ...messageData,
    });

    shouldScrollToBottomRef.current = true;
  };

  const handleTypingStart = () => {
    if (!socket) return;
    socket.emit("typingStart", selectedUser._id);
  };

  const handleTypingStop = () => {
    if (!socket) return;
    socket.emit("typingStop", selectedUser._id);
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

  if (!selectedUser) {
    return (
      <div className="chat-area-placeholder">
        <div className="placeholder-content">
          <h3>Welcome to kichu কথা</h3>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="chat-user-avatar">
            {selectedUser.profilePic ? (
              <img src={selectedUser.profilePic} alt={selectedUser.username} />
            ) : (
              <div className="avatar-placeholder">
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              className={`online-indicator ${
                selectedUser.isOnline ? "online" : "offline"
              }`}
            ></div>
          </div>
          <div className="chat-user-details">
            <h3>{selectedUser.username}</h3>
            <p className="status">
              {selectedUser.isOnline
                ? "Online"
                : `Last seen ${formatLastSeen(selectedUser.lastSeen)}`}
            </p>
          </div>
        </div>
        <div className="chat-actions">
          <button className="action-btn" title="Voice Call">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <button className="action-btn" title="Video Call">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="messages-container"
        ref={messagesContainerRef}
      >
        {loading ? (
          <div className="messages-loading">
            <div className="loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : (
          <>
            {/* Load more button */}
            {hasMoreMessages && (
              <div className="load-more-container">
                <button 
                  className="load-more-btn"
                  onClick={fetchOlderMessages}
                  disabled={loadingOlder}
                >
                  {loadingOlder ? (
                    <div className="loading-spinner-small"></div>
                  ) : (
                    <svg className="load-more-svg"  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-caret-up"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11.293 7.293a1 1 0 0 1 1.32 -.083l.094 .083l6 6l.083 .094l.054 .077l.054 .096l.017 .036l.027 .067l.032 .108l.01 .053l.01 .06l.004 .057l.002 .059l-.002 .059l-.005 .058l-.009 .06l-.01 .052l-.032 .108l-.027 .067l-.07 .132l-.065 .09l-.073 .081l-.094 .083l-.077 .054l-.096 .054l-.036 .017l-.067 .027l-.108 .032l-.053 .01l-.06 .01l-.057 .004l-.059 .002h-12c-.852 0 -1.297 -.986 -.783 -1.623l.076 -.084l6 -6z" /></svg>

                  )}
                </button>
              </div>
            )}

            {/* End of messages indicator */}
            {!hasMoreMessages && messages.length > 0 && (
              <div className="end-of-messages">
                <p>Beginning of conversation</p>
              </div>
            )}

            <div className="messages-list">
              {messages.map((message) => (
                <Message key={message._id} message={message} />
              ))}

              {typing && (
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p>{selectedUser.username} is typing...</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
      />
    </div>
  );
};

export default ChatArea;