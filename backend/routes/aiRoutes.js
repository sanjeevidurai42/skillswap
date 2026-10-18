const express = require('express');
const router = express.Router();
const {
  generateStudyPlan,
  generateMatchExplanation,
  draftProposal,
  chatCopilot,
  getStatus
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.get('/status', getStatus);
router.post('/study-plan/:partnerId', protect, generateStudyPlan);
router.post('/match-explanation/:partnerId', protect, generateMatchExplanation);
router.post('/draft-proposal', protect, draftProposal);
router.post('/chat', protect, chatCopilot);

module.exports = router;
