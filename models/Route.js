const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // An ordered list of Village ObjectIds
  villages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);