/**
 * SkillSwap - AI Controller
 * Developer: Sanjeeviraj
 */

const User = require('../models/User');
const geminiService = require('../services/geminiService');

/**
 * @route   POST /api/ai/study-plan/:partnerId
 * @desc    Generate a custom 4-week reciprocal learning roadmap with a matched partner
 * @access  Private
 */
exports.generateStudyPlan = async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    const currentUser = await User.findById(req.user._id);
    const partnerUser = await User.findById(partnerId);

    if (!currentUser || !partnerUser) {
      return res.status(404).json({ success: false, message: 'User or partner not found.' });
    }

    const studyPlan = await geminiService.generateStudyPlan(currentUser, partnerUser);

    res.status(200).json({
      success: true,
      studyPlan,
      partner: {
        id: partnerUser._id,
        name: partnerUser.name,
        avatar: partnerUser.avatar,
        headline: partnerUser.headline
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/ai/match-explanation/:partnerId
 * @desc    Generate deep AI match explanation with a partner
 * @access  Private
 */
exports.generateMatchExplanation = async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    const currentUser = await User.findById(req.user._id);
    const partnerUser = await User.findById(partnerId);

    if (!currentUser || !partnerUser) {
      return res.status(404).json({ success: false, message: 'User or partner not found.' });
    }

    const explanation = await geminiService.generateMatchExplanation(currentUser, partnerUser);

    res.status(200).json({
      success: true,
      explanation
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/ai/draft-proposal
 * @desc    Draft an invitation message for a skill exchange request
 * @access  Private
 */
exports.draftProposal = async (req, res, next) => {
  try {
    const { recipientId, teachSkill, learnSkill } = req.body;
    const currentUser = await User.findById(req.user._id);
    const recipientUser = recipientId ? await User.findById(recipientId) : { name: 'Fellow Learner' };

    const draft = await geminiService.draftProposalMessage(
      currentUser,
      recipientUser,
      teachSkill,
      learnSkill
    );

    res.status(200).json({
      success: true,
      draft
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/ai/chat
 * @desc    Interactive SkillSwap Copilot Chat
 * @access  Private
 */
exports.chatCopilot = async (req, res, next) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const currentUser = await User.findById(req.user._id);
    const reply = await geminiService.chatAdvisor(message.trim(), conversationHistory || [], currentUser);

    res.status(200).json({
      success: true,
      reply
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/ai/status
 * @desc    Check Gemini AI engine health and model status
 * @access  Public
 */
exports.getStatus = (req, res) => {
  res.status(200).json({
    success: true,
    engine: 'Google Gemini Generative AI',
    model: geminiService.MODEL,
    status: 'operational',
    poweredBy: 'Google AI Studio & Sanjeeviraj'
  });
};
