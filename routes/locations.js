const express = require('express');
const { getAllVillages, addStoppageToVillage } = require('../data/locations');

const router = express.Router();

// GET all villages with stoppages (Bengali labels)
router.get('/', async (req, res) => {
  try {
    const villages = await getAllVillages();
    res.status(200).json({
      success: true,
      villages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch locations'
    });
  }
});

// POST add a new stoppage
router.post('/stoppage', async (req, res) => {
  try {
    const { villageId, nameBn } = req.body;
    if (!villageId || !nameBn) {
      return res.status(400).json({ success: false, message: 'Village ID and stoppage name are required' });
    }
    const newStoppage = await addStoppageToVillage(villageId, nameBn);
    res.status(201).json({ success: true, stoppage: newStoppage });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add stoppage'
    });
  }
});

module.exports = router;
