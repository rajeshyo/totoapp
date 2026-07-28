const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  pickupLocation: {
    address: String,
    villageId: String,
    villageName: String,
    stoppageId: String,
    stoppageName: String,
    landmark: String,
    latitude: Number,
    longitude: Number
  },
  dropoffLocation: {
    address: String,
    villageId: String,
    villageName: String,
    stoppageId: String,
    stoppageName: String,
    latitude: Number,
    longitude: Number
  },
  distance: {
    type: Number,
    default: 0
  },
  fare: {
    type: Number,
    default: 0
  },
  rideStatus: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  offers: [{
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fare: Number,
    location: {
      lat: Number,
      lng: Number
    }
  }],
  driverLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    default: null
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  otp: {
    type: String,
    default: null
  },
  arriveTime: {
    type: Date,
    default: null
  },
  penaltyApplied: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

rideSchema.index({ driverLocation: '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);
