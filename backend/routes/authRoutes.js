const express = require('express');
const router = express.Router();
const {
  register,
  login,
  demoLogin,
  getMe,
  logout,
  getOAuthStatus,
  oauthAuthenticate,
  handleGoogleCallback,
  handleGitHubCallback,
  handleLinkedInCallback
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', protect, getMe);
router.post('/logout', logout);
router.get('/oauth-status', getOAuthStatus);
router.post('/oauth-authenticate', oauthAuthenticate);

// OAuth Callbacks for Live Provider Authorization
router.get('/google/callback', handleGoogleCallback);
router.get('/github/callback', handleGitHubCallback);
router.get('/linkedin/callback', handleLinkedInCallback);

// OAuth Initiation Endpoints (Connects to Live Provider or Prototype Sandbox Consent)
router.get('/google', (req, res) => {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here') {
    const scope = encodeURIComponent('openid profile email');
    const redirectUri = encodeURIComponent(process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback');
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`);
  }
  // Open Interactive Prototype Google OAuth Consent Screen
  res.redirect('/oauth-consent.html?provider=google');
});

router.get('/github', (req, res) => {
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your_github_client_id_here') {
    const redirectUri = encodeURIComponent(process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback');
    return res.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`);
  }
  // Open Interactive Prototype GitHub OAuth Consent Screen
  res.redirect('/oauth-consent.html?provider=github');
});

router.get('/linkedin', (req, res) => {
  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_ID !== 'your_linkedin_client_id_here') {
    const redirectUri = encodeURIComponent(process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:5000/api/auth/linkedin/callback');
    return res.redirect(`https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&scope=openid%20profile%20email`);
  }
  // Open Interactive Prototype LinkedIn OAuth Consent Screen
  res.redirect('/oauth-consent.html?provider=linkedin');
});

module.exports = router;
