const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const authMiddleware = require('../middleware/auth');

// A simple middleware to ensure only admins can access these routes
const adminOnly = (req, res, next) => {
    if (req.userType !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    next();
};

// GET all active routes, populated with village names
router.get('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const routes = await Route.find({ isActive: true }).populate('villages', 'nameBn').sort({ name: 1 });
        res.json({ success: true, routes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST: Create a new route
router.post('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { name, villages } = req.body;
        if (!name || !villages || !Array.isArray(villages)) {
            return res.status(400).json({ success: false, message: 'Route name and a list of villages are required.' });
        }
        const newRoute = new Route({ name, villages });
        await newRoute.save();
        const populatedRoute = await Route.findById(newRoute._id).populate('villages', 'nameBn');
        res.status(201).json({ success: true, route: populatedRoute, message: 'Route created successfully.' });
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({ success: false, message: 'A route with this name already exists.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT: Update an existing route
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { name, villages } = req.body;
        if (!name || !villages || !Array.isArray(villages)) {
            return res.status(400).json({ success: false, message: 'Route name and a list of villages are required.' });
        }
        const updatedRoute = await Route.findByIdAndUpdate(req.params.id, { name, villages }, { new: true }).populate('villages', 'nameBn');
        if (!updatedRoute) {
            return res.status(404).json({ success: false, message: 'Route not found.' });
        }
        res.json({ success: true, route: updatedRoute, message: 'Route updated successfully.' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'A route with this name already exists.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE: Remove a route
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const deletedRoute = await Route.findByIdAndDelete(req.params.id);
        if (!deletedRoute) {
            return res.status(404).json({ success: false, message: 'Route not found.' });
        }
        res.json({ success: true, message: 'Route deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;