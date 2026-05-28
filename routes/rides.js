const express = require('express');
const Ride = require('../models/Ride');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const FARE_PER_KM = 10; // per km rate
const BASE_FARE = 20; // minimum fare

// REQUEST RIDE (Passenger)
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, distance } = req.body;

    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        success: false,
        message: 'Pickup and dropoff locations are required'
      });
    }

    // Calculate fare
    const fare = Math.max(BASE_FARE, distance * FARE_PER_KM);

    const ride = new Ride({
      passengerId: req.userId,
      pickupLocation,
      dropoffLocation,
      distance,
      fare,
      rideStatus: 'pending'
    });

    await ride.save();

    res.status(201).json({
      success: true,
      message: 'Ride requested successfully',
      ride
    });
  } catch (error) {
    console.error('Request ride error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to request ride'
    });
  }
});

// GET PENDING RIDES (For Drivers)
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    const rides = await Ride.find({ rideStatus: 'pending' })
      .populate('passengerId', 'firstName lastName phone profilePhoto')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      rides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending rides'
    });
  }
});

// ACCEPT RIDE (Driver)
router.post('/accept/:rideId', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { 
        driverId: req.userId, 
        rideStatus: 'accepted',
        startTime: new Date()
      },
      { new: true }
    ).populate('passengerId', 'firstName lastName phone');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride accepted successfully',
      ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept ride'
    });
  }
});

// START RIDE (Driver)
router.post('/start/:rideId', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { rideStatus: 'in_progress' },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride started',
      ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start ride'
    });
  }
});

// END RIDE (Driver)
router.post('/end/:rideId', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { 
        rideStatus: 'completed',
        endTime: new Date(),
        paymentStatus: 'paid'
      },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride completed',
      ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to end ride'
    });
  }
});

// GET RIDE DETAILS
router.get('/:rideId', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('passengerId', 'firstName lastName phone profilePhoto')
      .populate('driverId', 'firstName lastName phone profilePhoto');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    res.status(200).json({
      success: true,
      ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch ride details'
    });
  }
});

// GET USER RIDES (Passenger or Driver)
router.get('/user/rides', authMiddleware, async (req, res) => {
  try {
    const rides = await Ride.find({
      $or: [
        { passengerId: req.userId },
        { driverId: req.userId }
      ]
    })
      .populate('passengerId', 'firstName lastName phone profilePhoto')
      .populate('driverId', 'firstName lastName phone profilePhoto')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      rides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch rides'
    });
  }
});

// CANCEL RIDE
router.post('/cancel/:rideId', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { rideStatus: 'cancelled' },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel ride'
    });
  }
});

module.exports = router;
