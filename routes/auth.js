const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { phone, firstName, lastName, password, userType = 'passenger', vehicleNumber, rideType } = req.body;

    // Validate input
    if (!phone || !firstName || !lastName || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate phone - must be 10 digits
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    // Create new user
    const userPayload = {
      phone,
      firstName,
      lastName,
      password,
      userType
    };

    if (userType === 'driver') {
      userPayload.vehicleNumber = vehicleNumber;
      userPayload.rideType = rideType; // Save rideType for drivers
    }

    const user = new User(userPayload);
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Signup successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Signup failed'
    });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone and password are required'
      });
    }

    // Validate phone - must be 10 digits
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }

    // Find user
    // Use lean() to get a plain JS object to guarantee 'isBlocked' is present
    const userObject = await User.findOne({ phone }).lean();
    if (!userObject) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password'
      });
    }

    // Check if user is blocked on the raw object
    if (userObject.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.'
      });
    }

    // Hydrate the plain object into a full Mongoose document
    // so we can use instance methods like `comparePassword()`
    const user = User.hydrate(userObject);

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

// GET USER PROFILE
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'ACCOUNT_BLOCKED' // Special message for frontend to handle logout
      });
    }

    res.status(200).json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile'
    });
  }
});

// UPDATE ONLINE STATUS
router.put('/online-status', authMiddleware, async (req, res) => {
  try {
    const { isOnline, routeId } = req.body;
    // Update the isOnline flag and activeRouteId in the database
    const updateData = { isOnline: !!isOnline };
    if (routeId !== undefined) {
      updateData.activeRouteId = routeId;
    }
    const user = await User.findByIdAndUpdate(req.userId, { $set: updateData }, { new: true });
    if (user && user.isBlocked) {
      return res.status(403).json({ success: false, message: 'ACCOUNT_BLOCKED' });
    }
    res.status(200).json({ success: true, message: 'Online status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update online status' });
  }
});

// UPDATE USER PROFILE
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email, profilePhoto, upiId, rideType } = req.body;

    const updateData = { firstName, lastName, email, profilePhoto, upiId };

    // Only allow rideType update for drivers and if it's provided
    if (req.userType === 'driver' && rideType) {
      updateData.rideType = rideType;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
});

module.exports = router;
