const express = require('express');
const router = express.Router();
const { getRecommendations, getPartnerDetails } = require('../controllers/partnerController');
const { protect } = require('../middleware/auth');

router.get('/recommendations', protect, getRecommendations);
router.get('/profile/:id', protect, getPartnerDetails);

module.exports = router;
