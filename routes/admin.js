const express = require('express');
const User = require('../models/User');
const Ride = require('../models/Ride');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

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

module.exports = router;