//server/routes/messages.js
const express = require('express');
const { 
  getMessages, 
  getOlderMessages, 
  markAsRead, 
  uploadFile 
} = require('../controllers/messageController');
const auth = require('../middleware/auth');
const upload = require("../config/multer.js");

const router = express.Router();

// Get messages with pagination (latest messages)
router.get('/:userId', auth, getMessages);

// Get older messages for infinite scroll
router.get('/:userId/older', auth, getOlderMessages);

// Mark message as read
router.patch('/:messageId/read', auth, markAsRead);

// Upload file
// router.post('/upload', auth, upload.single('file'), uploadFile);

module.exports = router;