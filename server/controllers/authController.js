const User = require('../models/User');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    // console.log(req.body);
    
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists with this username'
      });
    }
    
    // Create new user
    const newUser = await User.create({
      username,
      password
    });
    // console.log(newUser);
    
    // Remove password from output
    newUser.password = undefined;

    // Create token
    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists and password is correct
    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect username or password'
      });
    }
    // console.log(user);
    
    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Remove password from output
    user.password = undefined;

    // Create token
    const token = signToken(user._id);
// console.log(token);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.logout = async (req, res) => {
  try {
    // Update user's online status
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: false,
      lastSeen: new Date()
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};