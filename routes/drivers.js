const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// This route was added to handle the 404 error for registering FCM tokens.
// It assumes your User model has a field `fcmTokens: [String]`.

// POST /api/drivers/register-fcm-token
// Registers or updates a driver's FCM token
router.post('/register-fcm-token', authMiddleware, async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) {
            return res.status(400).json({ success: false, msg: 'FCM token is required' });
        }

        // req.userId is set by the authMiddleware
        const driver = await User.findById(req.userId);

        if (!driver || driver.userType !== 'driver') {
            return res.status(404).json({ success: false, msg: 'Driver not found' });
        }

        // Add the token only if it's not already there
        if (!driver.fcmTokens.includes(fcmToken)) {
            driver.fcmTokens = [fcmToken];
            await driver.save();
        }

        res.json({ success: true, msg: 'FCM token registered successfully' });
    } catch (err) {
        console.error('Error registering FCM token:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;