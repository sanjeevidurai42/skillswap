const express = require('express');
const router = express.Router();
const {
  scheduleSession,
  getUpcomingSessions,
  getPastSessions,
  completeSession,
  cancelSession
} = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');

router.post('/', protect, scheduleSession);
router.get('/upcoming', protect, getUpcomingSessions);
router.get('/past', protect, getPastSessions);
router.put('/:id/complete', protect, completeSession);
router.put('/:id/cancel', protect, cancelSession);

module.exports = router;
