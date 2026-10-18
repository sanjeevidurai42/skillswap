const User = require('../models/User');
const SkillExchangeRequest = require('../models/SkillExchangeRequest');
const LearningSession = require('../models/LearningSession');
const Feedback = require('../models/Feedback');

/**
 * @route   GET /api/users/profile/:id?
 * @desc    Get user profile by ID or current logged in user
 * @access  Private / Public
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.params.id || (req.user && req.user._id);
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    // Fetch user feedback reviews
    const recentFeedback = await Feedback.find({ toUser: user._id })
      .populate('fromUser', 'name avatar headline')
      .sort({ createdAt: -1 })
      .limit(5);

    // Completed sessions count
    const completedCount = await LearningSession.countDocuments({
      participants: user._id,
      status: 'completed'
    });

    res.status(200).json({
      success: true,
      user: user.toSafeObject(),
      recentFeedback,
      stats: {
        completedSessions: completedCount,
        rating: user.rating,
        reviewCount: user.reviewCount,
        skillPoints: user.skillPoints
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile and skills
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name',
      'headline',
      'bio',
      'avatar',
      'availability',
      'preferredFormat',
      'location',
      'teachSkills',
      'learnSkills'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Validate skills arrays format if provided
    if (updates.teachSkills && !Array.isArray(updates.teachSkills)) {
      return res.status(400).json({ success: false, message: 'teachSkills must be an array' });
    }
    if (updates.learnSkills && !Array.isArray(updates.learnSkills)) {
      return res.status(400).json({ success: false, message: 'learnSkills must be an array' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/users/dashboard-stats
 * @desc    Aggregate user dashboard metrics
 * @access  Private
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      pendingRequestsCount,
      upcomingSessionsCount,
      completedSessionsCount,
      recentSessions,
      userDoc
    ] = await Promise.all([
      SkillExchangeRequest.countDocuments({ recipient: userId, status: 'pending' }),
      LearningSession.countDocuments({ participants: userId, status: 'scheduled' }),
      LearningSession.countDocuments({ participants: userId, status: 'completed' }),
      LearningSession.find({ participants: userId })
        .populate('host partner', 'name avatar')
        .sort({ scheduledDate: -1 })
        .limit(3),
      User.findById(userId).select('skillPoints rating reviewCount')
    ]);

    res.status(200).json({
      success: true,
      stats: {
        pendingRequests: pendingRequestsCount,
        upcomingSessions: upcomingSessionsCount,
        completedSessions: completedSessionsCount,
        skillPoints: userDoc ? userDoc.skillPoints : 100,
        rating: userDoc ? userDoc.rating : 5.0,
        reviewCount: userDoc ? userDoc.reviewCount : 0
      },
      recentSessions
    });
  } catch (err) {
    next(err);
  }
};
