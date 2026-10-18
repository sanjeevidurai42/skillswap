const Feedback = require('../models/Feedback');
const LearningSession = require('../models/LearningSession');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Transparent skill points calculation formula
 */
const calculatePointsAwarded = (rating) => {
  const basePoints = 30;
  let bonusPoints = 0;
  if (rating === 5) bonusPoints = 20;
  else if (rating === 4) bonusPoints = 15;
  else if (rating === 3) bonusPoints = 10;
  else if (rating === 2) bonusPoints = 5;

  return {
    total: basePoints + bonusPoints,
    breakdown: `Base Completion (+${basePoints} pts) + ${rating}-Star Review Bonus (+${bonusPoints} pts)`
  };
};

/**
 * @route   POST /api/feedback
 * @desc    Submit rating, review & award skill points for a completed session
 * @access  Private
 */
exports.submitFeedback = async (req, res, next) => {
  try {
    const { sessionId, rating, comment, criteriaRatings } = req.body;

    if (!sessionId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide sessionId, rating (1-5), and constructive feedback.'
      });
    }

    const session = await LearningSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Learning session not found.' });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for completed sessions. Please mark the session complete first.'
      });
    }

    // Verify current user was a participant in this session
    const isParticipant = session.participants.some(
      p => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not an authorized participant in this learning session.'
      });
    }

    // Identify the recipient of this feedback (the other participant)
    const recipientId = session.participants.find(
      p => p.toString() !== req.user._id.toString()
    );

    // Check duplicate feedback
    const alreadySubmitted = await Feedback.findOne({
      session: session._id,
      fromUser: req.user._id
    });

    if (alreadySubmitted) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this session.'
      });
    }

    const pointsCalc = calculatePointsAwarded(Number(rating));

    const feedbackDoc = await Feedback.create({
      session: session._id,
      exchangeRequest: session.exchangeRequest,
      fromUser: req.user._id,
      toUser: recipientId,
      rating: Number(rating),
      skillTaughtOrLearned: session.skillName || session.topic,
      comment: comment.trim(),
      criteriaRatings: criteriaRatings || { clarity: rating, punctuality: rating, helpfulness: rating },
      skillPointsAwarded: pointsCalc.total,
      pointsRuleBreakdown: pointsCalc.breakdown
    });

    // Mark user as having submitted feedback in the session
    session.feedbackSubmittedBy.push(req.user._id);
    await session.save();

    // Update recipient's Skill Points and re-average their rating
    const recipientUser = await User.findById(recipientId);
    if (recipientUser) {
      // Calculate updated rolling rating average
      const allRecipientFeedbacks = await Feedback.find({ toUser: recipientId });
      const totalRatings = allRecipientFeedbacks.reduce((sum, f) => sum + f.rating, 0);
      const newAverage = Number((totalRatings / allRecipientFeedbacks.length).toFixed(1));

      recipientUser.rating = newAverage;
      recipientUser.reviewCount = allRecipientFeedbacks.length;
      recipientUser.skillPoints += pointsCalc.total;
      await recipientUser.save();

      // Notify the recipient about the received feedback and skill points
      await Notification.create({
        recipient: recipientId,
        sender: req.user._id,
        type: 'points_awarded',
        title: `+${pointsCalc.total} Skill Points Earned! 🏆`,
        message: `${req.user.name} rated your session ${rating}★. "${pointsCalc.breakdown}"`,
        link: '/feedback.html'
      });
    }

    // Also award submitter participation points (+15 pts for being an active contributor)
    await User.findByIdAndUpdate(req.user._id, { $inc: { skillPoints: 15 } });

    res.status(201).json({
      success: true,
      message: `Feedback submitted successfully! You earned +15 points for reviewing, and awarded +${pointsCalc.total} points to your partner.`,
      feedback: feedbackDoc,
      pointsSummary: {
        awardedToPartner: pointsCalc.total,
        ruleApplied: pointsCalc.breakdown,
        bonusToReviewer: 15
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/feedback/user/:id?
 * @desc    Get all feedback received by a user
 * @access  Public / Private
 */
exports.getUserFeedback = async (req, res, next) => {
  try {
    const userId = req.params.id || (req.user && req.user._id);
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const reviews = await Feedback.find({ toUser: userId })
      .populate('fromUser', 'name avatar headline')
      .populate('session', 'topic skillName scheduledDate completedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/feedback/leaderboard
 * @desc    Get top collaborative learners by skill points
 * @access  Public
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const topUsers = await User.find({})
      .select('name avatar headline skillPoints rating reviewCount completedSessionsCount')
      .sort({ skillPoints: -1, rating: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      leaderboard: topUsers
    });
  } catch (err) {
    next(err);
  }
};
