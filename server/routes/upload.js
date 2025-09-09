// backend/routes/upload.js
const express = require('express');
const { upload } = require('../config/cloudinary');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/messages/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'No file uploaded'
      });
    }

    res.status(200).json({
      status: 'success',
      url: req.file.path,
      publicId: req.file.public_id
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

router.post('/users/profile-pic', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'No file uploaded'
      });
    }

    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: req.file.path },
      { new: true }
    ).select('-password');

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;