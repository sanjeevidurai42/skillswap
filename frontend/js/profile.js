/**
 * SkillSwap - Profile Editor & Skills Manager
 * Developer: Sanjeeviraj
 */

let currentUserProfile = null;
let currentTeachSkills = [];
let currentLearnSkills = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;
  await loadFullProfile();
  setupProfileForm();
  setupAddSkillModal();
});

async function loadFullProfile() {
  try {
    const res = await api.get('/users/profile');
    if (res.success && res.user) {
      currentUserProfile = res.user;
      currentTeachSkills = [...(res.user.teachSkills || [])];
      currentLearnSkills = [...(res.user.learnSkills || [])];

      renderHero(res.user);
      populateForm(res.user);
      renderSkillsLists();
      renderFeedbackList(res.recentFeedback || []);
      renderHistoryStats(res.stats || {});
    }
  } catch (err) {
    showToast('Failed to load profile details: ' + err.message, 'error');
  }
}

function renderHero(user) {
  document.getElementById('prof-hero-avatar').src = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  document.getElementById('prof-hero-name').textContent = user.name;
  document.getElementById('prof-hero-headline').textContent = user.headline || 'SkillSwap Learner & Mentor';
  document.getElementById('prof-hero-loc-text').textContent = user.location || 'Campus / Remote';
  document.getElementById('prof-hero-points').textContent = user.skillPoints || 100;
  document.getElementById('prof-hero-format').textContent = `Format: ${(user.preferredFormat || 'online').toUpperCase()}`;
}

function populateForm(user) {
  document.getElementById('prof-name').value = user.name || '';
  document.getElementById('prof-avatar').value = user.avatar || '';
  document.getElementById('prof-headline').value = user.headline || '';
  document.getElementById('prof-bio').value = user.bio || '';
  document.getElementById('prof-format').value = user.preferredFormat || 'online';
  document.getElementById('prof-location').value = user.location || '';
}

function renderSkillsLists() {
  // Render Teach Skills
  const teachContainer = document.getElementById('teach-skills-list');
  if (currentTeachSkills.length === 0) {
    teachContainer.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted);">No teach skills added yet.</p>';
  } else {
    teachContainer.innerHTML = currentTeachSkills.map((s, idx) => `
      <div class="skill-manager-item">
        <div>
          <div class="flex items-center gap-1">
            <strong style="color: #fff; font-size: 0.95rem;">${s.name}</strong>
            <span class="badge badge-violet" style="font-size: 0.7rem;">${s.proficiency}</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
            ${s.category} &bull; ${s.description || 'No description provided'}
          </p>
        </div>
        <button type="button" onclick="removeSkill('teach', ${idx})" class="btn btn-sm btn-danger" title="Remove Skill">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
  }

  // Render Learn Skills
  const learnContainer = document.getElementById('learn-skills-list');
  if (currentLearnSkills.length === 0) {
    learnContainer.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted);">No learning goals added yet.</p>';
  } else {
    learnContainer.innerHTML = currentLearnSkills.map((s, idx) => `
      <div class="skill-manager-item">
        <div>
          <div class="flex items-center gap-1">
            <strong style="color: #fff; font-size: 0.95rem;">${s.name}</strong>
            <span class="badge badge-cyan" style="font-size: 0.7rem;">Goal: ${s.targetProficiency || 'intermediate'}</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
            ${s.category} &bull; ${s.goals || 'Expand skillset through collaboration'}
          </p>
        </div>
        <button type="button" onclick="removeSkill('learn', ${idx})" class="btn btn-sm btn-danger" title="Remove Goal">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
  }
}

window.removeSkill = function(type, index) {
  if (type === 'teach') {
    currentTeachSkills.splice(index, 1);
  } else {
    currentLearnSkills.splice(index, 1);
  }
  renderSkillsLists();
  showToast('Skill removed from draft. Click "Save Profile Changes" to commit.', 'info');
};

function renderFeedbackList(reviews) {
  const container = document.getElementById('prof-feedback-list');
  const countBadge = document.getElementById('prof-reviews-count');

  if (countBadge) countBadge.textContent = `${reviews.length} Reviews`;

  if (!reviews || reviews.length === 0) {
    container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1.5rem;">No reviews received yet. Complete sessions to build credibility!</p>';
    return;
  }

  container.innerHTML = reviews.map(r => `
    <div class="review-item-card">
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center gap-2">
          <img src="${r.fromUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" style="width: 34px; height: 34px; border-radius: 50%;" alt="${r.fromUser?.name}">
          <div>
            <strong style="color: #fff; font-size: 0.9rem;">${r.fromUser?.name || 'Peer Learner'}</strong>
            <div style="color: #f59e0b; font-size: 0.8rem;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
          </div>
        </div>
        <span class="badge badge-cyan">+${r.skillPointsAwarded} pts</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 6px;">"${r.comment}"</p>
      <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 4px;">Topic: ${r.skillTaughtOrLearned}</span>
    </div>
  `).join('');
}

function renderHistoryStats(stats) {
  const completedEl = document.getElementById('hist-completed');
  const pointsEl = document.getElementById('hist-points');
  if (completedEl) completedEl.textContent = stats.completedSessions || 0;
  if (pointsEl) pointsEl.textContent = `${stats.skillPoints || 100} pts`;
}

function setupProfileForm() {
  const form = document.getElementById('profile-update-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving to MongoDB...';

    const updates = {
      name: document.getElementById('prof-name').value.trim(),
      avatar: document.getElementById('prof-avatar').value.trim() || undefined,
      headline: document.getElementById('prof-headline').value.trim(),
      bio: document.getElementById('prof-bio').value.trim(),
      preferredFormat: document.getElementById('prof-format').value,
      location: document.getElementById('prof-location').value.trim(),
      teachSkills: currentTeachSkills,
      learnSkills: currentLearnSkills
    };

    try {
      const res = await api.put('/users/profile', updates);
      if (res.success && res.user) {
        showToast('Profile and skills updated successfully!', 'success');
        Auth.setSession(Auth.getToken(), res.user);
        renderHero(res.user);
      }
    } catch (err) {
      showToast(err.message || 'Error updating profile', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Save Profile Changes';
    }
  });
}

// Add Skill Modal Handler
window.openAddSkillModal = function(type) {
  document.getElementById('skill-type-flag').value = type;
  const title = document.getElementById('modal-skill-title');
  const descLabel = document.getElementById('modal-skill-desc-label');

  if (type === 'teach') {
    title.textContent = 'Add Skill You Can Teach';
    descLabel.textContent = 'Topic Description / What You Can Guide On';
  } else {
    title.textContent = 'Add Skill You Want to Learn';
    descLabel.textContent = 'Learning Goals / What You Wish to Master';
  }

  document.getElementById('modal-skill-name').value = '';
  document.getElementById('modal-skill-desc').value = '';
  openModal('add-skill-modal');
};

function setupAddSkillModal() {
  const form = document.getElementById('add-skill-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('skill-type-flag').value;
    const name = document.getElementById('modal-skill-name').value.trim();
    const category = document.getElementById('modal-skill-category').value;
    const level = document.getElementById('modal-skill-level').value;
    const desc = document.getElementById('modal-skill-desc').value.trim();

    if (!name) return;

    if (type === 'teach') {
      currentTeachSkills.push({
        name,
        category,
        proficiency: level,
        description: desc
      });
    } else {
      currentLearnSkills.push({
        name,
        category,
        targetProficiency: level,
        goals: desc
      });
    }

    renderSkillsLists();
    closeModal('add-skill-modal');
    showToast(`Added "${name}". Click "Save Profile Changes" to update database.`, 'info');
  });
}
