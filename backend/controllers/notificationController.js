const Notification = require('../models/Notification');

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const filter = { recipient: req.user._id };

    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all user notifications as read
 * @access  Private
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    next(err);
  }
};
