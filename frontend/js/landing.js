/**
 * SkillSwap - Landing Page Interactions & Dynamic Data
 * Developer: Sanjeeviraj
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Animate stat counters
  setTimeout(() => {
    animateCounter(document.getElementById('stat-learners'), 540, 1500);
    animateCounter(document.getElementById('stat-skills'), 125, 1400);
    animateCounter(document.getElementById('stat-sessions'), 1450, 1800);
  }, 400);

  // Load featured skills
  loadFeaturedSkills();
});

async function loadFeaturedSkills() {
  const container = document.getElementById('landing-skills-grid');
  if (!container) return;

  try {
    const res = await api.get('/skills/featured');
    if (res.success && res.skills && res.skills.length > 0) {
      container.innerHTML = res.skills.map((skill, index) => `
        <div class="skill-card reveal-on-scroll delay-${(index % 4) + 1}">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="badge ${index % 2 === 0 ? 'badge-violet' : 'badge-cyan'}">${skill.category}</span>
              <i class="${skill.icon || 'fas fa-code'} ${index % 2 === 0 ? 'text-cyan' : 'text-violet'}" style="font-size: 1.5rem;"></i>
            </div>
            <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem;">${skill.name}</h3>
            <p style="font-size: 0.9rem;">${skill.description || 'Master this domain through hands-on collaborative study sessions.'}</p>
          </div>
          <div class="flex items-center justify-between mt-3" style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
            <span style="font-size: 0.85rem; color: var(--text-cyan);"><i class="fas fa-chart-line"></i> Popularity: ${skill.popularityScore}%</span>
            <a href="/explore.html?q=${encodeURIComponent(skill.name)}" class="btn btn-sm btn-outline-violet">Explore</a>
          </div>
        </div>
      `).join('');
      initScrollReveal();
    }
  } catch (e) {
    // Keep initial clean fallback HTML
  }
}

// 1-Click quick demo access for evaluators
window.demoLoginQuick = async function() {
  try {
    showToast('Starting instant demo session...', 'info');
    const res = await api.post('/auth/demo-login', { role: 'mentor' });
    if (res.success && res.token) {
      Auth.setSession(res.token, res.user);
      showToast(`Welcome back, ${res.user.name}! Redirecting to Dashboard...`, 'success');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
    }
  } catch (err) {
    showToast('Demo login fallback: Navigating to authentication page', 'info');
    window.location.href = '/login.html';
  }
};
