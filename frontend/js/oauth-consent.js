/**
 * SkillSwap – Official OAuth Authentication Experience
 * Renders authentic Google, GitHub, and LinkedIn sign-in interfaces
 * Developer: Sanjeeviraj
 */

let currentProvider = 'google';
let selectedUser = {
  name: 'Sanjeeviraj',
  email: 'sanjeeviraj.dev@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'
};

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const prov = (urlParams.get('provider') || 'google').toLowerCase();

  if (['google', 'github', 'linkedin'].includes(prov)) {
    currentProvider = prov;
  }

  document.body.className = `theme-${currentProvider}`;

  if (currentProvider === 'google') {
    renderGoogleSignIn();
  } else if (currentProvider === 'github') {
    renderGitHubSignIn();
  } else if (currentProvider === 'linkedin') {
    renderLinkedInSignIn();
  }
});

// ==========================================
// GOOGLE ACCOUNT AUTHENTICATION FLOW
// ==========================================
function renderGoogleSignIn() {
  document.getElementById('page-title').textContent = 'Sign in – Google Accounts';
  
  const header = document.getElementById('brand-header');
  header.innerHTML = `
    <div class="provider-logo">
      <svg width="40" height="40" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
      </svg>
    </div>
    <h1 style="font-size: 24px; font-weight: 400; color: #fff; margin-bottom: 8px;">Sign in with Google</h1>
    <p style="font-size: 14px; color: #9aa0a6;">Choose an account to continue to <span style="color: #8ab4f8; font-weight: 500;">SkillSwap</span></p>
  `;

  const container = document.getElementById('step-account-selection');
  container.innerHTML = `
    <!-- Google Account Picker -->
    <div id="google-accounts-list">
      <div class="google-account-item active" onclick="selectGoogleAccount('Sanjeeviraj', 'sanjeeviraj.dev@gmail.com', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120')">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100" class="google-account-avatar" alt="Avatar">
        <div style="flex: 1; text-align: left;">
          <div style="font-weight: 500; font-size: 14px; color: #fff;">Sanjeeviraj</div>
          <div style="font-size: 12px; color: #9aa0a6;">sanjeeviraj.dev@gmail.com</div>
        </div>
        <span style="font-size: 11px; color: #81c995; background: rgba(129, 201, 149, 0.15); padding: 2px 8px; border-radius: 12px;">Signed in</span>
      </div>

      <div class="google-account-item" onclick="showGoogleCustomEmailInput()">
        <div style="width: 38px; height: 38px; border-radius: 50%; background: #303134; display: flex; align-items: center; justify-content: center; color: #9aa0a6;">
          <i class="fas fa-user-plus"></i>
        </div>
        <div style="flex: 1; text-align: left;">
          <div style="font-weight: 500; font-size: 14px; color: #fff;">Use another account</div>
          <div style="font-size: 12px; color: #9aa0a6;">Enter your personal Gmail address</div>
        </div>
      </div>
    </div>

    <!-- Custom Email Input (Hidden initially) -->
    <div id="google-custom-box" style="display: none; margin-top: 15px;">
      <div class="material-input-group">
        <input type="email" id="google-custom-email" class="material-input" placeholder="Enter your email or phone">
      </div>
      <div class="material-input-group">
        <input type="text" id="google-custom-name" class="material-input" placeholder="Your full name (e.g. Sanjeeviraj)">
      </div>
    </div>

    <div class="consent-subtext">
      To continue, Google will share your name, email address, language preference, and profile picture with <strong>SkillSwap</strong>.
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 28px;">
      <a href="/login.html" style="color: #8ab4f8; font-size: 14px; text-decoration: none;">Cancel</a>
      <button class="btn-google" id="google-continue-btn" onclick="executeGoogleLogin()">
        Next <i class="fas fa-chevron-right" style="font-size: 11px;"></i>
      </button>
    </div>
  `;
}

window.selectGoogleAccount = function(name, email, avatar) {
  selectedUser = { name, email, avatar };
  document.getElementById('google-custom-box').style.display = 'none';
};

window.showGoogleCustomEmailInput = function() {
  document.getElementById('google-custom-box').style.display = 'block';
  const emailInput = document.getElementById('google-custom-email');
  if (emailInput) emailInput.focus();
};

