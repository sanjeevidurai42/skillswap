const ContactMessage = require('../models/ContactMessage');

/**
 * @route   POST /api/contact
 * @desc    Submit a message via the About & Contact page
 * @access  Public
 */
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, category, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name, email, subject, and message.'
      });
    }

    const contact = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      category: category || 'General Inquiry',
      message: message.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Your message has been received and stored securely.',
      ticketId: contact._id
    });
  } catch (err) {
    next(err);
  }
};
