const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TeachSkillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'General' },
  proficiency: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  description: { type: String, default: '' }
}, { _id: true });

const LearnSkillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'General' },
  targetProficiency: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  goals: { type: String, default: '' }
}, { _id: true });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 80
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    minlength: 6,
    select: false // excluded by default from queries for security
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  headline: {
    type: String,
    default: 'SkillSwap Learner & Mentor',
    trim: true,
    maxlength: 120
  },
  bio: {
    type: String,
    default: 'Passionate about sharing knowledge and collaborative learning.',
    maxlength: 1000
  },
  teachSkills: [TeachSkillSchema],
  learnSkills: [LearnSkillSchema],
  availability: {
    type: [String],
    default: ['Weekdays (Evenings)', 'Weekends (Flexible)']
  },
  preferredFormat: {
    type: String,
    enum: ['online', 'in-person', 'both'],
    default: 'online'
  },
  location: {
    type: String,
    default: 'Campus / Remote',
    trim: true
  },
  skillPoints: {
    type: Number,
    default: 100,
    min: 0
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 1,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  completedSessionsCount: {
    type: Number,
    default: 0
  },
  oauthProvider: {
    type: String,
    enum: ['local', 'google', 'github', 'linkedin'],
    default: 'local'
  },
  oauthId: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isDemoUser: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexing for search performance
UserSchema.index({ name: 'text', headline: 'text', bio: 'text' });
UserSchema.index({ 'teachSkills.name': 1 });
UserSchema.index({ 'learnSkills.name': 1 });

// Hash password prior to saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  // Avoid double-hashing if password is already a bcrypt hash
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password verification method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Safe JSON serialization helper (removes sensitive data)
UserSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
