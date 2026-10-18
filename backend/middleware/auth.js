const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token = null;

  // 1. Check Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Check HTTP-only cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. Please log in.'
    });
  }

  // Handle prototype demo-user token fallback if requested
  if (token === 'demo-token-sanjeevi') {
    try {
      let demoUser = await User.findOne({ isDemoUser: true });
      if (!demoUser) {
        demoUser = await User.findOne();
      }
      if (demoUser) {
        req.user = demoUser;
        return next();
      }
    } catch (e) {
      // continue to JWT verification
    }
  }

  try {
    const secret = process.env.JWT_SECRET || 'skillswap_super_secret_jwt_key_2026_dev_mode';
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this session no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'skillswap_super_secret_jwt_key_2026_dev_mode';
    const decoded = jwt.verify(token, secret);
    req.user = await User.findById(decoded.id);
  } catch (err) {
    req.user = null;
  }
  next();
};

module.exports = { protect, optionalAuth };
