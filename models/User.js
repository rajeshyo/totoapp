const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    default: null,
    sparse: true
  },
  password: {
    type: String,
    required: true
  },
  profilePhoto: {
    type: String,
    default: null
  },
  userType: {
    type: String,
    enum: ['passenger', 'driver', 'admin'],
    default: 'passenger'
  },
  vehicleNumber: {
    type: String,
    default: null,
    trim: true
  },
  upiId: {
    type: String,
    default: ''
  },
  fcmTokens: {
    type: [String],
    default: []
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  rideType: {
    type: String,
    // Use an enum to ensure only valid ride types are stored
    enum: ['toto', 'bike', 'maruti', 'motorvan'],
    default: 'toto' // Optional: set a default value
  },
  serviceTypes: {
    type: [{
      type: String,
      enum: ['TOTO_PERSONAL', 'TOTO_SHARING', 'TOTO_GOODS', 'BIKE', 'MARUTI_FULL', 'MOTORVAN_FULL']
    }],
    default: undefined
  },
  activePenalty: {
    amount: { type: Number, default: 0 },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    driverName: { type: String, default: '' },
    driverUpiId: { type: String, default: '' },
    driverPhone: { type: String, default: '' },
    status: { type: String, default: 'unpaid' }
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  activeRouteId: {
    type: String,
    default: null
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

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from response
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
