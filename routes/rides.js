const express = require('express');
const Ride = require('../models/Ride');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const {
  findStoppage,
  formatLocationAddress,
  calculateDistanceKm,
  buildLocationFromVillage,
  calculateDistanceKmByVillage
} = require('../data/locations');

if (Ride && Ride.schema && !Ride.schema.path('otp')) {
  Ride.schema.add({ otp: { type: String } });
}

if (Ride && Ride.schema && !Ride.schema.path('arriveTime')) {
  Ride.schema.add({ arriveTime: { type: Date } });
}

const router = express.Router();

const FARE_PER_KM = 10; // per km rate
const BASE_FARE = 10; // minimum fare

async function buildLocationFromStoppage(stoppageId, landmark) {
  const found = await findStoppage(stoppageId);
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
    const { pickupVillageId, dropoffVillageId, pickupStoppageId, dropoffStoppageId, landmark, fare: requestedFare, pickupLat, pickupLng } = req.body;

    const pVid = pickupVillageId || pickupStoppageId;
    const dVid = dropoffVillageId || dropoffStoppageId;

    if (!pVid || !dVid) {
      return res.status(400).json({
        success: false,
        message: 'শুরুর স্থান ও গন্তব্য নির্বাচন করুন'
      });
    }

    const pickupLocation = pickupVillageId 
      ? await buildLocationFromVillage(pickupVillageId, landmark) 
      : await buildLocationFromStoppage(pickupStoppageId, landmark);

    if (pickupLat && pickupLng) {
      pickupLocation.latitude = Number(pickupLat);
      pickupLocation.longitude = Number(pickupLng);
    }

    const dropoffLocation = dropoffVillageId 
      ? await buildLocationFromVillage(dropoffVillageId) 
      : await buildLocationFromStoppage(dropoffStoppageId);

    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        success: false,
        message: 'অবৈধ স্থান নির্বাচন করা হয়েছে'
      });
    }

    const distance = pickupVillageId && dropoffVillageId
      ? await calculateDistanceKmByVillage(pickupVillageId, dropoffVillageId)
      : await calculateDistanceKm(pickupStoppageId, dropoffStoppageId);

    let fare = requestedFare ? Number(requestedFare) : Math.max(BASE_FARE, distance * FARE_PER_KM);

    if (!requestedFare) {
      // Apply 20% night surge (6 PM to 6 AM)
      const now = new Date();
      const localTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Adjusted for IST/BST (UTC+5:30)
      const hour = localTime.getUTCHours();
      if (hour >= 18 || hour < 6) {
        fare = Math.ceil(fare * 1.20);
      }
    }

    const ride = new Ride({
      passengerId: req.userId,
      pickupLocation,
      dropoffLocation,
      distance,
      fare,
      rideStatus: 'pending'
    });

    ride.set('otp', Math.floor(1000 + Math.random() * 9000).toString(), { strict: false });

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
    const rides = await Ride.find({ rideStatus: { $in: ['pending', 'driver_offered'] } })
      .populate('passengerId', 'firstName lastName phone profilePhoto')
      .sort({ createdAt: -1 })
      .lean();

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
    const { fare } = req.body;
    const currentRide = await Ride.findById(req.params.rideId).lean();

    if (!currentRide) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    if (currentRide.rideStatus !== 'pending' && currentRide.rideStatus !== 'driver_offered') {
      return res.status(400).json({
        success: false,
        message: 'রাইডটি ইতিমধ্যে অন্য কেউ নিয়ে নিয়েছে অথবা বাতিল হয়েছে।'
      });
    }

    let offers = currentRide.offers || [];
    offers = offers.filter(o => {
      const idStr = (o.driverId && o.driverId._id) ? o.driverId._id.toString() : (o.driverId ? o.driverId.toString() : '');
      return idStr !== req.userId;
    });
    offers.push({ driverId: req.userId, fare: fare || currentRide.fare });

    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.rideId, rideStatus: { $in: ['pending', 'driver_offered'] } },
      { 
        rideStatus: 'driver_offered',
        $set: { offers: offers }
      },
      { new: true, strict: false }
    )
    .populate('passengerId', 'firstName lastName phone profilePhoto')
    .populate({ path: 'offers.driverId', model: 'User', select: 'firstName lastName phone profilePhoto vehicleNumber averageRating', strictPopulate: false });

    res.status(200).json({
      success: true,
      message: 'Offer sent successfully',
      ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept ride'
    });
  }
});

// CUSTOMER ACCEPTS OFFER
router.post('/accept-offer/:rideId', authMiddleware, async (req, res) => {
  try {
    const { driverId, fare } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.rideId, passengerId: req.userId, rideStatus: 'driver_offered' },
      { 
        $set: {
          rideStatus: 'accepted',
          driverId: driverId,
          fare: fare,
          startTime: new Date(),
          otp: otp
        }
      },
      { new: true, strict: false }
    ).populate('driverId', 'firstName lastName phone profilePhoto vehicleNumber').lean();

    if (!ride) {
      return res.status(400).json({ success: false, message: 'Ride not found or invalid state' });
    }

    res.status(200).json({ success: true, message: 'Offer accepted', ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to accept offer' });
  }
});

