// // server/utils/socketHandler.js
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const Message = require('../models/Message');
// const sendNotification = require('./fcm');

// const socketHandler = (io) => {
//   io.use(async (socket, next) => {
//     try {
//       const token = socket.handshake.auth.token;
//       if (!token) {
//         return next(new Error('Authentication error'));
//       }

//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await User.findById(decoded.id);
//       if (!user) {
//         return next(new Error('Authentication error'));
//       }

//       socket.userId = user._id;
//       next();
//     } catch (error) {
//       next(new Error('Authentication error'));
//     }
//   });

//   io.on('connection', async (socket) => {
//     // console.log('User connected:', socket.userId);

//     // Update user's online status
//     await User.findByIdAndUpdate(socket.userId, {
//       isOnline: true,
//       lastSeen: new Date()
//     });

//     // Join user to their own room
//     socket.join(socket.userId.toString());

//     // Handle sending messages
//     socket.on('sendMessage', async (data) => {
//       try {
//         const { receiverId, message, messageType } = data;

//         // Save message to database
//         const newMessage = await Message.create({
//           sender: socket.userId,
//           receiver: receiverId,
//           message,
//           messageType,
//           status: 'sent'
//         });

//         // Populate message with sender/receiver details
//         const populatedMessage = await Message.findById(newMessage._id)
//           .populate('sender', 'username profilePic')
//           .populate('receiver', 'username profilePic');

//         // Emit to receiver
//         socket.to(receiverId).emit('receiveMessage', populatedMessage);

//         // Emit back to sender
//         socket.emit('messageSent', populatedMessage);

//         // --- NEW: Send FCM notification ---
//         const receiver = await User.findById(receiverId);
//         if (receiver && receiver.fcmTokens.length > 0) {
//           sendNotification(receiver.fcmTokens, populatedMessage);
//         }

//       } catch (error) {
//         socket.emit('messageError', { error: error.message });
//       }
//     });
//     // Handle message status updates
//     socket.on('messageRead', async (messageId) => {
//       try {
//         const message = await Message.findByIdAndUpdate(
//           messageId,
//           { status: 'read' },
//           { new: true }
//         ).populate('sender', 'username profilePic');

//         if (message) {
//           socket.to(message.sender._id.toString()).emit('messageRead', messageId);
//         }
//       } catch (error) {
//         console.error('Error updating message status:', error);
//       }
//     });

//     // Handle typing indicators
//     socket.on('typingStart', (receiverId) => {
//       socket.to(receiverId).emit('typingStart', socket.userId);
//     });

//     socket.on('typingStop', (receiverId) => {
//       socket.to(receiverId).emit('typingStop', socket.userId);
//     });

//     // Handle disconnection
//     socket.on('disconnect', async () => {
//       console.log('User disconnected:', socket.userId);

//       // Update user's online status
//       await User.findByIdAndUpdate(socket.userId, {
//         isOnline: false,
//         lastSeen: new Date()
//       });
//     });
//   });
// };

// module.exports = { socketHandler };


// server/utils/socketHandler.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const sendNotification = require('./fcm');

// Store online users and active calls
const onlineUsers = new Map();
const activeCalls = new Map(); // Track active calls for better management

