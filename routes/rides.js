const express = require('express');
const Ride = require('../models/Ride');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const {
  findStoppage,
  formatLocationAddress,
  calculateDistanceKm
} = require('../data/locations');

const router = express.Router();

const FARE_PER_KM = 10; // per km rate
const BASE_FARE = 10; // minimum fare

function buildLocationFromStoppage(stoppageId, landmark) {
  const found = findStoppage(stoppageId);
  if (!found) return null;

  const { village, stoppage } = found;
  const location = {
    address: formatLocationAddress(village.nameBn, stoppage.nameBn, landmark),
    villageId: village.id,
    villageName: village.nameBn,
    stoppageId: stoppage.id,
    stoppageName: stoppage.nameBn,
    latitude: stoppage.latitude,
    longitude: stoppage.longitude
  };

  if (landmark && landmark.trim()) {
    location.landmark = landmark.trim();
  }

  return location;
}

// REQUEST RIDE (Passenger)
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { pickupStoppageId, dropoffStoppageId, landmark } = req.body;

    if (!pickupStoppageId || !dropoffStoppageId) {
      return res.status(400).json({
        success: false,
        message: 'শুরুর স্থান ও গন্তব্য স্টপেজ নির্বাচন করুন'
      });
    }

    if (pickupStoppageId === dropoffStoppageId) {
      return res.status(400).json({
        success: false,
        message: 'শুরুর স্থান এবং গন্তব্য একই হতে পারে না'
      });
    }

    const pickupLocation = buildLocationFromStoppage(pickupStoppageId, landmark);
    const dropoffLocation = buildLocationFromStoppage(dropoffStoppageId);

    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        success: false,
        message: 'অবৈধ স্থান নির্বাচন করা হয়েছে'
      });
    }

    const distance = calculateDistanceKm(pickupStoppageId, dropoffStoppageId);
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
    )
    .populate('passengerId', 'firstName lastName phone profilePhoto')
    .populate('driverId', 'firstName lastName phone profilePhoto vehicleNumber');

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
      .populate('driverId', 'firstName lastName phone profilePhoto vehicleNumber');

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
      .populate('driverId', 'firstName lastName phone profilePhoto vehicleNumber')
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

// REJECT RIDE (Driver)
router.post('/reject/:rideId', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { 
        driverId: null,
        rideStatus: 'pending'  // Back to pending for other drivers
      },
      { new: true }
    )
    .populate('passengerId', 'firstName lastName phone profilePhoto')
    .populate('driverId', 'firstName lastName phone profilePhoto vehicleNumber');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride rejected successfully',
      ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject ride'
    });
  }
});

// RATE RIDE (Customer)
router.post('/rate/:rideId', authMiddleware, async (req, res) => {
  try {
    const { rating } = req.body;
    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { rating },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    // Update driver's overall rating
    if (ride.driverId) {
      const allDriverRides = await Ride.find({ driverId: ride.driverId, rating: { $ne: null } });
      const totalReviews = allDriverRides.length;
      const sumRating = allDriverRides.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalReviews > 0 ? (sumRating / totalReviews).toFixed(1) : 0;
      
      await User.findByIdAndUpdate(ride.driverId, { averageRating, totalReviews });
    }

    res.status(200).json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit rating' });
  }
});

module.exports = router;
