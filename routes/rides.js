const express = require('express');
const mongoose = require('mongoose');
const Ride = require('../models/Ride');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const admin = require("firebase-admin");

const {
  findStoppage,
  formatLocationAddress,
  calculateDistanceKm,
  buildLocationFromVillage,
  calculateDistanceKmByVillage
} = require('../data/locations');

const router = express.Router();

const FARE_PER_KM = 10; // per km rate
const BASE_FARE = 10; // minimum fare
const NIGHT_SURCHARGE = 10; // fixed night increment
const NIGHT_SURGE_START = 18; // 6 PM
const NIGHT_SURGE_END = 6; // 6 AM
const SCHEDULE_OFFER_WINDOW_MS = 2 * 60 * 60 * 1000;

function parseLocalDateTime(dateString, timeString) {
  if (!dateString || !timeString) return null;
  const normalizedTime = timeString.length === 5 ? timeString : timeString.padStart(5, '0');
  const value = new Date(`${dateString}T${normalizedTime}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function getScheduledRideCutoff(ride) {
  if (!ride || ride.bookingType !== 'scheduled') return null;
  if (ride.scheduleCutoffAt) return new Date(ride.scheduleCutoffAt);
  if (ride.scheduledDateTime) return new Date(new Date(ride.scheduledDateTime).getTime() - SCHEDULE_OFFER_WINDOW_MS);
  if (ride.scheduledDate && ride.scheduledTime) {
    const scheduledDateTime = parseLocalDateTime(ride.scheduledDate.toISOString().slice(0, 10), ride.scheduledTime);
    if (scheduledDateTime) return new Date(scheduledDateTime.getTime() - SCHEDULE_OFFER_WINDOW_MS);
  }
  return null;
}

async function processScheduledRideAssignment(ride) {
  if (!ride || ride.bookingType !== 'scheduled') return false;
  if (ride.rideStatus === 'accepted' || ride.rideStatus === 'cancelled') return false;

  const cutoffAt = getScheduledRideCutoff(ride);
  if (!cutoffAt || new Date() < cutoffAt) return false;

  const offers = Array.isArray(ride.offers)
    ? ride.offers.filter(o => o && o.driverId && Number(o.fare) > 0)
    : [];
  if (offers.length === 0) {
    await Ride.updateOne(
      { _id: ride._id, bookingType: 'scheduled', rideStatus: { $in: ['pending', 'driver_offered'] }, driverId: null },
      { $set: { scheduleStatus: 'no_driver' } }
    );
    return true;
  }

  const winner = offers.reduce((best, current) => {
    if (!best) return current;
    return Number(current.fare) < Number(best.fare) ? current : best;
  }, null);

  if (!winner || !winner.driverId) {
    await Ride.updateOne(
      { _id: ride._id, bookingType: 'scheduled', rideStatus: { $in: ['pending', 'driver_offered'] }, driverId: null },
      { $set: { scheduleStatus: 'no_driver' } }
    );
    return true;
  }

  const assigned = await Ride.findOneAndUpdate(
    {
      _id: ride._id,
      bookingType: 'scheduled',
      rideStatus: { $in: ['pending', 'driver_offered'] },
      driverId: null,
      $or: [
        { scheduleCutoffAt: { $lte: new Date() } },
        { scheduleCutoffAt: null, scheduledDateTime: { $lte: new Date(Date.now() + SCHEDULE_OFFER_WINDOW_MS) } }
      ]
    },
    {
      $set: {
        driverId: winner.driverId,
        fare: Number(winner.fare),
        rideStatus: 'accepted',
        startTime: new Date(),
        scheduleStatus: 'assigned',
        otp: Math.floor(1000 + Math.random() * 9000).toString()
      }
    },
    { new: true }
  );
  return Boolean(assigned);
}

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

// SCHEDULED RIDE REQUEST (Passenger)
router.post('/schedule-request', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user && user.isBlocked) {
      return res.status(403).json({ success: false, message: 'ACCOUNT_BLOCKED' });
    }

    const {
      pickupVillageId,
      dropoffVillageId,
      pickupStoppageId,
      dropoffStoppageId,
      landmark,
      fare: requestedFare,
      pickupLat,
      pickupLng,
      rideType,
      scheduledDate,
      scheduledTime
    } = req.body;

    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({ success: false, message: 'তারিখ ও সময় নির্বাচন করুন' });
    }

    const parsedDateTime = parseLocalDateTime(scheduledDate, scheduledTime);
    if (!parsedDateTime) {
      return res.status(400).json({ success: false, message: 'অবৈধ তারিখ বা সময়' });
    }

    const now = new Date();
    if (parsedDateTime <= now) {
      return res.status(400).json({ success: false, message: 'সিডিউল করার জন্য ভবিষ্যতের তারিখ ও সময় নির্বাচন করুন' });
    }

    if (parsedDateTime.getTime() - now.getTime() < SCHEDULE_OFFER_WINDOW_MS) {
      return res.status(400).json({ success: false, message: 'আগাম রাইডের জন্য কমপক্ষে ২ ঘণ্টা সময় প্রয়োজন।' });
    }

    const pVid = pickupVillageId || pickupStoppageId;
    const dVid = dropoffVillageId || dropoffStoppageId;
    if (!pVid || !dVid) {
      return res.status(400).json({ success: false, message: 'শুরুর স্থান ও গন্তব্য নির্বাচন করুন' });
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
      return res.status(400).json({ success: false, message: 'অবৈধ স্থান নির্বাচন করা হয়েছে' });
    }

    const distance = pickupVillageId && dropoffVillageId
      ? await calculateDistanceKmByVillage(pickupVillageId, dropoffVillageId)
      : await calculateDistanceKm(pickupStoppageId, dropoffStoppageId);

    const fareValue = Number(requestedFare || Math.max(BASE_FARE, distance * FARE_PER_KM));
    if (!Number.isFinite(fareValue) || fareValue < 100) {
      return res.status(400).json({ success: false, message: 'ভাড়া ন্যূনতম ₹100 হতে হবে' });
    }

    const ride = new Ride({
      passengerId: req.userId,
      pickupLocation,
      dropoffLocation,
      distance,
      fare: fareValue,
      rideType: rideType || null,
      bookingType: 'scheduled',
      scheduledDate: new Date(`${scheduledDate}T00:00:00`),
      scheduledTime,
      scheduledDateTime: parsedDateTime,
      scheduleCutoffAt: new Date(parsedDateTime.getTime() - SCHEDULE_OFFER_WINDOW_MS),
      scheduleStatus: 'pending',
      rideStatus: 'pending',
      otp: Math.floor(1000 + Math.random() * 9000).toString()
    });

    await ride.save();
    res.status(201).json({ success: true, message: 'Scheduled ride created successfully', ride });
  } catch (error) {
    console.error('Schedule ride error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to schedule ride' });
  }
});

// REQUEST RIDE (Passenger)
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (user && user.isBlocked) {
      return res.status(403).json({ success: false, message: 'ACCOUNT_BLOCKED' });
    }

    // Block booking if user has an outstanding penalty
    if (user.activePenalty && user.activePenalty.amount > 0) {
      return res.status(403).json({
        success: false,
        message: 'PENALTY_DUE',
        penalty: user.activePenalty
      });
    }

    const { pickupVillageId, dropoffVillageId, pickupStoppageId, dropoffStoppageId, landmark, fare: requestedFare, pickupLat, pickupLng, rideType } = req.body;

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
      const now = new Date();
      const localTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Adjusted for IST/BST (UTC+5:30)
      const hour = localTime.getUTCHours();
      if (hour >= NIGHT_SURGE_START || hour < NIGHT_SURGE_END) {
        fare = fare + NIGHT_SURCHARGE;
      }
    }

    const ride = new Ride({
      passengerId: req.userId,
      pickupLocation,
      dropoffLocation,
      distance,
      fare,
      rideType: rideType || null,
      rideStatus: 'pending',
      otp: Math.floor(1000 + Math.random() * 9000).toString()
    });

    await ride.save();
    // ================= SEND PUSH NOTIFICATION =================
    // FCM functionality removed as per request.
    // try {

    //   const drivers = await User.find({
    //     userType: "driver",
    //     isOnline: true,
    //     fcmTokens: { $exists: true, $ne: [] }
    //   });

    //   console.log("Online Drivers:", drivers.length);
    //   console.log("Online Drivers:", drivers.length);

    //   for (const driver of drivers) {

    //     if (!driver.fcmTokens || driver.fcmTokens.length === 0)
    //       continue;

    //     for (const token of driver.fcmTokens) {

    //       try {
    //         console.log("--------------");
    //         console.log(driver.phone);
    //         console.log(driver.isOnline);
    //         console.log(driver.fcmTokens);
    //         const pickupName = pickupLocation.stoppageName || pickupLocation.villageName;
    //         const dropName = dropoffLocation.stoppageName || dropoffLocation.villageName;
    //         const response = await admin.messaging().send({

    //           token: token,

    //           notification: {
    //             title: "🛺 New Toto Booking",
    //             body: `${pickupLocation.stoppageName} ➜ ${dropoffLocation.stoppageName} | ₹${fare}`
    //           },

    //           webpush: {
    //             headers: {
    //               Urgency: "high",
    //               TTL: "86400"
    //             },
    //             notification: {
    //               title: "🛺 New Toto Booking",
    //               body: `${pickupLocation.stoppageName} ➜ ${dropoffLocation.stoppageName} | ₹${fare}`,
    //               icon: "https://totoapp.onrender.com/image/toto_icon.png",
    //               badge: "https://totoapp.onrender.com/badge.png",
    //               requireInteraction: true
    //             },

    //             fcmOptions: {
    //               link: "https://totoapp.onrender.com/"
    //             }

    //           },

    //           data: {
    //             rideId: ride._id.toString(),
    //             type: "NEW_RIDE"
    //           }

    //         });

    //         console.log("Firebase Message ID:", response);

    //       } catch (err) {

    //         console.error(err);

    //         if (err.code === "messaging/registration-token-not-registered") {

    //           driver.fcmTokens = driver.fcmTokens.filter(t => t !== token);

    //           await driver.save();

    //           console.log("Old token removed.");

    //         }

    //       }

    //     }

    //   }

    // } catch (err) {

    //   // if (err.code === "messaging/registration-token-not-registered") {

    //   //   driver.fcmTokens =
    //   //     driver.fcmTokens.filter(t => t !== token);

    //   //   await driver.save();

    //   console.log("Old token removed");

    //   // }

    // }





    // ================= END PUSH NOTIFICATION =================
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
    const user = await User.findById(req.userId);
    if (user && user.isBlocked) {
      return res.status(403).json({ success: false, message: 'ACCOUNT_BLOCKED' });
    }

    const now = new Date();
    const rides = await Ride.find({
      rideStatus: { $in: ['pending', 'driver_offered'] },
      $or: [
        { bookingType: { $ne: 'scheduled' } },
        {
          bookingType: 'scheduled',
          scheduleStatus: 'pending',
          scheduleCutoffAt: { $gt: now }
        }
      ]
    })
      .populate('passengerId', 'firstName lastName phone profilePhoto')
      .sort({ createdAt: -1 })
      .lean();

    const safeRides = rides.map(ride => {
      if (ride.bookingType !== 'scheduled') return ride;
      const { passengerId, ...scheduleRide } = ride;
      return scheduleRide;
    });

    res.status(200).json({
      success: true,
      rides: safeRides
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
    const { fare, driverLat, driverLng } = req.body;
    const currentRide = await Ride.findById(req.params.rideId).lean();

    if (!currentRide) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    const cutoffAt = getScheduledRideCutoff(currentRide);
    if (currentRide.bookingType === 'scheduled' && cutoffAt && new Date() >= cutoffAt) {
      return res.status(400).json({
        success: false,
        message: 'Schedule booking offer time has expired.'
      });
    }

    if (currentRide.rideStatus !== 'pending' && currentRide.rideStatus !== 'driver_offered') {
      return res.status(400).json({
        success: false,
        message: 'রাইডটি ইতিমধ্যে অন্য কেউ নিয়ে নিয়েছে অথবা বাতিল হয়েছে।'
      });
    }

    if (currentRide.bookingType === 'scheduled') {
      if (req.userType !== 'driver') {
        return res.status(403).json({ success: false, message: 'Only drivers can submit schedule offers.' });
      }
      const offeredFare = Number(fare ?? currentRide.fare ?? 0);
      if (!Number.isFinite(offeredFare) || offeredFare < 100) {
        return res.status(400).json({ success: false, message: 'ভাড়া ন্যূনতম ₹100 হতে হবে' });
      }
      const isImmediateAccept = offeredFare <= Number(currentRide.fare || 0) + 1;

      if (isImmediateAccept) {
        const ride = await Ride.findOneAndUpdate(
          {
            _id: req.params.rideId,
            bookingType: 'scheduled',
            rideStatus: { $in: ['pending', 'driver_offered'] },
            driverId: null,
            scheduleCutoffAt: { $gt: new Date() }
          },
          {
            $set: {
              driverId: req.userId,
              rideStatus: 'accepted',
              fare: Number(currentRide.fare || offeredFare),
              startTime: new Date(),
              otp: Math.floor(1000 + Math.random() * 9000).toString(),
              scheduleStatus: 'assigned'
            }
          },
          { new: true }
        )
          .populate('passengerId', 'firstName lastName phone profilePhoto')
          .populate('driverId', 'firstName lastName phone profilePhoto vehicleNumber')
          .populate({ path: 'offers.driverId', model: 'User', select: 'firstName lastName phone profilePhoto vehicleNumber averageRating', strictPopulate: false });

        if (!ride) {
          return res.status(400).json({ success: false, message: 'এই আগাম রাইডটি ইতিমধ্যে বরাদ্দ হয়েছে।' });
        }

        return res.status(200).json({
          success: true,
          message: 'Scheduled ride accepted successfully',
          ride
        });
      }
    }

    const offerDetails = { driverId: req.userId, fare: Number(fare || currentRide.fare) };
    if (driverLat != null && driverLng != null) {
      offerDetails.location = { lat: driverLat, lng: driverLng };
    }

    let rideQuery = { _id: req.params.rideId, rideStatus: { $in: ['pending', 'driver_offered'] } };
    let rideUpdate;
    if (currentRide.bookingType === 'scheduled') {
      const driverObjectId = new mongoose.Types.ObjectId(req.userId);
      rideQuery = {
        ...rideQuery,
        bookingType: 'scheduled',
        driverId: null,
        scheduleCutoffAt: { $gt: new Date() }
      };
      rideUpdate = [
        {
          $set: {
            rideStatus: 'driver_offered',
            scheduleStatus: 'pending',
            offers: {
              $concatArrays: [
                { $filter: { input: { $ifNull: ['$offers', []] }, as: 'offer', cond: { $ne: ['$$offer.driverId', driverObjectId] } } },
                [{ ...offerDetails, driverId: driverObjectId }]
              ]
            }
          }
        }
      ];
    } else {
      let offers = currentRide.offers || [];
      offers = offers.filter(o => {
        const idStr = (o.driverId && o.driverId._id) ? o.driverId._id.toString() : (o.driverId ? o.driverId.toString() : '');
        return idStr !== req.userId;
      });
      offers.push(offerDetails);
      rideUpdate = { $set: { rideStatus: 'driver_offered', offers } };
    }

    const ride = await Ride.findOneAndUpdate(rideQuery, rideUpdate, { new: true })
      .populate('passengerId', 'firstName lastName phone profilePhoto')
      .populate({ path: 'offers.driverId', model: 'User', select: 'firstName lastName phone profilePhoto vehicleNumber averageRating', strictPopulate: false });

    if (currentRide.bookingType === 'scheduled' && ride) {
      const safeRide = ride.toObject();
      delete safeRide.passengerId;
      return res.status(200).json({
        success: true,
        message: 'Offer sent successfully',
        ride: safeRide
      });
    }

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
    const { driverId, fare, passengerLat, passengerLng } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const currentRide = await Ride.findOne({ _id: req.params.rideId, passengerId: req.userId, rideStatus: 'driver_offered' }).lean();
    if (!currentRide) {
      return res.status(400).json({ success: false, message: 'Ride not found or invalid state' });
    }

    const updatePayload = {
      rideStatus: 'accepted',
      driverId: driverId,
      fare: fare,
      startTime: new Date(),
      otp: otp
    };

    if (passengerLat != null && passengerLng != null) {
      updatePayload['pickupLocation.latitude'] = Number(passengerLat);
      updatePayload['pickupLocation.longitude'] = Number(passengerLng);
    }

    const acceptedOffer = (currentRide.offers || []).find(o => {
      const idStr = (o.driverId && o.driverId._id) ? o.driverId._id.toString() : (o.driverId ? o.driverId.toString() : '');
      return idStr === driverId;
    });

    if (acceptedOffer && acceptedOffer.location) {
      updatePayload.driverLocation = {
        type: 'Point',
        coordinates: [acceptedOffer.location.lng, acceptedOffer.location.lat]
      };
    }

    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.rideId, passengerId: req.userId, rideStatus: 'driver_offered' },
      { $set: updatePayload },
      { new: true }
    ).populate('driverId', 'firstName lastName phone profilePhoto vehicleNumber').lean();

    if (!ride) {
      return res.status(400).json({ success: false, message: 'Could not accept offer, ride may have been taken.' });
    }

    res.status(200).json({ success: true, message: 'Offer accepted!', ride });
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
      { new: true }
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
    const ride = await Ride.findOne({ _id: req.params.rideId, driverId: req.userId, rideStatus: { $in: ['accepted', 'arrived'] } });

    if (!ride) {
      return res.status(400).json({
        success: false,
        message: 'Ride not found or invalid state'
      });
    }

    // Strict check: if it's not the '0000' bypass, it MUST perfectly match the customer's PIN
    if (otp !== '0000' && ride.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'ভুল পিন (Invalid OTP)'
      });
    }

    ride.rideStatus = 'in_progress';
    await ride.save();

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
    const user = await User.findById(req.userId);
    if (user && user.isBlocked) {
      return res.status(403).json({ success: false, message: 'ACCOUNT_BLOCKED' });
    }

    const ride = await Ride.findById(req.params.rideId).lean();

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    const isPassenger = ride.passengerId && ride.passengerId.toString() === req.userId;
    const isAssignedDriver = ride.driverId && ride.driverId.toString() === req.userId;
    const isEligibleScheduleDriver = req.userType === 'driver'
      && ride.bookingType === 'scheduled'
      && ['pending', 'driver_offered'].includes(ride.rideStatus)
      && !ride.driverId;
    if (ride.bookingType === 'scheduled' && !isPassenger && !isAssignedDriver && !isEligibleScheduleDriver) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this ride.' });
    }

    const offerSelect = ride.bookingType === 'scheduled'
      ? 'firstName lastName vehicleNumber averageRating'
      : 'firstName lastName phone profilePhoto vehicleNumber averageRating';
    const populatedRide = await Ride.findById(req.params.rideId)
      .populate('passengerId', 'firstName lastName phone profilePhoto')
      .populate('driverId', 'firstName lastName phone profilePhoto vehicleNumber')
      .populate({ path: 'offers.driverId', model: 'User', select: offerSelect, strictPopulate: false })
      .lean();

    if (ride.bookingType === 'scheduled' && !isPassenger && !isAssignedDriver) {
      delete populatedRide.passengerId;
    }

    res.status(200).json({
      success: true,
      ride: populatedRide
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
    const ride = await Ride.findOne({
      _id: req.params.rideId,
      $or: [{ passengerId: req.userId }, { driverId: req.userId }]
    }).populate('driverId');

    if (!ride) {
      return res.status(400).json({
        success: false,
        message: 'Ride not found or you are not authorized'
      });
    }

    if (ride.rideStatus === 'cancelled') {
      return res.status(200).json({
        success: true,
        message: 'Ride is already cancelled',
        ride,
        penaltyApplied: ride.penaltyApplied || false
      });
    }

    if (!['pending', 'driver_offered', 'accepted', 'arrived'].includes(ride.rideStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Ride cannot be cancelled at this stage'
      });
    }

    let applyPenalty = false;

    // Penalty ONLY applies if the driver has arrived and 4 minutes 50 seconds (290,000 ms) have passed
    if (ride.rideStatus === 'arrived' && ride.arriveTime) {
      const arriveDate = new Date(ride.arriveTime).getTime();
      const now = new Date().getTime();
      if (now - arriveDate >= 290000) {
        applyPenalty = true;
      }
    }

    if (applyPenalty && ride.driverId) {
      await User.findByIdAndUpdate(ride.passengerId, {
        $set: {
          'activePenalty.amount': 30,
          'activePenalty.driverId': ride.driverId._id,
          'activePenalty.driverName': `${ride.driverId.firstName} ${ride.driverId.lastName}`,
          'activePenalty.driverUpiId': ride.driverId.upiId || '',
          'activePenalty.driverPhone': ride.driverId.phone || '',
          'activePenalty.status': 'unpaid'
        }
      });
    }

    ride.rideStatus = 'cancelled';
    ride.penaltyApplied = applyPenalty;
    await ride.save();

    res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      ride,
      penaltyApplied: applyPenalty
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

    const scheduledRides = await Ride.find({
      bookingType: 'scheduled',
      rideStatus: { $in: ['pending', 'driver_offered'] },
      scheduleStatus: 'pending'
    }).lean();

    for (const ride of scheduledRides) {
      await processScheduledRideAssignment(await Ride.findById(ride._id));
    }

    // 1. Cancel rides that nobody accepted within 15 minutes
    await Ride.updateMany(
      { bookingType: { $ne: 'scheduled' }, rideStatus: { $in: ['pending', 'driver_offered'] }, createdAt: { $lt: fifteenMinsAgo } },
      { $set: { rideStatus: 'cancelled' } }
    );

    // 2. Cancel accepted rides where the driver never arrived within 15 minutes
    await Ride.updateMany(
      { bookingType: { $ne: 'scheduled' }, rideStatus: 'accepted', startTime: { $lt: fifteenMinsAgo } },
      { $set: { rideStatus: 'cancelled' } }
    );

    // 3. Auto-Cancel arrived rides (5 mins) and perfectly penalize the passenger for No-Show
    const timedOutArrived = await Ride.find({ rideStatus: 'arrived', arriveTime: { $lt: fiveMinsAgo } }).populate('driverId');
    for (const r of timedOutArrived) {
      if (r.driverId) {
        await User.findByIdAndUpdate(r.passengerId, {
          $set: {
            'activePenalty.amount': 30,
            'activePenalty.driverId': r.driverId._id,
            'activePenalty.driverName': `${r.driverId.firstName} ${r.driverId.lastName}`,
            'activePenalty.driverUpiId': r.driverId.upiId || '',
            'activePenalty.driverPhone': r.driverId.phone || '',
            'activePenalty.status': 'unpaid'
          }
        });
      }
      r.rideStatus = 'cancelled';
      r.penaltyApplied = true;
      await r.save();
    }
  } catch (error) {
    console.error('Auto-cancel background task error:', error);
  }
}, 60000); // Runs every 60 seconds

// ==========================================
// PENALTY RESOLUTION ROUTES
// ==========================================

// 1. CUSTOMER MARKS PENALTY AS PAID
router.post('/penalty/mark-paid', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.activePenalty && user.activePenalty.amount > 0) {
      user.activePenalty.status = 'pending_confirmation';
      await user.save();
      res.status(200).json({ success: true, message: 'Penalty marked as pending' });
    } else {
      res.status(400).json({ success: false, message: 'No active penalty found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. DRIVER FETCHES PENDING CONFIRMATIONS
router.get('/driver/pending-penalties', authMiddleware, async (req, res) => {
  try {
    const pendingUsers = await User.find({
      'activePenalty.driverId': req.userId,
      'activePenalty.amount': { $gt: 0 },
      'activePenalty.status': 'pending_confirmation'
    }).select('firstName lastName phone activePenalty');
    res.status(200).json({ success: true, pending: pendingUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. DRIVER CONFIRMS PAYMENT RECEIVED
router.post('/driver/confirm-penalty/:passengerId', authMiddleware, async (req, res) => {
  try {
    const passenger = await User.findById(req.params.passengerId);
    if (passenger && passenger.activePenalty && passenger.activePenalty.driverId.toString() === req.userId) {
      passenger.activePenalty = { amount: 0, driverId: null, driverName: '', driverUpiId: '', driverPhone: '', status: 'unpaid' };
      await passenger.save();
      res.status(200).json({ success: true, message: 'Penalty completely cleared' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid penalty confirmation' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
