/**
 * SkillSwap - Feedback & Skill Points Page Controller
 * Developer: Sanjeeviraj
 */

let selectedRating = 5;

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;

  setupStarPicker();
  setupFeedbackForm();

  await Promise.all([
    loadEligibleSessions(),
    loadLeaderboard(),
    loadMyReviews()
  ]);
});

function setupStarPicker() {
  const container = document.getElementById('star-picker');
  if (!container) return;

  const stars = container.querySelectorAll('i');

  function updateStars(val) {
    stars.forEach(s => {
      const starVal = parseInt(s.dataset.val, 10);
      if (starVal <= val) {
        s.className = 'fas fa-star active';
      } else {
        s.className = 'far fa-star';
      }
    });
    document.getElementById('fb-rating-val').value = val;
    selectedRating = val;
  }

  // Initial 5 stars
  updateStars(5);

  stars.forEach(s => {
    s.addEventListener('click', () => {
      const val = parseInt(s.dataset.val, 10);
      updateStars(val);
    });
    s.addEventListener('mouseenter', () => {
      const val = parseInt(s.dataset.val, 10);
      updateStars(val);
    });
  });
}

async function loadEligibleSessions() {
  const select = document.getElementById('fb-session-select');
  if (!select) return;

  const urlParams = new URLSearchParams(window.location.search);
  const targetSessionId = urlParams.get('sessionId');

  try {
    const res = await api.get('/sessions/past');
    select.innerHTML = '<option value="">-- Choose Completed Session --</option>';

    if (res.success && res.sessions && res.sessions.length > 0) {
      const currentUser = Auth.getUser();
      res.sessions.forEach(s => {
        // Find partner
        const partner = (s.host?._id === currentUser?._id) ? s.partner : s.host;
        const opt = document.createElement('option');
        opt.value = s._id;
        opt.textContent = `${s.topic} (with ${partner?.name || 'Peer'})`;
        if (targetSessionId && s._id === targetSessionId) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    } else {
      select.innerHTML = '<option value="">No completed sessions found to review.</option>';
    }
  } catch (err) {
    select.innerHTML = '<option value="">Error loading sessions</option>';
  }
}

function setupFeedbackForm() {
  const form = document.getElementById('feedback-submission-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sessionId = document.getElementById('fb-session-select').value;
    const rating = selectedRating;
    const comment = document.getElementById('fb-comment-input').value.trim();
    const clarity = parseInt(document.getElementById('crit-clarity').value, 10);
    const punctuality = parseInt(document.getElementById('crit-punctuality').value, 10);
    const helpfulness = parseInt(document.getElementById('crit-helpfulness').value, 10);

    if (!sessionId) {
      showToast('Please select a completed session to review.', 'error');
      return;
    }

    const btn = document.getElementById('fb-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting Review...';

    try {
      const res = await api.post('/feedback', {
        sessionId,
        rating,
        comment,
        criteriaRatings: { clarity, punctuality, helpfulness }
      });

      if (res.success) {
        showToast(res.message || 'Feedback submitted and skill points awarded!', 'success');
        document.getElementById('fb-comment-input').value = '';
        await Promise.all([loadEligibleSessions(), loadLeaderboard(), loadMyReviews()]);
      }
    } catch (err) {
      showToast(err.message || 'Error submitting feedback', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Feedback & Award Points';
    }
  });
}

async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-list');
  if (!container) return;

  try {
    const res = await api.get('/feedback/leaderboard');
    if (res.success && res.leaderboard) {
      container.innerHTML = res.leaderboard.map((user, idx) => {
        let rankClass = '';
        if (idx === 0) rankClass = 'rank-1';
        else if (idx === 1) rankClass = 'rank-2';
        else if (idx === 2) rankClass = 'rank-3';

        return `
          <div class="leaderboard-row">
            <div class="flex items-center gap-2">
              <div class="rank-num ${rankClass}">${idx + 1}</div>
              <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}" style="width: 32px; height: 32px; border-radius: 50%;" alt="${user.name}">
              <div>
                <strong style="font-size: 0.9rem; color: #fff;">${user.name}</strong>
                <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">${user.headline || 'Peer Learner'}</span>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="badge badge-cyan" style="font-size: 0.75rem;">${user.skillPoints} pts</span>
              <span style="font-size: 0.75rem; color: #f59e0b; display: block; margin-top: 2px;">★ ${(user.rating || 5.0).toFixed(1)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Leaderboard loading unavailable.</p>';
  }
}

async function loadMyReviews() {
  const container = document.getElementById('my-reviews-list');
  if (!container) return;

  try {
    const user = Auth.getUser();
    const res = await api.get(`/feedback/user/${user._id}`);
    if (res.success && res.reviews && res.reviews.length > 0) {
      container.innerHTML = res.reviews.map(r => `
        <div style="background: rgba(15, 18, 29, 0.65); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.75rem;">
          <div class="flex items-center justify-between mb-1">
            <strong style="color: #fff; font-size: 0.875rem;">${r.fromUser?.name || 'Peer Reviewer'}</strong>
            <span style="color: #f59e0b; font-size: 0.8rem;">${'★'.repeat(r.rating)}</span>
          </div>
          <p style="font-size: 0.825rem; color: var(--text-secondary);">"${r.comment}"</p>
          <div class="flex items-center justify-between mt-2" style="font-size: 0.75rem; color: var(--text-muted);">
            <span>${r.pointsRuleBreakdown}</span>
            <span class="badge badge-success">+${r.skillPointsAwarded} pts</span>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1rem;">No reviews received yet.</p>';
    }
  } catch (err) {
    container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted);">Reviews loader error.</p>';
  }
}
