const express = require('express');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Feedback = require('../models/Feedback');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

if (User && User.schema && !User.schema.path('isBlocked')) {
  User.schema.add({ isBlocked: { type: Boolean, default: false } });
}

// Get admin stats (online drivers count)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    // Count drivers who have turned their dashboard status to "online"
    const onlineDriversCount = await User.countDocuments({ userType: 'driver', isOnline: true });
    res.status(200).json({ success: true, onlineDriversCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch stats' });
  }
});

// Get all users
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch users' });
  }
});

// Get all rides
router.get('/rides', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    const rides = await Ride.find()
      .populate('passengerId', 'firstName lastName phone')
      .populate('driverId', 'firstName lastName phone vehicleNumber')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, rides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch rides' });
  }
});

// Delete a user
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' });
    }
    
    res.status(200).json({ success: true, message: 'ব্যবহারকারী মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'মুছে ফেলতে সমস্যা হয়েছে' });
  }
});

// Block/Unblock a user
router.put('/users/:id/block', authMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || adminUser.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    const { isBlocked } = req.body;
    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isBlocked must be a boolean.' });
    }

    const userToUpdate = await User.findByIdAndUpdate(req.params.id, { isBlocked }, { new: true });

    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully.`, user: userToUpdate });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update user block status' });
  }
});

// Get all feedback
router.get('/feedback', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    const feedbacks = await Feedback.find()
      .populate('userId', 'firstName lastName phone userType')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch feedback' });
  }
});

// POST submit feedback (any logged-in user can submit)
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });
    
    const feedback = await Feedback.create({ userId: req.userId, message });
    res.status(201).json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to submit feedback' });
  }
});

module.exports = router;