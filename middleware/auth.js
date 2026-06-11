// d:\Toto_Booking\MVP3\backend\routes\auth.js (Example - you need to edit your actual file)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    // ... existing signup logic ...
    const newUser = new User({
      phone,
      firstName,
      lastName,
      password: hashedPassword,
      userType,
      vehicleNumber: userType === 'driver' ? vehicleNumber : undefined,
      isOnline: true // Set online on signup
    });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, message: 'User registered successfully', user: newUser, token });
  } catch (error) {
    // ... error handling ...
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    // ... existing login logic ...
    const user = await User.findOne({ phone });
    // ... password comparison ...

    // Set user online on successful login
    user.isOnline = true;
    await user.save(); // Or findByIdAndUpdate if you prefer

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ success: true, message: 'Logged in successfully', user, token });
  } catch (error) {
    // ... error handling ...
  }
});

// Logout Route (Add this if you don't have one, or modify existing)
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { isOnline: false });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to logout' });
  }
});

// New Endpoint to Update Online Status (for heartbeats and driver toggle)
router.put('/online-status', authMiddleware, async (req, res) => {
  try {
    const { isOnline } = req.body;
    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isOnline status is required and must be a boolean' });
    }
    await User.findByIdAndUpdate(req.userId, { isOnline });
    res.status(200).json({ success: true, message: 'Online status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update online status' });
  }
});

module.exports = router;
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

module.exports = authMiddleware;
