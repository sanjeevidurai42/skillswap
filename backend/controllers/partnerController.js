const User = require('../models/User');
const SkillExchangeRequest = require('../models/SkillExchangeRequest');
const recommendationService = require('../services/recommendationService');

/**
 * @route   GET /api/partners/recommendations
 * @desc    Get AI-ranked learning partner recommendations
 * @access  Private
 */
exports.getRecommendations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch candidate users (exclude current user)
    const candidates = await User.find({ _id: { $ne: currentUserId } })
      .select('name email avatar headline bio teachSkills learnSkills availability preferredFormat location skillPoints rating reviewCount')
      .lean();

    if (!candidates || candidates.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        recommendations: [],
        message: 'No candidates available yet.'
      });
    }

    // Call recommendation service (FastAPI or local heuristic fallback)
    const recResponse = await recommendationService.getRecommendations(
      currentUser.toObject ? currentUser.toObject() : currentUser,
      candidates
    );

    // Check existing exchange request statuses with each candidate
    const existingRequests = await SkillExchangeRequest.find({
      $or: [
        { sender: currentUserId, recipient: { $in: candidates.map(c => c._id) } },
        { recipient: currentUserId, sender: { $in: candidates.map(c => c._id) } }
      ]
    });

    const requestMap = {};
    existingRequests.forEach(reqDoc => {
      const otherId = reqDoc.sender.toString() === currentUserId.toString()
        ? reqDoc.recipient.toString()
        : reqDoc.sender.toString();
      requestMap[otherId] = {
        requestId: reqDoc._id,
        status: reqDoc.status,
        isOutgoing: reqDoc.sender.toString() === currentUserId.toString()
      };
    });

    // Enrich recommendations with relation status
    const enrichedRecs = (recResponse.recommendations || []).map(item => {
      const candId = item.candidateId;
      return {
        ...item,
        existingRequest: requestMap[candId] || null
      };
    });

    res.status(200).json({
      success: true,
      engine: recResponse.engine,
      weightsUsed: recResponse.weightsUsed,
      count: enrichedRecs.length,
      recommendations: enrichedRecs
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/partners/profile/:id
 * @desc    Get detailed public partner profile for modal/page
 * @access  Private
 */
exports.getPartnerDetails = async (req, res, next) => {
  try {
    const partner = await User.findById(req.params.id)
      .select('name avatar headline bio teachSkills learnSkills availability preferredFormat location skillPoints rating reviewCount completedSessionsCount');

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    // Check relationship status with current user
    const existingRequest = await SkillExchangeRequest.findOne({
      $or: [
        { sender: req.user._id, recipient: partner._id },
        { recipient: req.user._id, sender: partner._id }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      partner,
      existingRequest
    });
  } catch (err) {
    next(err);
  }
};
