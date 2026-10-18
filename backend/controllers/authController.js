const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper to sign JWT
const signToken = (id) => {
  const secret = process.env.JWT_SECRET || 'skillswap_super_secret_jwt_key_2026_dev_mode';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id }, secret, { expiresIn });
};

// Send token via HTTP-only cookie and JSON response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res.status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: user.toSafeObject ? user.toSafeObject() : user
    });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Default starter skills for new users
    const defaultTeach = [
      { name: 'Python Programming', category: 'Programming & Systems', proficiency: 'intermediate', description: 'Core Python, data structures, and script automation.' }
    ];
    const defaultLearn = [
      { name: 'Web Development', category: 'Web & App Development', targetProficiency: 'intermediate', goals: 'Learn modern full-stack web development.' }
    ];

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      teachSkills: defaultTeach,
      learnSkills: defaultLearn,
      skillPoints: 100 // Welcome bonus
    });

    // Create welcome notification
    await Notification.create({
      recipient: user._id,
      type: 'system',
      title: 'Welcome to SkillSwap!',
      message: 'Your account is ready. Complete your profile and discover your first learning partner!',
      link: '/profile.html'
    });

    sendTokenResponse(user, 201, res, 'Account created successfully!');
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Log in with email & password
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your campus email (or name) and password.'
      });
    }

    const cleanInput = email.toLowerCase().trim();
    // Find by email or exact name (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: cleanInput },
        { name: new RegExp(`^${cleanInput}$`, 'i') }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found. Try sanjeeviraj@skillswap.edu with password Password123! or click a Demo account button below.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Note that password is case-sensitive (default: Password123!).'
      });
    }

    sendTokenResponse(user, 200, res, 'Logged in successfully!');
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/auth/demo-login
 * @desc    Instantly authenticate with a pre-configured demo account
 * @access  Public
 */
exports.demoLogin = async (req, res, next) => {
  try {
    const roleType = req.body.role || 'mentor'; // 'mentor' (Sanjeeviraj) or 'learner' (Alex)
    let user;

    if (roleType === 'mentor') {
      user = await User.findOne({ email: 'sanjeeviraj@skillswap.edu' });
    } else {
      user = await User.findOne({ email: 'priya.sharma@skillswap.edu' });
    }

    if (!user) {
      // Fallback to any existing user
      user = await User.findOne();
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No demo users found in database. Please run npm run seed first.'
      });
    }

    sendTokenResponse(user, 200, res, `Demo session started as ${user.name}`);
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      user: user.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Log out and clear session cookie
 * @access  Public
 */
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * @route   GET /api/auth/oauth-status
 * @desc    Check configuration status for Google, GitHub, LinkedIn OAuth
 * @access  Public
 */
exports.getOAuthStatus = (req, res) => {
  const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here');
  const hasGitHub = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your_github_client_id_here');
  const hasLinkedIn = Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_ID !== 'your_linkedin_client_id_here');

  res.status(200).json({
    success: true,
    providers: {
      google: { configured: hasGoogle, name: 'Google Workspace' },
      github: { configured: hasGitHub, name: 'GitHub Developer' },
      linkedin: { configured: hasLinkedIn, name: 'LinkedIn OAuth 2.0' }
    },
    demoModeActive: (!hasGoogle || !hasGitHub || !hasLinkedIn)
  });
};

/**
 * @route   POST /api/auth/oauth-authenticate
 * @desc    Process OAuth login (Google, GitHub, LinkedIn)
 * @access  Public
 */
