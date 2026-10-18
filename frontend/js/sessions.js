/**
 * SkillSwap - Learning Sessions Page Controller
 * Developer: Sanjeeviraj
 */

let activeSessionTab = 'upcoming';
let upcomingSessions = [];
let pastSessions = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;

  if (window.location.hash === '#schedule') {
    openScheduleModal();
  }

  await loadAllSessions();
  setupScheduleModalForm();
  setupCompleteModalForm();
});

async function loadAllSessions() {
  try {
    const [upRes, pastRes] = await Promise.all([
      api.get('/sessions/upcoming'),
      api.get('/sessions/past')
    ]);

    upcomingSessions = upRes.success ? upRes.sessions : [];
    pastSessions = pastRes.success ? pastRes.sessions : [];

    const upBadge = document.getElementById('upcoming-count-badge');
    const pastBadge = document.getElementById('past-count-badge');
    if (upBadge) upBadge.textContent = upcomingSessions.length;
    if (pastBadge) pastBadge.textContent = pastSessions.length;

    renderSessionsList();
  } catch (err) {
    showToast('Failed to load learning sessions: ' + err.message, 'error');
  }
}

function switchSessionTab(tab) {
  activeSessionTab = tab;
  const upBtn = document.getElementById('tab-upcoming-btn');
  const pastBtn = document.getElementById('tab-past-btn');

  if (tab === 'upcoming') {
    upBtn.classList.add('active');
    pastBtn.classList.remove('active');
  } else {
    pastBtn.classList.add('active');
    upBtn.classList.remove('active');
  }

  renderSessionsList();
}