const socketHandler = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user._id;
      socket.username = user.username;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log('User connected:', socket.username, socket.userId);

    try {
      // Update user's online status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastSeen: new Date(),
        socketId: socket.id // Store current socket ID
      });

      // Register user for video calls
      onlineUsers.set(socket.userId.toString(), {
        socketId: socket.id,
        userId: socket.userId,
        name: socket.username,
        isInCall: false,
        connectedAt: new Date()
      });

      // Emit updated users list to all clients
      emitOnlineUsers(io);

      // Join user to their own room
      socket.join(socket.userId.toString());

      // Handle user registration for calls
      socket.on('register-for-calls', (userData) => {
        const existingUser = onlineUsers.get(socket.userId.toString());
        if (existingUser) {
          onlineUsers.set(socket.userId.toString(), {
            ...existingUser,
            ...userData,
            socketId: socket.id
          });
          emitOnlineUsers(io);
        }
      });

      // Handle sending messages
      socket.on('sendMessage', async (data) => {
        try {
          const { receiverId, message, messageType } = data;

          // Validate input
          if (!receiverId || !message) {
            socket.emit('messageError', { error: 'Missing required fields' });
            return;
          }

          // Save message to database
          const newMessage = await Message.create({
            sender: socket.userId,
            receiver: receiverId,
            message,
            messageType: messageType || 'text',
            status: 'sent'
          });

          // Populate message with sender/receiver details
          const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'username profilePic')
            .populate('receiver', 'username profilePic');

          // Emit to receiver
          socket.to(receiverId).emit('receiveMessage', populatedMessage);

          // Emit back to sender
          socket.emit('messageSent', populatedMessage);

          // Send FCM notification
          const receiver = await User.findById(receiverId);
          if (receiver && receiver.fcmTokens && receiver.fcmTokens.length > 0) {
            sendNotification(receiver.fcmTokens, populatedMessage);
          }

        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('messageError', { error: error.message });
        }
      });

      // Handle message status updates
      socket.on('messageRead', async (messageId) => {
        try {
          const message = await Message.findByIdAndUpdate(
            messageId,
            { status: 'read' },
            { new: true }
          ).populate('sender', 'username profilePic');

          if (message) {
            socket.to(message.sender._id.toString()).emit('messageRead', messageId);
          }
        } catch (error) {
          console.error('Error updating message status:', error);
        }
      });

      // Handle typing indicators
      socket.on('typingStart', (receiverId) => {
        if (receiverId) {
          socket.to(receiverId).emit('typingStart', socket.userId);
        }
      });

      socket.on('typingStop', (receiverId) => {
        if (receiverId) {
          socket.to(receiverId).emit('typingStop', socket.userId);
        }
      });

      // Enhanced Video Call Handlers
      socket.on('webrtc-offer', (data) => {
        try {
          const { to, offer, from } = data;
          
          if (!to || !offer) {
            socket.emit('call-error', { error: 'Invalid offer data' });
            return;
          }

          const targetUser = onlineUsers.get(to);
          
          if (!targetUser) {
            socket.emit('call-error', { error: 'User not available' });
            return;
          }

          if (targetUser.isInCall) {
            socket.emit('call-error', { error: 'User is busy' });
            return;
          }

          // Create call record
          const callId = `${socket.userId}-${to}-${Date.now()}`;
          activeCalls.set(callId, {
            caller: socket.userId.toString(),
            callee: to,
            callerSocketId: socket.id,
            calleeSocketId: targetUser.socketId,
            status: 'ringing',
            startTime: new Date(),
            callId
          });

          // Mark users as in call
          const callerUser = onlineUsers.get(socket.userId.toString());
          if (callerUser) {
            callerUser.isInCall = true;
            callerUser.callId = callId;
          }
          targetUser.isInCall = true;
          targetUser.callId = callId;

          // Send offer to target user
          io.to(targetUser.socketId).emit('webrtc-offer', {
            offer: offer,
            from: socket.userId,
            name: socket.username,
            callId: callId
          });

          console.log(`Call initiated: ${socket.username} calling ${targetUser.name}`);

        } catch (error) {
          console.error('Error handling webrtc-offer:', error);
          socket.emit('call-error', { error: 'Failed to initiate call' });
        }
      });

      socket.on('webrtc-answer', (data) => {
        try {
          const { to, answer, callId } = data;
          
          if (!to || !answer) {
            socket.emit('call-error', { error: 'Invalid answer data' });
            return;
          }

          const targetUser = onlineUsers.get(to);
          if (!targetUser) {
            socket.emit('call-error', { error: 'User not available' });
            return;
          }

          // Update call status
          const call = activeCalls.get(callId);
          if (call) {
            call.status = 'connected';
            call.connectedTime = new Date();
          }

          // Send answer to caller
          io.to(targetUser.socketId).emit('webrtc-answer', {
            answer: answer,
            from: socket.userId,
            callId: callId
          });

          console.log(`Call answered: ${socket.username} answered call from ${targetUser.name}`);

        } catch (error) {
          console.error('Error handling webrtc-answer:', error);
          socket.emit('call-error', { error: 'Failed to answer call' });
        }
      });

      socket.on('webrtc-ice-candidate', (data) => {
        try {
          const { to, candidate } = data;
          
          if (!to || !candidate) {
            return; // ICE candidates can be optional
          }

          const targetUser = onlineUsers.get(to);
          if (targetUser) {
            io.to(targetUser.socketId).emit('webrtc-ice-candidate', {
              candidate: candidate,
              from: socket.userId
            });
          }

        } catch (error) {
          console.error('Error handling ICE candidate:', error);
        }
      });

      socket.on('reject-call', (data) => {
        try {
          const { to, callId } = data;
          const targetUser = onlineUsers.get(to);
          
          if (targetUser) {
            io.to(targetUser.socketId).emit('call-rejected', {
              from: socket.userId,
              callId: callId
            });
          }

          // Clean up call
          cleanupCall(callId || `${socket.userId}-${to}`, 'rejected');
          console.log(`Call rejected: ${socket.username} rejected call`);

        } catch (error) {
          console.error('Error handling call rejection:', error);
        }
      });

      socket.on('end-call', (data) => {
        try {
          const { to, callId } = data;
          const targetUser = onlineUsers.get(to);
          
          if (targetUser) {
            io.to(targetUser.socketId).emit('call-ended', {
              from: socket.userId,
              callId: callId
            });
          }

          // Clean up call
          cleanupCall(callId || `${socket.userId}-${to}`, 'ended');
          console.log(`Call ended: ${socket.username} ended call`);

        } catch (error) {
          console.error('Error handling call end:', error);
        }
      });

      // Handle call timeout (if no answer within 30 seconds)
      socket.on('call-timeout', (data) => {
        const { to, callId } = data;
        const targetUser = onlineUsers.get(to);
        
        if (targetUser) {
          io.to(targetUser.socketId).emit('call-timeout');
        }
        
        cleanupCall(callId, 'timeout');
      });

      // Handle connection quality reporting
      socket.on('connection-quality', (data) => {
        const { to, quality, stats } = data;
        const targetUser = onlineUsers.get(to);
        
        if (targetUser) {
          io.to(targetUser.socketId).emit('peer-connection-quality', {
            from: socket.userId,
            quality: quality,
            stats: stats
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        console.log('User disconnected:', socket.username, 'Reason:', reason);

        try {
          // Clean up any active calls
          const userInfo = onlineUsers.get(socket.userId.toString());
          if (userInfo && userInfo.callId) {
            cleanupCall(userInfo.callId, 'disconnected');
            
            // Notify other party about disconnection
            for (const [callId, call] of activeCalls) {
              if (call.caller === socket.userId.toString()) {
                const calleeUser = onlineUsers.get(call.callee);
                if (calleeUser) {
                  io.to(calleeUser.socketId).emit('call-ended', {
                    reason: 'disconnected',
                    from: socket.userId
                  });
                }
              } else if (call.callee === socket.userId.toString()) {
                const callerUser = onlineUsers.get(call.caller);
                if (callerUser) {
                  io.to(callerUser.socketId).emit('call-ended', {
                    reason: 'disconnected',
                    from: socket.userId
                  });
                }
              }
            }
          }

          // Remove user from online users
          onlineUsers.delete(socket.userId.toString());
          
          // Emit updated users list to all clients
          emitOnlineUsers(io);

          // Update user's online status in database
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date(),
            socketId: null
          });

        } catch (error) {
          console.error('Error handling disconnect cleanup:', error);
        }
      });

    } catch (error) {
      console.error('Error in socket connection handler:', error);
    }
  });

  // Helper function to emit online users list
  function emitOnlineUsers(io) {
    const usersList = Array.from(onlineUsers.values()).map(user => ({
      userId: user.userId,
      name: user.name,
      socketId: user.socketId,
      isInCall: user.isInCall || false
    }));
    
    io.emit('users-list', usersList);
  }

  // Helper function to clean up calls
  function cleanupCall(callId, reason = 'unknown') {
    const call = activeCalls.get(callId);
    if (call) {
      // Mark users as not in call
      const callerUser = onlineUsers.get(call.caller);
      const calleeUser = onlineUsers.get(call.callee);
      
      if (callerUser) {
        callerUser.isInCall = false;
        delete callerUser.callId;
      }
      
      if (calleeUser) {
        calleeUser.isInCall = false;
        delete calleeUser.callId;
      }

      // Log call end
      const duration = call.connectedTime ? 
        new Date() - new Date(call.connectedTime) : 
        new Date() - new Date(call.startTime);
      
      console.log(`Call cleanup - ID: ${callId}, Duration: ${Math.round(duration/1000)}s, Reason: ${reason}`);
      
      // Remove call from active calls
      activeCalls.delete(callId);
      
      // Update users list
      emitOnlineUsers(io);
    }
  }

  // Auto cleanup stale calls (calls that have been ringing for too long)
  setInterval(() => {
    const now = new Date();
    for (const [callId, call] of activeCalls) {
      if (call.status === 'ringing') {
        const ringDuration = now - new Date(call.startTime);
        if (ringDuration > 45000) { // 45 seconds timeout
          console.log(`Auto-cleaning stale call: ${callId}`);
          cleanupCall(callId, 'timeout');
        }
      }
    }
  }, 30000); // Check every 30 seconds
};

module.exports = { 
  socketHandler, 
  onlineUsers,
  getActiveCalls: () => activeCalls,
  getOnlineUsersCount: () => onlineUsers.size,
  getActiveCallsCount: () => activeCalls.size
};