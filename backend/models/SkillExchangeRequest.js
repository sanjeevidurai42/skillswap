const mongoose = require('mongoose');

const SkillExchangeRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offeredSkill: {
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    proficiency: { type: String, default: 'intermediate' }
  },
  requestedSkill: {
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    targetProficiency: { type: String, default: 'intermediate' }
  },
  proposedSchedule: {
    type: String,
    default: 'Flexible'
  },
  preferredFormat: {
    type: String,
    enum: ['online', 'in-person', 'both'],
    default: 'online'
  },
  message: {
    type: String,
    required: [true, 'Please include a brief message explaining your exchange proposal'],
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  responseMessage: {
    type: String,
    default: ''
  },
  compatibilityScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

SkillExchangeRequestSchema.index({ sender: 1, recipient: 1, status: 1 });
SkillExchangeRequestSchema.index({ recipient: 1, status: 1 });

module.exports = mongoose.model('SkillExchangeRequest', SkillExchangeRequestSchema);