function renderSessionsList() {
  const container = document.getElementById('sessions-container');
  if (!container) return;

  const list = activeSessionTab === 'upcoming' ? upcomingSessions : pastSessions;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-calendar-times"></i></div>
        <h3>No ${activeSessionTab} learning sessions</h3>
        <p style="color: var(--text-muted); max-width: 450px;">
          ${activeSessionTab === 'upcoming'
            ? 'Coordinate with your matched partners to schedule hands-on collaborative study sessions.'
            : 'You haven\'t completed any sessions yet. Once a session is held, mark it complete to earn skill points!'}
        </p>
        <button onclick="openScheduleModal()" class="btn btn-primary mt-2">
          <i class="fas fa-calendar-plus"></i> Schedule a Session
        </button>
      </div>
    `;
    return;
  }

  const currentUser = Auth.getUser();

  container.innerHTML = list.map((sess, index) => {
    const partner = (sess.host?._id === currentUser?._id) ? sess.partner : sess.host;
    const sessionDate = new Date(sess.scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let actionButtonsHtml = '';
    if (activeSessionTab === 'upcoming') {
      actionButtonsHtml = `
        <div class="flex gap-1" style="margin-left: auto;">
          <button onclick="openCompleteModal('${sess._id}')" class="btn btn-sm btn-success">
            <i class="fas fa-check"></i> Mark Complete
          </button>
          <button onclick="cancelSession('${sess._id}')" class="btn btn-sm btn-danger">
            <i class="fas fa-times"></i> Cancel
          </button>
        </div>
      `;
    } else {
      actionButtonsHtml = `
        <a href="/feedback.html?sessionId=${sess._id}" class="btn btn-sm btn-outline-violet" style="margin-left: auto;">
          <i class="fas fa-star"></i> Leave Feedback & Award Points
        </a>
      `;
    }

    return `
      <div class="session-card reveal-on-scroll delay-${(index % 3) + 1}">
        <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 0.75rem;">
          <div class="flex items-center gap-2">
            <img src="${partner?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" alt="${partner?.name}">
            <div>
              <h3 style="font-size: 1.15rem; color: #fff;">${sess.topic}</h3>
              <p style="font-size: 0.825rem; color: var(--secondary-cyan);">
                Partner: <strong>${partner?.name || 'Peer'}</strong> &bull; Skill: ${sess.skillName}
              </p>
            </div>
          </div>
          <span class="badge ${sess.status === 'completed' ? 'badge-success' : 'badge-cyan'}">
            ${sess.status.toUpperCase()}
          </span>
        </div>

        <div class="session-time-banner">
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; display: block;">Scheduled Date:</span>
            <strong style="color: #fff; font-size: 0.95rem;"><i class="far fa-calendar-alt text-cyan"></i> ${sessionDate}</strong>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; display: block;">Duration & Format:</span>
            <span style="color: var(--text-primary); font-size: 0.9rem;">${sess.durationMinutes} Minutes &bull; ${sess.format}</span>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; display: block;">Location / Room:</span>
            <span style="color: var(--secondary-cyan); font-size: 0.9rem;"><i class="fas fa-link"></i> ${sess.meetingLinkOrLocation}</span>
          </div>
        </div>

        ${sess.notes ? `
          <div style="background: rgba(15, 18, 29, 0.6); padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text-secondary);">
            <strong>Notes:</strong> ${sess.notes}
          </div>
        ` : ''}

        ${sess.summary ? `
          <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid var(--status-success); padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-size: 0.85rem; color: #e2e8f0;">
            <strong>Session Summary:</strong> ${sess.summary}
          </div>
        ` : ''}

        <div class="flex items-center" style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
          ${actionButtonsHtml}
        </div>
      </div>
    `;
  }).join('');

  initScrollReveal();
}

window.openScheduleModal = async function() {
  const partnerSelect = document.getElementById('sess-partner-select');
  partnerSelect.innerHTML = '<option value="">Loading partners...</option>';

  try {
    const res = await api.get('/partners/recommendations');
    partnerSelect.innerHTML = '<option value="">-- Select Learning Partner --</option>';

    if (res.success && res.recommendations) {
      res.recommendations.forEach(r => {
        const c = r.candidate;
        const opt = document.createElement('option');
        opt.value = c._id;
        opt.textContent = `${c.name} (${c.headline || 'Peer'})`;
        partnerSelect.appendChild(opt);
      });
    }
  } catch (err) {
    partnerSelect.innerHTML = '<option value="">Error loading partners</option>';
  }

  // Set default datetime to tomorrow at 6:00 PM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);
  const isoStr = tomorrow.toISOString().slice(0, 16);
  document.getElementById('sess-date-input').value = isoStr;

  openModal('schedule-session-modal');
};

function setupScheduleModalForm() {
  const form = document.getElementById('schedule-session-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const partnerId = document.getElementById('sess-partner-select').value;
    const topic = document.getElementById('sess-topic-input').value.trim();
    const skillName = document.getElementById('sess-skill-input').value.trim();
    const scheduledDate = document.getElementById('sess-date-input').value;
    const durationMinutes = parseInt(document.getElementById('sess-duration-select').value, 10);
    const format = document.getElementById('sess-format-select').value;
    const room = document.getElementById('sess-room-input').value.trim();
    const notes = document.getElementById('sess-notes-input').value.trim();

    if (!partnerId) {
      showToast('Please select a learning partner.', 'error');
      return;
    }

    try {
      const res = await api.post('/sessions', {
        partnerId,
        topic,
        skillName,
        scheduledDate,
        durationMinutes,
        format,
        meetingLinkOrLocation: room,
        notes
      });

      if (res.success) {
        closeModal('schedule-session-modal');
        showToast('Learning session scheduled successfully!', 'success');
        await loadAllSessions();
      }
    } catch (err) {
      showToast(err.message || 'Error scheduling session', 'error');
    }
  });
}

window.openCompleteModal = function(sessionId) {
  document.getElementById('complete-sess-id').value = sessionId;
  openModal('complete-modal');
};

function setupCompleteModalForm() {
  const form = document.getElementById('complete-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sessionId = document.getElementById('complete-sess-id').value;
    const summary = document.getElementById('complete-summary-input').value.trim();

    try {
      const res = await api.put(`/sessions/${sessionId}/complete`, { summary });
      if (res.success) {
        closeModal('complete-modal');
        showToast('Session marked as completed! Redirecting to review & points...', 'success');
        setTimeout(() => {
          window.location.href = `/feedback.html?sessionId=${sessionId}`;
        }, 1200);
      }
    } catch (err) {
      showToast(err.message || 'Error marking session complete', 'error');
    }
  });
}

window.cancelSession = async function(sessionId) {
  if (!confirm('Are you sure you want to cancel this scheduled session?')) return;
  try {
    const res = await api.put(`/sessions/${sessionId}/cancel`, {});
    if (res.success) {
      showToast('Session cancelled.', 'info');
      await loadAllSessions();
    }
  } catch (err) {
    showToast(err.message || 'Error cancelling session', 'error');
  }
};
