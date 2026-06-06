const express = require('express');
const { getAllVillages, addStoppageToVillage, addVillage } = require('../data/locations');

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

// POST add a new village
router.post('/village', async (req, res) => {
  try {
    const { nameBn } = req.body;
    if (!nameBn) {
      return res.status(400).json({ success: false, message: 'Village name is required' });
    }
    
    // Check if addVillage is implemented in data/locations.js
    if (typeof addVillage === 'function') {
      const newVillage = await addVillage(nameBn);
      res.status(201).json({ success: true, village: newVillage });
    } else {
      res.status(501).json({ success: false, message: 'Backend needs addVillage function in data/locations.js' });
    }
  } catch (error) {
    console.error("Add village error:", error);
    res.status(500).json({ success: false, message: error.message || 'Failed to add village' });
  }
});

module.exports = router;
