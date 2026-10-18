const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'request_received',
      'request_accepted',
      'request_rejected',
      'session_scheduled',
      'session_reminder',
      'session_completed',
      'feedback_received',
      'points_awarded',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 120
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  link: {
    type: String,
    default: '/dashboard.html'
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
