const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    text: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    audio: {
      type: String,
      default: ''
    }
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'audio'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);