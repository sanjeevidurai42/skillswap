const LearningSession = require('../models/LearningSession');
const SkillExchangeRequest = require('../models/SkillExchangeRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * @route   POST /api/sessions
 * @desc    Schedule a new learning session
 * @access  Private
 */
exports.scheduleSession = async (req, res, next) => {
  try {
    const {
      partnerId,
      requestId,
      topic,
      skillName,
      scheduledDate,
      durationMinutes,
      format,
      meetingLinkOrLocation,
      notes
    } = req.body;

    if (!partnerId || !topic || !skillName || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide partnerId, topic, skillName, and scheduledDate.'
      });
    }

    const partner = await User.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner user not found.' });
    }

    const session = await LearningSession.create({
      exchangeRequest: requestId || null,
      participants: [req.user._id, partner._id],
      host: req.user._id,
      partner: partner._id,
      topic,
      skillName,
      scheduledDate: new Date(scheduledDate),
      durationMinutes: durationMinutes || 60,
      format: format || 'online',
      meetingLinkOrLocation: meetingLinkOrLocation || (format === 'in-person' ? 'Campus Student Center Room 204' : 'SkillSwap Interactive Study Room #412'),
      notes: notes || ''
    });

    // Notify partner
    await Notification.create({
      recipient: partner._id,
      sender: req.user._id,
      type: 'session_scheduled',
      title: 'New Session Scheduled 📅',
      message: `${req.user.name} scheduled a learning session on "${topic}" for ${new Date(scheduledDate).toLocaleDateString()}.`,
      link: '/sessions.html'
    });

    res.status(201).json({
      success: true,
      message: 'Learning session scheduled successfully!',
      session
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/sessions/upcoming
 * @desc    Get upcoming scheduled sessions for logged in user
 * @access  Private
 */
exports.getUpcomingSessions = async (req, res, next) => {
  try {
    const sessions = await LearningSession.find({
      participants: req.user._id,
      status: 'scheduled'
    })
      .populate('host partner', 'name email avatar headline')
      .sort({ scheduledDate: 1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/sessions/past
 * @desc    Get past completed sessions for logged in user
 * @access  Private
 */
exports.getPastSessions = async (req, res, next) => {
  try {
    const sessions = await LearningSession.find({
      participants: req.user._id,
      status: 'completed'
    })
      .populate('host partner', 'name email avatar headline')
      .sort({ completedAt: -1, scheduledDate: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/sessions/:id/complete
 * @desc    Mark a session as completed and add summary
 * @access  Private
 */
exports.completeSession = async (req, res, next) => {
  try {
    const session = await LearningSession.findOne({
      _id: req.params.id,
      participants: req.user._id,
      status: 'scheduled'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled session not found or already completed.'
      });
    }

    session.status = 'completed';
    session.completedAt = new Date();
    if (req.body.summary) {
      session.summary = req.body.summary;
    }
    await session.save();

    // Increment completed counts on both user profiles
    await User.updateMany(
      { _id: { $in: session.participants } },
      { $inc: { completedSessionsCount: 1 } }
    );

    // Notify the other participant to leave feedback and receive skill points
    const otherParticipantId = session.participants.find(
      p => p.toString() !== req.user._id.toString()
    );

    if (otherParticipantId) {
      await Notification.create({
        recipient: otherParticipantId,
        sender: req.user._id,
        type: 'session_completed',
        title: 'Session Completed! 🌟',
        message: `Your session on "${session.topic}" was marked complete. Leave feedback now to earn +50 Skill Points!`,
        link: '/feedback.html'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session marked as completed! You can now rate your experience and award skill points.',
      session
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/sessions/:id/cancel
 * @desc    Cancel a scheduled session
 * @access  Private
 */
exports.cancelSession = async (req, res, next) => {
  try {
    const session = await LearningSession.findOne({
      _id: req.params.id,
      participants: req.user._id,
      status: 'scheduled'
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Scheduled session not found.' });
    }

    session.status = 'cancelled';
    await session.save();

    const otherParticipantId = session.participants.find(
      p => p.toString() !== req.user._id.toString()
    );

    if (otherParticipantId) {
      await Notification.create({
        recipient: otherParticipantId,
        sender: req.user._id,
        type: 'system',
        title: 'Session Cancelled',
        message: `${req.user.name} cancelled the scheduled session on "${session.topic}".`,
        link: '/sessions.html'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session has been cancelled.',
      session
    });
  } catch (err) {
    next(err);
  }
};
