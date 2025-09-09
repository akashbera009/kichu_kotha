const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const sendNotification = require('./fcm');

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
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    // console.log('User connected:', socket.userId);

    // Update user's online status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date()
    });

    // Join user to their own room
    socket.join(socket.userId.toString());

    // Handle sending messages
    socket.on('sendMessage', async (data) => {
      try {
        const { receiverId, message, messageType } = data;

        // Save message to database
        const newMessage = await Message.create({
          sender: socket.userId,
          receiver: receiverId,
          message,
          messageType,
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

        // --- NEW: Send FCM notification ---
        const receiver = await User.findById(receiverId);
        if (receiver && receiver.fcmTokens.length > 0) {
          sendNotification(receiver.fcmTokens, populatedMessage);
        }

      } catch (error) {
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
      socket.to(receiverId).emit('typingStart', socket.userId);
    });

    socket.on('typingStop', (receiverId) => {
      socket.to(receiverId).emit('typingStop', socket.userId);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.userId);

      // Update user's online status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date()
      });
    });
  });
};

module.exports = { socketHandler };