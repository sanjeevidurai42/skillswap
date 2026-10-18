/**
 * SkillSwap - Authentication Page Interactions & OAuth Handlers
 * Developer: Sanjeeviraj
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect straight to dashboard
  if (Auth.isLoggedIn()) {
    window.location.href = '/dashboard.html';
    return;
  }

  // Check URL hash for direct tab navigation (e.g. login.html#register)
  if (window.location.hash === '#register') {
    switchAuthTab('register');
  }

  // Check if redirected from OAuth notice
  const urlParams = new URLSearchParams(window.location.search);
  const oauthNotice = urlParams.get('oauth_notice');
  if (oauthNotice) {
    showOAuthNotice(oauthNotice);
  }

  setupFormListeners();
});

function switchAuthTab(tab) {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('login-form');
  const formRegister = document.getElementById('register-form');
  const heading = document.getElementById('auth-heading');
  const subheading = document.getElementById('auth-subheading');
  const errorBox = document.getElementById('auth-error');

  errorBox.style.display = 'none';

  if (tab === 'register') {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.style.display = 'block';
    formLogin.style.display = 'none';
    heading.textContent = 'Create an Account';
    subheading.textContent = 'Join the peer-to-peer collaborative skill network';
    window.location.hash = '#register';
  } else {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.style.display = 'block';
    formRegister.style.display = 'none';
    heading.textContent = 'Welcome Back';
    subheading.textContent = 'Log in to access your SkillSwap learning dashboard';
    window.location.hash = '#login';
  }
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const eye = document.getElementById(`${inputId}-eye`);
  if (!input || !eye) return;

  if (input.type === 'password') {
    input.type = 'text';
    eye.className = 'far fa-eye-slash text-cyan';
  } else {
    input.type = 'password';
    eye.className = 'far fa-eye';
  }
}

function showAuthError(message) {
  const errorBox = document.getElementById('auth-error');
  if (errorBox) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
  }
}

function setupFormListeners() {
  // Login Form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const submitBtn = document.getElementById('login-submit-btn');

      if (!email || !password) {
        showAuthError('Please fill in both email and password.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

      try {
        const res = await api.post('/auth/login', { email, password });
        if (res.success && res.token) {
          Auth.setSession(res.token, res.user);
          showToast('Login successful! Redirecting to Dashboard...', 'success');
          handleRedirect();
        }
      } catch (err) {
        showAuthError(err.message || 'Login failed. Please check credentials.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In to Account';
      }
    });
  }

  // Register Form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm').value;
      const submitBtn = document.getElementById('reg-submit-btn');

      if (password !== confirmPassword) {
        showAuthError('Passwords do not match. Please verify.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

      try {
        const res = await api.post('/auth/register', { name, email, password, confirmPassword });
        if (res.success && res.token) {
          Auth.setSession(res.token, res.user);
          showToast('Welcome to SkillSwap! Redirecting...', 'success');
          handleRedirect();
        }
      } catch (err) {
        showAuthError(err.message || 'Registration failed.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Complete Registration';
      }
    });
  }
}

window.autoFillCredentials = function(email, password) {
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  if (emailInput && passInput) {
    emailInput.value = email;
    passInput.value = password;
    showToast('Credentials filled! Click "Sign In to Account" or hit Enter.', 'info');
  }
};

// 1-Click Demo Logins for Lab Review
async function loginAsDemo(role) {
  try {
    showToast(`Signing in with demo persona: ${role}...`, 'info');
    const res = await api.post('/auth/demo-login', { role });
    if (res.success && res.token) {
      Auth.setSession(res.token, res.user);
      showToast(`Logged in as ${res.user.name}`, 'success');
      handleRedirect();
    }
  } catch (err) {
    showAuthError(`Demo login error: ${err.message}. Please ensure MongoDB seed has run.`);
  }
}

function handleRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  const redirect = urlParams.get('redirect') || '/dashboard.html';
  setTimeout(() => {
    window.location.href = redirect;
  }, 800);
}

function showOAuthNotice(provider) {
  showToast(`Prototype Note: Live OAuth credentials for ${provider.replace('_demo', '').toUpperCase()} are not yet configured in backend .env. Demonstrating with built-in authenticated test persona.`, 'info');
}
