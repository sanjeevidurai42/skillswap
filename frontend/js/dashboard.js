/**
 * SkillSwap - User Dashboard Controller & Live Data Loader
 * Developer: Sanjeeviraj
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check if returning from OAuth provider callback
  const urlParams = new URLSearchParams(window.location.search);
  const oauthToken = urlParams.get('token');
  const oauthUser = urlParams.get('user');
  if (oauthToken && oauthUser) {
    try {
      Auth.setSession(oauthToken, JSON.parse(decodeURIComponent(oauthUser)));
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  }

  if (!Auth.requireAuth()) return;

  const user = Auth.getUser();
  populateUserHeader(user);

  await Promise.all([
    loadDashboardStats(),
    loadUserProfileDetails(),
    loadRecommendedPartners(),
    loadPendingRequests(),
    loadUpcomingSessions()
  ]);
});

function populateUserHeader(user) {
  if (!user) return;
  const avatar = document.getElementById('dash-avatar');
  const greeting = document.getElementById('dash-greeting');
  const headline = document.getElementById('dash-headline');

  if (avatar) avatar.src = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  if (greeting) greeting.textContent = `Welcome back, ${user.name}!`;
  if (headline) headline.textContent = user.headline || 'Peer Learner & Knowledge Sharer';
}

async function loadDashboardStats() {
  try {
    const res = await api.get('/users/dashboard-stats');
    if (res.success && res.stats) {
      const s = res.stats;
      animateCounter(document.getElementById('metric-points'), s.skillPoints || 100);
      animateCounter(document.getElementById('metric-upcoming'), s.upcomingSessions || 0);
      animateCounter(document.getElementById('metric-requests'), s.pendingRequests || 0);

      const ratingEl = document.getElementById('metric-rating');
      const reviewEl = document.getElementById('metric-reviews');
      if (ratingEl) ratingEl.textContent = `${(s.rating || 5.0).toFixed(1)}★`;
      if (reviewEl) reviewEl.textContent = `${s.reviewCount || 0} Reviews`;
    }
  } catch (err) {
    console.warn('Dashboard stats error:', err);
  }
}

async function loadUserProfileDetails() {
  try {
    const res = await api.get('/users/profile');
    if (res.success && res.user) {
      const u = res.user;

      // Render Teach Skills
      const teachContainer = document.getElementById('dash-teach-skills');
      if (teachContainer) {
        if (!u.teachSkills || u.teachSkills.length === 0) {
          teachContainer.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">No teach skills listed yet. <a href="/profile.html">Add some!</a></span>';
        } else {
          teachContainer.innerHTML = u.teachSkills.map(s => `
            <span class="badge badge-violet" title="${s.description || ''}">
              <i class="fas fa-check"></i> ${s.name} (${s.proficiency})
            </span>
          `).join('');
        }
      }

      // Render Learn Skills
      const learnContainer = document.getElementById('dash-learn-skills');
      if (learnContainer) {
        if (!u.learnSkills || u.learnSkills.length === 0) {
          learnContainer.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">No learning goals listed yet. <a href="/profile.html">Add goals!</a></span>';
        } else {
          learnContainer.innerHTML = u.learnSkills.map(s => `
            <span class="badge badge-cyan" title="${s.goals || ''}">
              <i class="fas fa-arrow-up"></i> ${s.name}
            </span>
          `).join('');
        }
      }
    }
  } catch (err) {
    console.warn('Profile details load error:', err);
  }
}

async function loadRecommendedPartners() {
  const container = document.getElementById('dash-partners-list');
  if (!container) return;

  try {
    const res = await api.get('/partners/recommendations');
    if (res.success && res.recommendations && res.recommendations.length > 0) {
      const top3 = res.recommendations.slice(0, 3);
      container.innerHTML = top3.map(item => {
        const c = item.candidate;
        return `
          <div class="partner-mini-card">
            <div class="flex items-center gap-2">
              <img src="${c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" alt="${c.name}">
              <div>
                <div class="flex items-center gap-1">
                  <h4 style="font-size: 0.95rem;">${c.name}</h4>
                  <span class="match-score-badge" style="padding: 0.15rem 0.5rem; font-size: 0.75rem;">
                    <i class="fas fa-bolt"></i> ${item.compatibilityScore}%
                  </span>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                  ${item.summaryReason || 'Complementary skill exchange partner'}
                </p>
              </div>
            </div>
            <a href="/partners.html?highlight=${c._id}" class="btn btn-sm btn-primary">Connect</a>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.9rem;">
          <p>Complete your teach and learn skills profile to activate AI matching!</p>
          <a href="/profile.html" class="btn btn-sm btn-outline-violet mt-1">Configure Profile</a>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Recommendations loading unavailable.</p>';
  }
}

async function loadUpcomingSessions() {
  const container = document.getElementById('dash-sessions-list');
  if (!container) return;

  try {
    const res = await api.get('/sessions/upcoming');
    if (res.success && res.sessions && res.sessions.length > 0) {
      container.innerHTML = res.sessions.slice(0, 2).map(s => {
        const sessionDate = new Date(s.scheduledDate).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const currentUser = Auth.getUser();
        const partner = s.host._id === currentUser._id ? s.partner : s.host;

        return `
          <div class="session-mini-item">
            <i class="fas fa-video text-cyan" style="font-size: 1.25rem; margin-top: 2px;"></i>
            <div style="flex: 1;">
              <h4 style="font-size: 0.95rem; color: #fff;">${s.topic}</h4>
              <p style="font-size: 0.8rem; color: var(--secondary-cyan); margin-top: 2px;">
                <i class="far fa-calendar-alt"></i> ${sessionDate} (${s.durationMinutes} mins)
              </p>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                With: <strong>${partner?.name || 'Peer'}</strong> &bull; Format: ${s.format}
              </p>
            </div>
            <a href="/sessions.html" class="btn btn-sm btn-secondary">Details</a>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 1.25rem; color: var(--text-muted); font-size: 0.875rem;">
          <p>No upcoming sessions scheduled.</p>
          <a href="/sessions.html" class="btn btn-sm btn-outline-violet mt-1">Schedule Now</a>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = '<p style="color: var(--text-muted);">Session loader error.</p>';
  }
}

async function loadPendingRequests() {
  const container = document.getElementById('dash-requests-list');
  if (!container) return;

  try {
    const res = await api.get('/requests/incoming');
    if (res.success && res.requests && res.requests.length > 0) {
      const pending = res.requests.filter(r => r.status === 'pending');
      if (pending.length > 0) {
        container.innerHTML = pending.slice(0, 2).map(r => `
          <div style="background: rgba(15, 18, 29, 0.7); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.75rem;">
            <div class="flex items-center justify-between mb-1">
              <strong style="font-size: 0.9rem; color: #fff;">${r.sender.name}</strong>
              <span class="badge badge-warning">Pending</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary);">
              Offers <em>${r.offeredSkill.name}</em> for <em>${r.requestedSkill.name}</em>
            </p>
            <div class="flex gap-1 mt-2">
              <button onclick="quickAcceptRequest('${r._id}')" class="btn btn-sm btn-success" style="flex: 1; padding: 0.35rem;">Accept</button>
              <a href="/requests.html" class="btn btn-sm btn-secondary" style="flex: 1; padding: 0.35rem; text-align: center;">Review</a>
            </div>
          </div>
        `).join('');
      } else {
        container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 0.5rem;">No incoming pending requests.</p>';
      }
    } else {
      container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 0.5rem;">No incoming pending requests.</p>';
    }
  } catch (err) {
    container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted);">Could not load requests.</p>';
  }
}

window.quickAcceptRequest = async function(requestId) {
  try {
    const res = await api.put(`/requests/${requestId}/accept`, {
      responseMessage: 'Accepted! Looking forward to our collaborative learning session.'
    });
    if (res.success) {
      showToast('Exchange request accepted! You can now schedule a session.', 'success');
      loadPendingRequests();
      loadDashboardStats();
    }
  } catch (err) {
    showToast(err.message || 'Error accepting request', 'error');
  }
};
