// backend/controllers/userController.js
const User = require('../models/User');

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
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
};

exports.searchUsers = async (req, res) => {
  try {
    const { username } = req.query;
    const users = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: req.user._id }
    }).select('username profilePic isOnline lastSeen');

    res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('username profilePic isOnline lastSeen');
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

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
};

exports.getContacts = async (req, res) => {

  try {
    const user = await User.findById(req.user._id).populate('contacts', 'username profilePic isOnline lastSeen');
    res.status(200).json({
      status: 'success',
      data: user.contacts
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.addContact = async (req, res) => {
    // console.log(req.body);
  try {
    const { userId } = req.body;
    const contact = await User.findById(userId);
    if (!contact) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
// console.log(contact);

    const user = await User.findById(req.user._id);
    if (user.contacts.includes(userId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Contact already added'
      });
    }

    user.contacts.push(userId);
    await user.save();

    // Also add the current user to the contact's contacts list
    if (!contact.contacts.includes(req.user._id)) {
      contact.contacts.push(req.user._id);
      await contact.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Contact added successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ status: 'fail', message: 'Token required' });

    const user = await User.findById(req.user._id);
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    res.status(200).json({ status: 'success', message: 'FCM token saved' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
