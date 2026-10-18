/**
 * SkillSwap - Shared Navbar & Footer Component Injector
 * Developer: Sanjeeviraj
 */

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar();
  renderFooter();
  setupNavbarScrollEffect();

  if (Auth.isLoggedIn()) {
    updateNotificationBadge();
    loadAiCopilotScript();
  }
});

function renderNavbar() {
  const mount = document.getElementById('navbar-mount') || document.body.firstElementChild;
  const currentPath = window.location.pathname;

  const user = Auth.getUser();
  const isLoggedIn = Boolean(user);

  const navLinks = [
    { title: 'Home', url: '/index.html', icon: 'fas fa-home' },
    { title: 'Explore Skills', url: '/explore.html', icon: 'fas fa-compass' },
    { title: 'Find Partner', url: '/partners.html', icon: 'fas fa-user-friends' },
    { title: 'About', url: '/about.html', icon: 'fas fa-info-circle' }
  ];

  if (isLoggedIn) {
    navLinks.splice(3, 0,
      { title: 'Dashboard', url: '/dashboard.html', icon: 'fas fa-th-large' },
      { title: 'Requests', url: '/requests.html', icon: 'fas fa-exchange-alt' },
      { title: 'Sessions', url: '/sessions.html', icon: 'fas fa-calendar-alt' },
      { title: 'Feedback', url: '/feedback.html', icon: 'fas fa-star' }
    );
  }

  const linksHtml = navLinks.map(link => {
    const isActive = currentPath.endsWith(link.url) || (currentPath === '/' && link.url === '/index.html');
    return `<li><a href="${link.url}" class="nav-link ${isActive ? 'active' : ''}">${link.title}</a></li>`;
  }).join('');

  const mobileLinksHtml = navLinks.map(link => {
    return `<a href="${link.url}" class="mobile-nav-link"><i class="${link.icon}"></i> ${link.title}</a>`;
  }).join('');

  let userActionHtml = '';
  if (isLoggedIn) {
    userActionHtml = `
      <a href="/notifications.html" class="notification-btn" title="Notifications">
        <i class="fas fa-bell"></i>
        <span class="notification-badge" id="nav-notif-badge" style="display: none;">0</span>
      </a>
      <div class="user-menu-pill" onclick="window.location.href='/profile.html'" title="View Profile">
        <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" alt="${user.name}">
        <span>${user.name}</span>
      </div>
      <button onclick="Auth.logout()" class="btn btn-sm btn-secondary" title="Log Out" style="padding: 0.45rem 0.65rem;">
        <i class="fas fa-sign-out-alt"></i>
      </button>
    `;
  } else {
    userActionHtml = `
      <a href="/login.html" class="btn btn-sm btn-secondary">Log In</a>
      <a href="/login.html#register" class="btn btn-sm btn-primary">Get Started</a>
    `;
  }

  const navbarHtml = `
    <nav class="navbar" id="main-nav">
      <div class="container nav-container">
        <a href="/index.html" class="brand-logo">
          <div class="brand-icon">
            <i class="fas fa-sync-alt"></i>
          </div>
          <div class="brand-text">Skill<span>Swap</span></div>
        </a>

        <ul class="nav-links">
          ${linksHtml}
        </ul>

        <div class="nav-actions">
          ${userActionHtml}
          <button class="mobile-toggle" id="mobile-toggle-btn" aria-label="Toggle Navigation">
            <i class="fas fa-bars"></i>
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile Drawer -->
    <div class="mobile-drawer" id="mobile-drawer">
      ${mobileLinksHtml}
      ${isLoggedIn ? `
        <a href="/profile.html" class="mobile-nav-link"><i class="fas fa-id-badge"></i> My Profile</a>
        <a href="/notifications.html" class="mobile-nav-link"><i class="fas fa-bell"></i> Notifications</a>
        <button onclick="Auth.logout()" class="btn btn-danger w-full mt-2"><i class="fas fa-sign-out-alt"></i> Log Out</button>
      ` : `
        <div class="flex gap-2 mt-2">
          <a href="/login.html" class="btn btn-secondary w-full">Log In</a>
          <a href="/login.html#register" class="btn btn-primary w-full">Get Started</a>
        </div>
      `}
    </div>
  `;

  if (document.getElementById('navbar-mount')) {
    document.getElementById('navbar-mount').innerHTML = navbarHtml;
  } else {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = navbarHtml;
    document.body.insertBefore(tempDiv, document.body.firstChild);
  }

  // Bind mobile toggle
  const toggleBtn = document.getElementById('mobile-toggle-btn');
  const drawer = document.getElementById('mobile-drawer');
  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => {
      drawer.classList.toggle('open');
      const isOpen = drawer.classList.contains('open');
      toggleBtn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
  }
}

function renderFooter() {
  const mount = document.getElementById('footer-mount');
  const footerHtml = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="/index.html" class="brand-logo">
              <div class="brand-icon"><i class="fas fa-sync-alt"></i></div>
              <div class="brand-text">Skill<span>Swap</span></div>
            </a>
            <p>A Peer-to-Peer Skill Exchange and Collaborative Learning Platform Powered by Hybrid AI Recommendation Techniques.</p>
            <div class="mt-2">
              <span class="developer-credit">
                <i class="fas fa-code"></i> Developed by <strong>Sanjeeviraj</strong>
              </span>
            </div>
          </div>

          <div class="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="/explore.html">Explore Skills</a></li>
              <li><a href="/partners.html">Find Learning Partners</a></li>
              <li><a href="/dashboard.html">User Dashboard</a></li>
              <li><a href="/sessions.html">Learning Sessions</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Technology</h4>
            <ul>
              <li><a href="/about.html#architecture">Hybrid Recommender</a></li>
              <li><a href="/about.html#architecture">TF-IDF & Cosine Match</a></li>
              <li><a href="/about.html#architecture">FastAPI & Express.js</a></li>
              <li><a href="/about.html#architecture">MongoDB & Mongoose</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="/about.html">About Project</a></li>
              <li><a href="/about.html#contact">Contact & Feedback</a></li>
              <li><a href="/about.html#faq">FAQ & Guidelines</a></li>
              <li><a href="/login.html">Demo Access</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <div>&copy; 2026 SkillSwap Prototype Development Lab. All rights reserved.</div>
          <div>Built with HTML5, CSS3, Vanilla JS, Express.js, MongoDB & Python FastAPI</div>
        </div>
      </div>
    </footer>
  `;

  if (mount) {
    mount.innerHTML = footerHtml;
  } else {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = footerHtml;
    document.body.appendChild(tempDiv);
  }
}

function setupNavbarScrollEffect() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });
}

async function updateNotificationBadge() {
  try {
    const res = await api.get('/notifications?unreadOnly=true');
    const badge = document.getElementById('nav-notif-badge');
    if (badge && res.unreadCount > 0) {
      badge.textContent = res.unreadCount > 9 ? '9+' : res.unreadCount;
      badge.style.display = 'flex';
    } else if (badge) {
      badge.style.display = 'none';
    }
  } catch (e) {}
}

function loadAiCopilotScript() {
  if (document.getElementById('ai-copilot-script')) return;
  const script = document.createElement('script');
  script.id = 'ai-copilot-script';
  script.src = '/js/ai-copilot.js';
  document.body.appendChild(script);
}
