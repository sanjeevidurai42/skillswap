const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    unique: true,
    trim: true,
    maxlength: 60
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Web & App Development',
      'Data Science & AI',
      'UI/UX & Design',
      'Programming & Systems',
      'Languages & Communication',
      'Business & Career',
      'Mathematics & Science',
      'Other'
    ],
    default: 'Web & App Development'
  },
  description: {
    type: String,
    default: '',
    maxlength: 500
  },
  icon: {
    type: String,
    default: 'fas fa-code'
  },
  tags: {
    type: [String],
    default: []
  },
  featured: {
    type: Boolean,
    default: false
  },
  popularityScore: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

SkillSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Skill', SkillSchema);
