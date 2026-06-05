const mongoose = require('mongoose');

const StoppageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  nameBn: { type: String, required: true },
  distanceIndex: { type: Number, required: true },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 }
}, { _id: false }); // We use your custom 'id' instead of Mongo's automatic ObjectId here

const VillageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nameBn: { type: String, required: true },
  stoppages: [StoppageSchema]
});

module.exports = mongoose.model('Location', VillageSchema);