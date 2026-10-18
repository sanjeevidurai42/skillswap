const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getUserFeedback,
  getLeaderboard
} = require('../controllers/feedbackController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', protect, submitFeedback);
router.get('/user/:id', optionalAuth, getUserFeedback);
router.get('/my-feedback', protect, getUserFeedback);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
