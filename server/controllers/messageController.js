// backend/controller/messagecontroller.js
const Message = require('../models/Message');
 
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, before } = req.query; // Increased default limit
    
    const limitNum = parseInt(limit);

    // Build query
    let query = {
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    };

    // If 'before' timestamp is provided, get messages before that timestamp
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Fetch messages with pagination
    const messages = await Message.find(query)
      .populate('sender', 'username profilePic')
      .populate('receiver', 'username profilePic')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean();

    // Get the count for hasMore calculation
    let hasMore = false;
    if (messages.length > 0) {
      const olderMessagesCount = await Message.countDocuments({
        $or: [
          { sender: req.user._id, receiver: userId },
          { sender: userId, receiver: req.user._id }
        ],
        createdAt: { $lt: messages[messages.length - 1].createdAt }
      });
      hasMore = olderMessagesCount > 0;
    }

    // Reverse to show oldest first (for UI)
    messages.reverse();

    res.status(200).json({
      status: 'success',
      data: messages,
      hasMore
    });
  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// backend/controller/messageController.js
exports.getOlderMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { before, limit = 10 } = req.query;
    
    if (!before) {
      return res.status(400).json({
        status: 'fail',
        message: 'Before timestamp is required'
      });
    }

    const limitNum = parseInt(limit);
    const baseQuery = {
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    };

    const messages = await Message.find({
      ...baseQuery,
      createdAt: { $lt: new Date(before) }
    })
    .populate('sender', 'username profilePic')
    .populate('receiver', 'username profilePic')
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .lean();

    // Check if there are more messages
    let hasMore = false;
    if (messages.length > 0) {
      const count = await Message.countDocuments({
        ...baseQuery,
        createdAt: { $lt: messages[messages.length - 1].createdAt }
      });
      hasMore = count > 0;
    }

    res.status(200).json({
      status: 'success',
      data: messages,
      hasMore
    });
  } catch (error) {
    console.error('Error in getOlderMessages:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};


exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findByIdAndUpdate(
      messageId,
      { status: 'read' },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        status: 'fail',
        message: 'Message not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({
        status: "fail",
        message: "No file uploaded",
      });
    }

    res.status(200).json({
      status: "success",
      url: req.file.path,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};