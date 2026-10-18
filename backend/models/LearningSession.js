const mongoose = require('mongoose');

const LearningSessionSchema = new mongoose.Schema({
  exchangeRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillExchangeRequest'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: [true, 'Session topic is required'],
    trim: true,
    maxlength: 120
  },
  skillName: {
    type: String,
    required: true,
    trim: true
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date and time is required']
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 60,
    min: 15,
    max: 240
  },
  format: {
    type: String,
    enum: ['online', 'in-person'],
    default: 'online'
  },
  meetingLinkOrLocation: {
    type: String,
    default: 'Online Session Room (SkillSwap Collaborative Space)'
  },
  notes: {
    type: String,
    default: '',
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  summary: {
    type: String,
    default: '',
    maxlength: 1500
  },
  feedbackSubmittedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

LearningSessionSchema.index({ participants: 1, scheduledDate: 1 });
LearningSessionSchema.index({ status: 1 });

module.exports = mongoose.model('LearningSession', LearningSessionSchema);
