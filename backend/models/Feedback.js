const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningSession',
    required: true
  },
  exchangeRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillExchangeRequest'
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  skillTaughtOrLearned: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: [true, 'Please provide constructive feedback or review notes'],
    trim: true,
    maxlength: 1000
  },
  criteriaRatings: {
    clarity: { type: Number, min: 1, max: 5, default: 5 },
    punctuality: { type: Number, min: 1, max: 5, default: 5 },
    helpfulness: { type: Number, min: 1, max: 5, default: 5 }
  },
  skillPointsAwarded: {
    type: Number,
    default: 50
  },
  pointsRuleBreakdown: {
    type: String,
    default: 'Base Completion (+30 pts) + High Quality Rating Bonus (+20 pts)'
  }
}, {
  timestamps: true
});

// Ensure only one feedback per user per session (prevents duplicate feedback)
FeedbackSchema.index({ session: 1, fromUser: 1 }, { unique: true });
FeedbackSchema.index({ toUser: 1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
