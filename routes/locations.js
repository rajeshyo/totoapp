const express = require('express');
const { getAllVillages } = require('../data/locations');

const router = express.Router();

// GET all villages with stoppages (Bengali labels)
router.get('/', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      villages: getAllVillages()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch locations'
    });
  }
});

module.exports = router;
