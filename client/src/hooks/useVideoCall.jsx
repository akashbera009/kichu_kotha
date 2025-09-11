// hooks/useVideoCall.js
import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const useVideoCall = (existingSocket = null, serverUrl = 'http://localhost:5000') => {
  const [socket, setSocket] = useState(existingSocket);
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [name, setName] = useState("");
  const [users, setUsers] = useState([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState('new');
  const [callDuration, setCallDuration] = useState(0);
  const [mediaError, setMediaError] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const myVideoRef = useRef(null);
  const userVideoRef = useRef(null);
  const connectionRef = useRef(null);
  const callTimerRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  // Enhanced WebRTC configuration
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
  };

  // Socket connection management
  useEffect(() => {
    if (existingSocket) {
      setSocket(existingSocket);
      return;
    }
    
    const newSocket = io(serverUrl, { 
      transports: ['websocket'],
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected for video calls');
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      if (!existingSocket && newSocket) {
        newSocket.disconnect();
      }
    };
  }, [existingSocket, serverUrl]);

  // Call timer
  useEffect(() => {
    if (callAccepted && !callEnded) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      if (callEnded) {
        setCallDuration(0);
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callAccepted, callEnded]);

  // Format call duration
  const formatDuration = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get user media with enhanced options
  const getUserMedia = useCallback(async (constraints = { video: true, audio: true }) => {
    if (stream && !isScreenSharing) return stream;

    try {
      setMediaError(null);
      
      // Enhanced video constraints for better quality
      const enhancedConstraints = {
        video: constraints.video ? {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 15, ideal: 30, max: 60 },
          facingMode: 'user'
        } : false,
        audio: constraints.audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } : false
      };

      const localStream = await navigator.mediaDevices.getUserMedia(enhancedConstraints);
      
      setStream(localStream);
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = localStream;
      }
      
      return localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setMediaError(error.message);
      
      // Fallback to basic constraints
      if (constraints.video && constraints.audio) {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          setStream(fallbackStream);
          return fallbackStream;
        } catch (fallbackError) {
          console.error('Fallback media access failed:', fallbackError);
          throw fallbackError;
        }
      }
      throw error;
    }
  }, [stream, isScreenSharing]);

  // Screen sharing functionality
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          logicalSurface: true,
          cursor: true
        },
        audio: true
      });

      // Replace video track in peer connection
      if (connectionRef.current && stream) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = connectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Handle screen share ending
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

      // Update local video display
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);
      return screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }, [stream]);

  const stopScreenShare = useCallback(async () => {
    try {
      // Get camera stream back
      const cameraStream = await getUserMedia();
      
      // Replace screen share track with camera track
      if (connectionRef.current) {
        const videoTrack = cameraStream.getVideoTracks()[0];
        const sender = connectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }

      // Update local video display
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = cameraStream;
      }

      setIsScreenSharing(false);
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }, [getUserMedia]);

  // Stop user media
  const stopUserMedia = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = null;
      }
    }
    setIsScreenSharing(false);
  }, [stream]);

  // Create peer connection with enhanced configuration
  const createPeerConnection = useCallback((localStream) => {
    const peerConnection = new RTCPeerConnection(configuration);

    // Add local stream to connection
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Enhanced ICE candidate handling
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-ice-candidate', {
          to: caller || socket.id,
          candidate: event.candidate
        });
      }
    };

    // Connection state monitoring
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      setConnectionState(state);
      console.log('Connection state:', state);

      if (state === 'connected') {
        setCallStarted(true);
        reconnectAttempts.current = 0;
      } else if (state === 'disconnected' || state === 'failed') {
        handleConnectionFailure();
      }
    };

    // ICE connection state monitoring
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
    };

    // Data channel for future features (chat during call, etc.)
    const dataChannel = peerConnection.createDataChannel('chat', {
      ordered: true
    });

    dataChannel.onopen = () => {
      console.log('Data channel opened');
    };

    return peerConnection;
  }, [socket, caller]);

  // Handle connection failure and attempt reconnection
  const handleConnectionFailure = useCallback(async () => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      console.log(`Attempting reconnection ${reconnectAttempts.current}/${maxReconnectAttempts}`);
      
      // Wait before reconnecting
      setTimeout(() => {
        if (caller && socket) {
          // Attempt to re-establish connection
          callUser(caller);
        }
      }, 2000 * reconnectAttempts.current);
    } else {
      console.log('Max reconnection attempts reached');
      leaveCall();
    }
  }, [caller, socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleCallUser = (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name || '');
      setCallerSignal(data.signal);
    };

    const handleCallAccepted = (data) => {
      setCallAccepted(true);
      if (data.answer && connectionRef.current) {
        connectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    };

    const handleCallRejected = () => {
      setCallEnded(true);
      setReceivingCall(false);
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
      stopUserMedia();
    };

    const handleCallEnded = () => {
      setCallEnded(true);
      setCallAccepted(false);
      setCallStarted(false);
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
      stopUserMedia();
    };

    const handleWebRTCOffer = async (data) => {
      try {
        setReceivingCall(true);
        setCaller(data.from);
        setCallerSignal(data.offer);
        
        // Get user media when receiving a call
        await getUserMedia();
      } catch (error) {
        console.error('Failed to get user media for incoming call:', error);
        setMediaError('Failed to access camera/microphone');
      }
    };

    const handleWebRTCAnswer = (data) => {
      if (data.answer && connectionRef.current) {
        connectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        ).catch(error => {
          console.error('Error setting remote description:', error);
        });
      }
    };

    const handleWebRTCIceCandidate = async (data) => {
      if (!data.candidate || !connectionRef.current) return;
      
      try {
        await connectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    };

    const handleUsersList = (usersList) => {
      setUsers(usersList || []);
    };

    // Register event listeners
    socket.on('call-user', handleCallUser);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('webrtc-ice-candidate', handleWebRTCIceCandidate);
    socket.on('users-list', handleUsersList);

    return () => {
      socket.off('call-user', handleCallUser);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('webrtc-offer', handleWebRTCOffer);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('webrtc-ice-candidate', handleWebRTCIceCandidate);
      socket.off('users-list', handleUsersList);
    };
  }, [socket, getUserMedia, stopUserMedia]);

  // Call user function
  const callUser = useCallback(async (id) => {
    if (!socket) return;

    try {
      const localStream = await getUserMedia();
      const peerConnection = createPeerConnection(localStream);
      connectionRef.current = peerConnection;

      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnection.setLocalDescription(offer);

      socket.emit('webrtc-offer', {
        to: id,
        offer: offer,
        from: socket.id
      });

      setCaller(id);
    } catch (error) {
      console.error('Error creating call:', error);
      setMediaError('Failed to initiate call. Check camera/microphone permissions.');
    }
  }, [socket, getUserMedia, createPeerConnection]);

  // Answer call function
  const answerCall = useCallback(async () => {
    if (!socket || !callerSignal || !caller) return;

    try {
      setCallAccepted(true);
      setReceivingCall(false);

      const localStream = await getUserMedia();
      const peerConnection = createPeerConnection(localStream);
      connectionRef.current = peerConnection;

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(callerSignal)
      );
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit('webrtc-answer', {
        to: caller,
        answer: answer
      });
    } catch (error) {
      console.error('Error answering call:', error);
      setMediaError('Failed to answer call. Check camera/microphone permissions.');
    }
  }, [socket, caller, callerSignal, getUserMedia, createPeerConnection]);

  // Reject call function
  const rejectCall = useCallback(() => {
    setReceivingCall(false);
    setCallEnded(true);
    if (socket && caller) {
      socket.emit('reject-call', { to: caller });
    }
    stopUserMedia();
  }, [socket, caller, stopUserMedia]);

  // Leave call function
  const leaveCall = useCallback(() => {
    setCallEnded(true);
    setCallAccepted(false);
    setCallStarted(false);
    
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    
    if (socket && caller) {
      socket.emit('end-call', { to: caller });
    }
    
    stopUserMedia();
    
    // Reset states
    setReceivingCall(false);
    setCaller("");
    setName("");
    setConnectionState('new');
    reconnectAttempts.current = 0;
  }, [socket, caller, stopUserMedia]);

  // Register for calls
  const registerForCalls = useCallback((userData) => {
    if (socket) {
      socket.emit('register-for-calls', userData);
    }
  }, [socket]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [stream]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      stopUserMedia();
      if (connectionRef.current) {
        connectionRef.current.close();
      }
    };
  }, [stopUserMedia]);

  return {
    // Video refs
    myVideoRef,
    userVideoRef,
    
    // Stream and connection state
    stream,
    connectionState,
    mediaError,
    
    // Call states
    receivingCall,
    caller,
    name,
    callAccepted,
    callEnded,
    callStarted,
    callDuration: formatDuration(callDuration),
    
    // Users and controls
    users,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    
    // Functions
    callUser,
    answerCall,
    rejectCall,
    leaveCall,
    registerForCalls,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    getUserMedia,
    stopUserMedia,
    
    // Socket
    socket
  };
};

export default useVideoCall;