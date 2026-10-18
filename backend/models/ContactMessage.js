const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Your name is required'],
    trim: true,
    maxlength: 80
  },
  email: {
    type: String,
    required: [true, 'Your email address is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: 150
  },
  category: {
    type: String,
    enum: ['General Inquiry', 'Feedback & Suggestions', 'Bug Report', 'Collaboration', 'Academic Project'],
    default: 'General Inquiry'
  },
  message: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['unread', 'reviewed', 'resolved'],
    default: 'unread'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
