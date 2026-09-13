const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const {
  SERVICE_TYPE_OPTIONS,
  SERVICE_TYPE_TO_LEGACY_RIDE_TYPE,
  normalizeServiceTypes
} = require('../config/serviceTypes');

const router = express.Router();

// A small in-memory safeguard for this deliberately OTP-free reset flow.
// It limits attempts per client without storing any credentials or passwords.
const passwordResetAttempts = new Map();
const PASSWORD_RESET_WINDOW_MS = 15 * 60 * 1000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;

function isPasswordResetRateLimited(req) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const attempt = passwordResetAttempts.get(key);

  if (!attempt || now - attempt.startedAt >= PASSWORD_RESET_WINDOW_MS) {
    passwordResetAttempts.set(key, { startedAt: now, count: 1 });
    return false;
  }

  attempt.count += 1;
  return attempt.count > PASSWORD_RESET_MAX_ATTEMPTS;
}

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { phone, firstName, lastName, password, userType = 'passenger', vehicleNumber, rideType, serviceTypes } = req.body;

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
      const selectedServiceTypes = Array.isArray(serviceTypes) ? serviceTypes : (rideType ? [rideType] : []);
      if (!selectedServiceTypes.length) {
        return res.status(400).json({ success: false, message: 'কমপক্ষে একটি গাড়ি/পরিষেবা নির্বাচন করুন।' });
      }
      const allowedTypes = new Set(SERVICE_TYPE_OPTIONS.map(option => option.value));
      if (selectedServiceTypes.some(type => typeof type !== 'string' || !allowedTypes.has(type)) || new Set(selectedServiceTypes).size !== selectedServiceTypes.length) {
        return res.status(400).json({ success: false, message: 'অবৈধ গাড়ি/পরিষেবা নির্বাচন করা হয়েছে।' });
      }
      userPayload.vehicleNumber = vehicleNumber;
      userPayload.serviceTypes = selectedServiceTypes;
      userPayload.rideType = SERVICE_TYPE_TO_LEGACY_RIDE_TYPE[selectedServiceTypes[0]] || selectedServiceTypes[0];
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
      user: { ...user.toJSON(), serviceTypes: normalizeServiceTypes(user) }
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

// FORGOT PASSWORD
// Uses the same shared User collection, phone field, and pre-save bcrypt hook as login/signup.
router.post('/forgot-password', async (req, res) => {
  try {
    if (isPasswordResetRateLimited(req)) {
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।'
      });
    }

    const { phone, newPassword } = req.body;
    if (!phone || !newPassword || !/^\d{10}$/.test(phone) || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_REQUEST',
        message: 'তথ্য সঠিক নয়।'
      });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'PHONE_NOT_FOUND',
        message: 'এই মোবাইল নম্বরটি রেজিস্টার করা নেই।'
      });
    }

    // Assigning then saving intentionally invokes User's existing bcryptjs pre-save hook.
    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(500).json({
      success: false,
      code: 'RESET_FAILED',
      message: 'পাসওয়ার্ড আপডেট করা যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।'
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
      user: { ...user.toJSON(), serviceTypes: normalizeServiceTypes(user) }
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
    const { firstName, lastName, email, profilePhoto, upiId, rideType, serviceTypes } = req.body;

    const updateData = { firstName, lastName, email, profilePhoto, upiId };

    if (serviceTypes !== undefined) {
      if (req.userType !== 'driver') {
        return res.status(403).json({ success: false, message: 'Only drivers can update service types' });
      }
      if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) {
        return res.status(400).json({ success: false, message: 'কমপক্ষে একটি গাড়ি/পরিষেবা নির্বাচন করুন।' });
      }
      const allowedTypes = new Set(SERVICE_TYPE_OPTIONS.map(option => option.value));
      if (serviceTypes.some(type => typeof type !== 'string' || !allowedTypes.has(type)) ||
        new Set(serviceTypes).size !== serviceTypes.length) {
        return res.status(400).json({ success: false, message: 'অবৈধ গাড়ি/পরিষেবা নির্বাচন করা হয়েছে।' });
      }
      updateData.serviceTypes = serviceTypes;
      updateData.rideType = SERVICE_TYPE_TO_LEGACY_RIDE_TYPE[serviceTypes[0]];
    } else if (req.userType === 'driver' && rideType) {
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
      user: { ...user.toJSON(), serviceTypes: normalizeServiceTypes(user) }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
});

module.exports = router;