// CUSTOMER REJECTS OFFER
router.post('/reject-offer/:rideId', authMiddleware, async (req, res) => {
  try {
    const { driverId } = req.body;
    const currentRide = await Ride.findById(req.params.rideId).lean();
    if (!currentRide) return res.status(404).json({ success: false, message: 'Ride not found' });

    let offers = currentRide.offers || [];
    offers = offers.filter(o => {
      const idStr = (o.driverId && o.driverId._id) ? o.driverId._id.toString() : (o.driverId ? o.driverId.toString() : '');
      return idStr !== driverId;
    });

    const status = offers.length === 0 ? 'pending' : 'driver_offered';

    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.rideId, passengerId: req.userId, rideStatus: 'driver_offered' },
      { 
        $set: { 
          offers: offers, 
          rideStatus: status
        }
      },
      { new: true, strict: false }
    ).lean();

    if (!ride) {
      return res.status(400).json({ success: false, message: 'Ride not found or invalid state' });
    }

    res.status(200).json({ success: true, message: 'Offer rejected', ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to reject offer' });
  }
});

// ARRIVE AT PICKUP (Driver)
router.post('/arrive/:rideId', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.rideId, driverId: req.userId, rideStatus: 'accepted' },
      { 
        rideStatus: 'arrived',
        arriveTime: new Date()
      },
      { new: true }
    );

    if (!ride) {
      return res.status(400).json({
        success: false,
        message: 'Ride not found or invalid state'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Driver arrived',
      ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update ride status'
    });
  }
});

// START RIDE (Driver)
router.post('/start/:rideId', authMiddleware, async (req, res) => {
  try {
    const { otp } = req.body;

    // Use .lean() to force Mongoose to read the dynamically injected 'otp' field
    const rideCheck = await Ride.findOne({ _id: req.params.rideId, driverId: req.userId, rideStatus: { $in: ['accepted', 'arrived'] } }).lean();

    if (!rideCheck) {
      return res.status(400).json({
        success: false,
        message: 'Ride not found or invalid state'
      });
    }

    // Strict check: if it's not the 0000 bypass, it MUST perfectly match the customer's PIN
    if (otp !== '0000' && (!rideCheck.otp || rideCheck.otp !== otp)) {
      return res.status(400).json({
        success: false,
        message: 'ভুল পিন (Invalid OTP)'
      });
    }

    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.rideId, driverId: req.userId, rideStatus: { $in: ['accepted', 'arrived'] } },
      { rideStatus: 'in_progress' },
      { new: true }
    );

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

// END RIDE (Driver or Passenger)
router.post('/end/:rideId', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      { 
        _id: req.params.rideId, 
        $or: [{ driverId: req.userId }, { passengerId: req.userId }],
        rideStatus: { $in: ['accepted', 'arrived', 'in_progress'] } 
      },
      { 
        rideStatus: 'completed',
        endTime: new Date(),
        paymentStatus: 'paid'
      },
      { new: true }
    );

    if (!ride) {
      return res.status(400).json({
        success: false,
        message: 'Ride not found or invalid state'
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
      .populate('driverId', 'firstName lastName phone profilePhoto vehicleNumber')
      .populate({ path: 'offers.driverId', model: 'User', select: 'firstName lastName phone profilePhoto vehicleNumber averageRating', strictPopulate: false })
      .lean();

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
      .sort({ createdAt: -1 })
      .lean();

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
    const ride = await Ride.findOneAndUpdate(
      { 
        _id: req.params.rideId, 
        $or: [{ passengerId: req.userId }, { driverId: req.userId }],
        rideStatus: { $in: ['pending', 'accepted', 'arrived'] } 
      },
      { rideStatus: 'cancelled' },
      { new: true }
    );

    if (!ride) {
      return res.status(400).json({
        success: false,
        message: 'Ride not found or cannot be cancelled'
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
    // We just verify the ride exists, but we don't modify it. 
    // Modifying it to 'pending' would unassign another driver if they already accepted it!
    const ride = await Ride.findById(req.params.rideId);

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
    const { rating, feedback } = req.body;

    if (!rating) {
      return res.status(400).json({ success: false, message: 'Rating is required' });
    }

    const numericRating = Number(rating);

    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { rating: numericRating, feedback },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    // Update driver's overall rating
    if (ride.driverId) {
      const allDriverRides = await Ride.find({ driverId: ride.driverId, rating: { $ne: null } });
      
      // Filter out invalid ratings and ensure they are numbers to prevent NaN crash
      const validRides = allDriverRides.filter(r => r.rating !== null && r.rating !== undefined && !isNaN(Number(r.rating)));
      const totalReviews = validRides.length;
      const sumRating = validRides.reduce((sum, r) => sum + Number(r.rating), 0);
      
      // Convert .toFixed(1) result back to Number so Mongoose doesn't complain about strings
      const averageRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 0;
      
      await User.findByIdAndUpdate(ride.driverId, { averageRating, totalReviews });
    }

    res.status(200).json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit rating' });
  }
});

// ==========================================
// BACKGROUND TASK: AUTO-CANCEL EXPIRED RIDES
// ==========================================
setInterval(async () => {
  try {
    const now = new Date();
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // 1. Cancel rides that nobody accepted within 15 minutes
    await Ride.updateMany(
      { rideStatus: { $in: ['pending', 'driver_offered'] }, createdAt: { $lt: fifteenMinsAgo } },
      { $set: { rideStatus: 'cancelled' } }
    );

    // 2. Cancel accepted rides where the driver never arrived within 15 minutes
    await Ride.updateMany(
      { rideStatus: 'accepted', startTime: { $lt: fifteenMinsAgo } },
      { $set: { rideStatus: 'cancelled' } }
    );

    // 3. Cancel arrived rides where the trip didn't start within 5 minutes
    await Ride.updateMany(
      { rideStatus: 'arrived', arriveTime: { $lt: fiveMinsAgo } },
      { $set: { rideStatus: 'cancelled' } }
    );
  } catch (error) {
    console.error('Auto-cancel background task error:', error);
  }
}, 60000); // Runs every 60 seconds

module.exports = router;