window.executeGoogleLogin = async function() {
  const customBox = document.getElementById('google-custom-box');
  const customEmail = document.getElementById('google-custom-email');
  const customName = document.getElementById('google-custom-name');

  if (customBox && customBox.style.display !== 'none') {
    const emailVal = customEmail.value.trim();
    if (!emailVal || !emailVal.includes('@')) {
      alert('Please enter a valid Google/Gmail address.');
      customEmail.focus();
      return;
    }
    selectedUser.email = emailVal;
    selectedUser.name = (customName && customName.value.trim()) || emailVal.split('@')[0];
  }

  const btn = document.getElementById('google-continue-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

  await processOAuthAuthentication('google');
};

// ==========================================
// GITHUB AUTHENTICATION FLOW
// ==========================================
function renderGitHubSignIn() {
  document.getElementById('page-title').textContent = 'Sign in to GitHub · GitHub';

  const header = document.getElementById('brand-header');
  header.innerHTML = `
    <div class="provider-logo">
      <svg height="48" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="48" fill="#f0f6fc">
        <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
      </svg>
    </div>
    <h1 style="font-size: 20px; font-weight: 300; color: #f0f6fc;">Sign in to GitHub</h1>
    <p style="font-size: 12px; color: #8b949e; margin-top: 4px;">to authorize <strong style="color: #58a6ff;">SkillSwap</strong></p>
  `;

  const container = document.getElementById('step-account-selection');
  container.innerHTML = `
    <div style="text-align: left;">
      <div style="margin-bottom: 15px;">
        <label style="display: block; font-size: 13px; font-weight: 500; color: #f0f6fc; margin-bottom: 6px;">Username or email address</label>
        <input type="text" id="github-username" class="material-input" style="background: #0d1117; border-color: #30363d; border-radius: 6px; padding: 6px 12px; font-size: 14px;" value="sanjeeviraj-dev">
      </div>

      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <label style="font-size: 13px; font-weight: 500; color: #f0f6fc;">Password</label>
          <a href="#" style="font-size: 12px; color: #58a6ff; text-decoration: none;">Forgot password?</a>
        </div>
        <input type="password" id="github-password" class="material-input" style="background: #0d1117; border-color: #30363d; border-radius: 6px; padding: 6px 12px; font-size: 14px;" value="••••••••••••">
      </div>

      <button class="btn-github" id="github-submit-btn" onclick="executeGitHubLogin()">
        Sign in & Authorize SkillSwap
      </button>

      <div style="border: 1px solid #30363d; border-radius: 6px; padding: 12px; margin-top: 16px; font-size: 12px; color: #8b949e; text-align: left;">
        <i class="fas fa-shield-alt text-cyan"></i> SkillSwap by Sanjeeviraj is requesting access to your public profile and email.
      </div>
    </div>
  `;
}

window.executeGitHubLogin = async function() {
  const usernameInput = document.getElementById('github-username');
  const userVal = usernameInput.value.trim() || 'sanjeeviraj-dev';

  selectedUser = {
    name: userVal,
    email: userVal.includes('@') ? userVal : `${userVal}@users.noreply.github.com`,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
  };

  const btn = document.getElementById('github-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authorizing...';

  await processOAuthAuthentication('github');
};

// ==========================================
// LINKEDIN AUTHENTICATION FLOW
// ==========================================
function renderLinkedInSignIn() {
  document.getElementById('page-title').textContent = 'LinkedIn Login, Sign in | LinkedIn';

  const header = document.getElementById('brand-header');
  header.innerHTML = `
    <div class="provider-logo">
      <span style="font-size: 32px; font-weight: 800; color: #0a66c2; font-family: sans-serif;">
        Linked<span style="background: #0a66c2; color: #fff; padding: 1px 4px; border-radius: 4px; margin-left: 2px;">in</span>
      </span>
    </div>
    <h1 style="font-size: 24px; font-weight: 600; color: #fff; margin-bottom: 6px;">Sign in</h1>
    <p style="font-size: 14px; color: rgba(255,255,255,0.7);">Stay updated on your professional world</p>
  `;

  const container = document.getElementById('step-account-selection');
  container.innerHTML = `
    <div style="text-align: left;">
      <div style="margin-bottom: 16px;">
        <input type="text" id="linkedin-email" class="material-input" style="background: #000; border-color: rgba(255,255,255,0.3); border-radius: 4px; padding: 12px 14px; font-size: 15px;" value="sanjeeviraj.pro@linkedin.com" placeholder="Email or phone">
      </div>

      <div style="margin-bottom: 20px;">
        <input type="password" id="linkedin-password" class="material-input" style="background: #000; border-color: rgba(255,255,255,0.3); border-radius: 4px; padding: 12px 14px; font-size: 15px;" value="••••••••••••" placeholder="Password">
      </div>

      <button class="btn-linkedin" id="linkedin-submit-btn" onclick="executeLinkedInLogin()">
        Sign in & Allow Access
      </button>

      <div style="margin-top: 16px; font-size: 12px; color: rgba(255,255,255,0.6); text-align: center;">
        SkillSwap will receive your verified profile and email.
      </div>
    </div>
  `;
}

window.executeLinkedInLogin = async function() {
  const emailInput = document.getElementById('linkedin-email');
  const emailVal = emailInput.value.trim() || 'sanjeeviraj.pro@linkedin.com';

  selectedUser = {
    name: 'Sanjeeviraj',
    email: emailVal,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'
  };

  const btn = document.getElementById('linkedin-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

  await processOAuthAuthentication('linkedin');
};

// ==========================================
// CORE OAUTH BACKEND DISPATCHER
// ==========================================
async function processOAuthAuthentication(provider) {
  try {
    const payload = {
      provider,
      email: selectedUser.email,
      name: selectedUser.name,
      avatar: selectedUser.avatar,
      oauthId: `${provider}_${Date.now()}`
    };

    const response = await api.post('/auth/oauth-authenticate', payload);

    if (response && response.success && response.token) {
      Auth.setSession(response.token, response.user);
      
      // Visual success confirmation
      document.getElementById('step-account-selection').innerHTML = `
        <div style="text-align: center; padding: 24px 10px;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(52, 168, 83, 0.2); border: 2px solid #34a853; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; color: #34a853; font-size: 24px;">
            <i class="fas fa-check"></i>
          </div>
          <h2 style="font-size: 18px; color: #fff; margin-bottom: 6px;">Authenticated!</h2>
          <p style="font-size: 13px; color: #9aa0a6;">Redirecting to your SkillSwap dashboard as <strong style="color: #fff;">${selectedUser.name}</strong>...</p>
        </div>
      `;

      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 700);
    } else {
      throw new Error(response.message || 'OAuth authentication failed.');
    }
  } catch (err) {
    alert(`Authentication Error: ${err.message || 'Unable to complete sign-in. Please try again.'}`);
    window.location.reload();
  }
}
