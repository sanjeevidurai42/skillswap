const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getDashboardStats } = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/profile/:id', optionalAuth, getProfile);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/dashboard-stats', protect, getDashboardStats);

module.exports = router;