exports.oauthAuthenticate = async (req, res, next) => {
  try {
    const { provider, email, name, avatar, oauthId } = req.body;

    if (!provider || !email) {
      return res.status(400).json({
        success: false,
        message: 'Provider and email are required for OAuth authentication.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Look up existing user by email
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Create new user authenticated via OAuth provider
      const defaultTeach = [
        { name: 'Python Programming', category: 'Programming & Systems', proficiency: 'intermediate', description: 'Core Python, data structures, and script automation.' }
      ];
      const defaultLearn = [
        { name: 'Full-Stack Web Development', category: 'Web & App Development', targetProficiency: 'intermediate', goals: 'Master full-stack web applications.' }
      ];

      user = await User.create({
        name: name || `${provider.toUpperCase()} Learner`,
        email: cleanEmail,
        avatar: avatar || (provider === 'github'
          ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
          : provider === 'linkedin'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
            : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
        headline: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Verified Learner`,
        oauthProvider: provider,
        oauthId: oauthId || `${provider}_${Date.now()}`,
        teachSkills: defaultTeach,
        learnSkills: defaultLearn,
        skillPoints: 120 // OAuth onboarding bonus
      });

      await Notification.create({
        recipient: user._id,
        type: 'system',
        title: `Welcome from ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`,
        message: `Successfully connected your ${provider} account to SkillSwap. Your profile is ready!`,
        link: '/profile.html'
      });
    } else {
      // Connect provider if not set
      if (user.oauthProvider === 'local') {
        user.oauthProvider = provider;
        user.oauthId = oauthId || `${provider}_${Date.now()}`;
        if (avatar && (!user.avatar || user.avatar.includes('placeholder'))) {
          user.avatar = avatar;
        }
        await user.save();
      }
    }

    sendTokenResponse(user, 200, res, `Successfully authenticated via ${provider}!`);
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle official Google OAuth 2.0 redirect callback
 * @access  Public
 */
exports.handleGoogleCallback = async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error || !code) {
      return res.redirect('/login.html?error=google_auth_canceled');
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.redirect('/login.html?error=google_token_failed');
    }

    // Retrieve Google profile information
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileResponse.json();

    const cleanEmail = (profile.email || '').toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      user = await User.create({
        name: profile.name || 'Google Learner',
        email: cleanEmail,
        avatar: profile.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        headline: 'Google Verified Learner',
        oauthProvider: 'google',
        oauthId: profile.id,
        skillPoints: 120
      });
    }

    const token = signToken(user._id);
    const safeUser = user.toSafeObject ? user.toSafeObject() : user;
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
    return res.redirect(`/dashboard.html?token=${token}&user=${encodeURIComponent(JSON.stringify(safeUser))}`);
  } catch (err) {
    return res.redirect('/login.html?error=google_failed');
  }
};

/**
 * @route   GET /api/auth/github/callback
 * @desc    Handle official GitHub OAuth redirect callback
 * @access  Public
 */
exports.handleGitHubCallback = async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error || !code) {
      return res.redirect('/login.html?error=github_auth_canceled');
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.redirect('/login.html?error=github_token_failed');
    }

    // Retrieve GitHub user profile
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'SkillSwap-Platform'
      }
    });
    const profile = await profileResponse.json();

    // Get email
    let userEmail = profile.email;
    if (!userEmail) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'SkillSwap-Platform'
        }
      });
      const emails = await emailRes.json();
      if (Array.isArray(emails) && emails.length > 0) {
        const primary = emails.find(e => e.primary) || emails[0];
        userEmail = primary.email;
      }
    }

    const cleanEmail = (userEmail || `${profile.login}@users.noreply.github.com`).toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      user = await User.create({
        name: profile.name || profile.login || 'GitHub Developer',
        email: cleanEmail,
        avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        headline: profile.bio || 'GitHub Open Source Developer',
        oauthProvider: 'github',
        oauthId: String(profile.id),
        skillPoints: 120
      });
    }

    const token = signToken(user._id);
    const safeUser = user.toSafeObject ? user.toSafeObject() : user;
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
    return res.redirect(`/dashboard.html?token=${token}&user=${encodeURIComponent(JSON.stringify(safeUser))}`);
  } catch (err) {
    return res.redirect('/login.html?error=github_failed');
  }
};

/**
 * @route   GET /api/auth/linkedin/callback
 * @desc    Handle official LinkedIn OAuth redirect callback
 * @access  Public
 */
exports.handleLinkedInCallback = async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error || !code) {
      return res.redirect('/login.html?error=linkedin_auth_canceled');
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:5000/api/auth/linkedin/callback'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.redirect('/login.html?error=linkedin_token_failed');
    }

    // Get user info (OpenID Connect userinfo endpoint)
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileResponse.json();

    const cleanEmail = (profile.email || `${profile.sub}@linkedin.com`).toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      user = await User.create({
        name: profile.name || 'LinkedIn Professional',
        email: cleanEmail,
        avatar: profile.picture || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        headline: 'LinkedIn Verified Member',
        oauthProvider: 'linkedin',
        oauthId: profile.sub,
        skillPoints: 120
      });
    }

    const token = signToken(user._id);
    const safeUser = user.toSafeObject ? user.toSafeObject() : user;
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
    return res.redirect(`/dashboard.html?token=${token}&user=${encodeURIComponent(JSON.stringify(safeUser))}`);
  } catch (err) {
    return res.redirect('/login.html?error=linkedin_failed');
  }
};

