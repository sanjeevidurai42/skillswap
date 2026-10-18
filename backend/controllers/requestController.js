const SkillExchangeRequest = require('../models/SkillExchangeRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * @route   POST /api/requests
 * @desc    Send a new skill exchange request
 * @access  Private
 */
exports.sendRequest = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { recipientId, offeredSkill, requestedSkill, proposedSchedule, preferredFormat, message } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient user ID is required.' });
    }

    if (senderId.toString() === recipientId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot initiate a skill exchange with yourself.' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient user not found.' });
    }

    // Check if an active pending/accepted request already exists between these users
    const existing = await SkillExchangeRequest.findOne({
      $or: [
        { sender: senderId, recipient: recipientId, status: { $in: ['pending', 'accepted'] } },
        { sender: recipientId, recipient: senderId, status: { $in: ['pending', 'accepted'] } }
      ]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An active exchange request is already ${existing.status} between you and this user.`
      });
    }

    const exchangeRequest = await SkillExchangeRequest.create({
      sender: senderId,
      recipient: recipientId,
      offeredSkill: offeredSkill || { name: 'General Knowledge Sharing' },
      requestedSkill: requestedSkill || { name: 'Collaborative Learning' },
      proposedSchedule: proposedSchedule || 'Flexible',
      preferredFormat: preferredFormat || 'online',
      message: message || `Hi ${recipient.name}, I would love to exchange skills with you on SkillSwap!`
    });

    // Notify recipient
    await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type: 'request_received',
      title: 'New Skill Exchange Request!',
      message: `${req.user.name} sent you a request to exchange "${offeredSkill?.name || 'skills'}" for "${requestedSkill?.name || 'knowledge'}".`,
      link: '/requests.html'
    });

    res.status(201).json({
      success: true,
      message: 'Skill exchange request sent successfully!',
      request: exchangeRequest
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/requests/incoming
 * @desc    Get all requests sent to the current user
 * @access  Private
 */
exports.getIncomingRequests = async (req, res, next) => {
  try {
    const requests = await SkillExchangeRequest.find({ recipient: req.user._id })
      .populate('sender', 'name email avatar headline bio rating reviewCount location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/requests/outgoing
 * @desc    Get all requests sent by current user
 * @access  Private
 */
exports.getOutgoingRequests = async (req, res, next) => {
  try {
    const requests = await SkillExchangeRequest.find({ sender: req.user._id })
      .populate('recipient', 'name email avatar headline bio rating reviewCount location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/requests/:id/accept
 * @desc    Accept an incoming exchange request
 * @access  Private
 */
exports.acceptRequest = async (req, res, next) => {
  try {
    const request = await SkillExchangeRequest.findOne({
      _id: req.params.id,
      recipient: req.user._id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Pending request not found or you are not authorized to accept it.'
      });
    }

    request.status = 'accepted';
    request.responseMessage = req.body.responseMessage || 'Looking forward to our skill exchange session!';
    await request.save();

    // Notify sender that proposal was accepted
    await Notification.create({
      recipient: request.sender,
      sender: req.user._id,
      type: 'request_accepted',
      title: 'Skill Exchange Accepted! 🎉',
      message: `${req.user.name} accepted your skill exchange proposal for ${request.requestedSkill.name}! Schedule your first session now.`,
      link: '/sessions.html'
    });

    res.status(200).json({
      success: true,
      message: 'Skill exchange request accepted! You can now schedule learning sessions.',
      request
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/requests/:id/reject
 * @desc    Decline an incoming exchange request
 * @access  Private
 */
exports.rejectRequest = async (req, res, next) => {
  try {
    const request = await SkillExchangeRequest.findOne({
      _id: req.params.id,
      recipient: req.user._id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Pending request not found.' });
    }

    request.status = 'rejected';
    request.responseMessage = req.body.responseMessage || 'Thank you for your interest, but I am unable to accept at this time.';
    await request.save();

    // Notify sender
    await Notification.create({
      recipient: request.sender,
      sender: req.user._id,
      type: 'request_rejected',
      title: 'Exchange Request Update',
      message: `${req.user.name} was unable to accept your skill exchange request at this time.`,
      link: '/requests.html'
    });

    res.status(200).json({
      success: true,
      message: 'Request declined.',
      request
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/requests/:id/cancel
 * @desc    Cancel an outgoing exchange request
 * @access  Private
 */
exports.cancelRequest = async (req, res, next) => {
  try {
    const request = await SkillExchangeRequest.findOne({
      _id: req.params.id,
      sender: req.user._id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Pending outgoing request not found.' });
    }

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Exchange request cancelled.',
      request
    });
  } catch (err) {
    next(err);
  }
};
