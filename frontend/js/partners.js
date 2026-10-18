/**
 * SkillSwap - Intelligent Partner Matching Controller
 * Developer: Sanjeeviraj
 */

let allRecommendations = [];
let activeTargetCandidate = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;
  await loadPartnerRecommendations();
  setupProposalForm();
});

async function loadPartnerRecommendations() {
  const container = document.getElementById('partners-grid-container');
  const engineBadge = document.getElementById('recommender-engine-badge');

  try {
    const res = await api.get('/partners/recommendations');

    if (res.success && res.recommendations) {
      allRecommendations = res.recommendations;

      if (engineBadge) {
        if (res.engine === 'python_fastapi_hybrid') {
          engineBadge.innerHTML = '<i class="fas fa-microchip text-cyan"></i> Python FastAPI Hybrid Engine (TF-IDF + Cosine)';
        } else {
          engineBadge.innerHTML = '<i class="fas fa-check-circle text-violet"></i> Heuristic Reciprocal Matcher Active';
        }
      }

      applyPartnerFilter();
    }
  } catch (err) {
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon"><i class="fas fa-exclamation-circle"></i></div>
          <h3>Unable to fetch partner recommendations</h3>
          <p style="color: var(--text-muted);">${err.message || 'Please verify backend and database connection.'}</p>
        </div>
      `;
    }
  }
}

function applyPartnerFilter() {
  const minScore = parseInt(document.getElementById('min-score-filter').value, 10) || 0;
  const formatPref = document.getElementById('format-pref-filter').value;
  const container = document.getElementById('partners-grid-container');
  const countBadge = document.getElementById('partner-count-badge');

  const filtered = allRecommendations.filter(item => {
    if (item.compatibilityScore < minScore) return false;
    if (formatPref !== 'all') {
      const candFormat = (item.candidate.preferredFormat || 'both').toLowerCase();
      if (candFormat !== 'both' && candFormat !== formatPref) return false;
    }
    return true;
  });

  if (countBadge) countBadge.textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon"><i class="fas fa-user-slash"></i></div>
        <h3>No matching partners above ${minScore}% score</h3>
        <p style="color: var(--text-muted); max-width: 450px;">
          Try lowering the minimum match threshold or adjusting your learning preferences in your profile.
        </p>
        <button onclick="document.getElementById('min-score-filter').value='0'; applyPartnerFilter();" class="btn btn-secondary mt-2">
          Show All Candidates
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((item, index) => {
    const c = item.candidate;
    const b = item.breakdown || { skillScore: 80, textScore: 70, availabilityScore: 85, preferenceScore: 100 };
    const teachSkillsHtml = (c.teachSkills || []).map(s => `
      <span class="badge badge-violet" style="font-size: 0.75rem;" title="${s.description || ''}">
        ${s.name} (${s.proficiency})
      </span>
    `).join('');

    const learnSkillsHtml = (c.learnSkills || []).map(s => `
      <span class="badge badge-cyan" style="font-size: 0.75rem;" title="${s.goals || ''}">
        ${s.name}
      </span>
    `).join('');

    // Check existing request status
    let actionBtnHtml = `
      <button onclick="openSendProposalModal('${item.candidateId}')" class="btn btn-sm btn-primary" style="flex: 1;">
        <i class="fas fa-paper-plane"></i> Exchange Request
      </button>
    `;
    if (item.existingRequest) {
      if (item.existingRequest.status === 'pending') {
        actionBtnHtml = `<span class="badge badge-warning" style="flex: 1; justify-content: center; padding: 0.5rem;"><i class="fas fa-clock"></i> Request Pending</span>`;
      } else if (item.existingRequest.status === 'accepted') {
        actionBtnHtml = `<a href="/sessions.html" class="btn btn-sm btn-success" style="flex: 1;"><i class="fas fa-calendar-alt"></i> Schedule Session</a>`;
      }
    }

    return `
      <div class="partner-card reveal-on-scroll delay-${(index % 3) + 1}" id="pcard-${c._id}">
        <div>
          <!-- Absolute Match Score Badge -->
          <div class="score-chip-absolute">
            <span class="match-score-badge">
              <i class="fas fa-sparkles"></i> ${item.compatibilityScore}% Match
            </span>
          </div>

          <!-- Avatar & Header -->
          <div class="flex items-center gap-2 mb-2" style="max-width: 75%;">
            <img src="${c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-violet);" alt="${c.name}">
            <div>
              <h3 style="font-size: 1.15rem; color: #fff;">${c.name}</h3>
              <p style="font-size: 0.8rem; color: var(--secondary-cyan);">${c.headline || 'Peer Learner'}</p>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                <i class="fas fa-star text-warning" style="color: #f59e0b;"></i> ${(c.rating || 5.0).toFixed(1)} (${c.reviewCount || 0} reviews) &bull; ${c.skillPoints || 100} pts
              </div>
            </div>
          </div>

          <!-- Explanation Rationale -->
          <div class="rationale-quote-box">
            <i class="fas fa-info-circle text-violet"></i> <strong>Match Reason:</strong> ${item.summaryReason || 'Complementary skills and matching study schedule.'}
          </div>

          <!-- Multi-Signal Breakdown Meter -->
          <div class="match-breakdown-bar">
            <div>
              <div class="score-metric-val">${b.skillScore}%</div>
              <div class="score-metric-sub">Skill (50%)</div>
            </div>
            <div>
              <div class="score-metric-val">${b.textScore}%</div>
              <div class="score-metric-sub">Text (25%)</div>
            </div>
            <div>
              <div class="score-metric-val">${b.availabilityScore}%</div>
              <div class="score-metric-sub">Schedule (15%)</div>
            </div>
            <div>
              <div class="score-metric-val">${b.preferenceScore}%</div>
              <div class="score-metric-sub">Format (10%)</div>
            </div>
          </div>

          <!-- Skills Off & Want -->
          <div style="margin-bottom: 0.75rem;">
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">They Can Teach:</span>
            <div class="flex gap-1" style="flex-wrap: wrap;">${teachSkillsHtml || '<span style="font-size: 0.8rem; color: var(--text-muted);">Not listed</span>'}</div>
          </div>

          <div style="margin-bottom: 1.25rem;">
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">They Want to Learn:</span>
            <div class="flex gap-1" style="flex-wrap: wrap;">${learnSkillsHtml || '<span style="font-size: 0.8rem; color: var(--text-muted);">Not listed</span>'}</div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem;" class="flex gap-1">
          <button onclick="viewPartnerQuickProfile('${c._id}')" class="btn btn-sm btn-secondary" title="View Full Bio & Feedback">
            <i class="fas fa-user"></i> Profile
          </button>
          <button onclick="openAiStudyPlan('${c._id}')" class="btn btn-sm btn-outline-violet" title="Generate 4-Week AI Roadmap with Gemini">
            <i class="fas fa-magic"></i> AI Roadmap
          </button>
          ${actionBtnHtml}
          <button onclick="dismissPartnerCard('pcard-${c._id}')" class="btn btn-sm btn-secondary" title="Dismiss Recommendation" style="padding: 0.45rem 0.65rem; color: var(--text-muted);">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  initScrollReveal();
}

window.dismissPartnerCard = function(elementId) {
  const card = document.getElementById(elementId);
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    setTimeout(() => {
      card.remove();
      showToast('Recommendation dismissed for this session.', 'info');
    }, 250);
  }
};

window.viewPartnerQuickProfile = function(partnerId) {
  const item = allRecommendations.find(r => r.candidateId === partnerId || r.candidate._id === partnerId);
  if (!item) return;

  const c = item.candidate;
  document.getElementById('pmodal-name').textContent = `${c.name} – Learning Profile`;

  const body = document.getElementById('pmodal-body');
  body.innerHTML = `
    <div class="flex items-center gap-2 mb-3">
      <img src="${c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}" style="width: 64px; height: 64px; border-radius: 50%;" alt="${c.name}">
      <div>
        <h4 style="color: #fff; font-size: 1.15rem;">${c.name}</h4>
        <p style="color: var(--secondary-cyan); font-size: 0.9rem;">${c.headline || 'Peer Learner'}</p>
        <span class="badge badge-violet"><i class="fas fa-map-marker-alt"></i> ${c.location || 'Campus / Online'}</span>
      </div>
    </div>
    <div style="margin-bottom: 1rem; background: rgba(10, 12, 20, 0.6); padding: 0.75rem 1rem; border-radius: var(--radius-sm);">
      <h5 style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase;">Biography:</h5>
      <p style="font-size: 0.9rem; margin-top: 4px; color: var(--text-primary);">${c.bio || 'No biography provided.'}</p>
    </div>
    <div style="margin-bottom: 1rem;">
      <h5 style="font-size: 0.85rem; color: var(--secondary-cyan); margin-bottom: 4px;">Skills Offered:</h5>
      <ul style="padding-left: 1.25rem; font-size: 0.85rem; color: var(--text-secondary);">
        ${(c.teachSkills || []).map(s => `<li><strong>${s.name}</strong> (${s.proficiency}) - ${s.description || 'Core topics'}</li>`).join('')}
      </ul>
    </div>
    <div>
      <h5 style="font-size: 0.85rem; color: var(--primary-violet); margin-bottom: 4px;">Learning Interests:</h5>
      <ul style="padding-left: 1.25rem; font-size: 0.85rem; color: var(--text-secondary);">
        ${(c.learnSkills || []).map(s => `<li><strong>${s.name}</strong> - ${s.goals || 'Expand skillset'}</li>`).join('')}
      </ul>
    </div>
  `;

  openModal('partner-modal');
};

window.openSendProposalModal = function(candidateId) {
  const item = allRecommendations.find(r => r.candidateId === candidateId || r.candidate._id === candidateId);
  if (!item) return;

  activeTargetCandidate = item.candidate;
  document.getElementById('req-target-userid').value = candidateId;
  document.getElementById('req-target-summary').innerHTML = `Proposing skill exchange with <strong>${activeTargetCandidate.name}</strong> (${item.compatibilityScore}% Compatibility Match)`;

  // Populate "Skill You Will Teach Them" (from logged in user's teachSkills)
  const currentUser = Auth.getUser();
  const offerSelect = document.getElementById('req-offered-skill-select');
  offerSelect.innerHTML = '';
  if (currentUser && currentUser.teachSkills && currentUser.teachSkills.length > 0) {
    currentUser.teachSkills.forEach(s => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify(s);
      opt.textContent = `${s.name} (${s.proficiency})`;
      offerSelect.appendChild(opt);
    });
  } else {
    offerSelect.innerHTML = '<option value=\'{"name":"General Knowledge Sharing","category":"General"}\'>General Knowledge Sharing</option>';
  }

  // Populate "Skill You Want Them to Teach" (from candidate's teachSkills)
  const reqSelect = document.getElementById('req-requested-skill-select');
  reqSelect.innerHTML = '';
  if (activeTargetCandidate.teachSkills && activeTargetCandidate.teachSkills.length > 0) {
    activeTargetCandidate.teachSkills.forEach(s => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify(s);
      opt.textContent = `${s.name} (${s.proficiency})`;
      reqSelect.appendChild(opt);
    });
  } else {
    reqSelect.innerHTML = '<option value=\'{"name":"Collaborative Learning","category":"General"}\'>Collaborative Learning</option>';
  }

  openModal('send-request-modal');
};

function setupProposalForm() {
  const form = document.getElementById('partner-request-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const recipientId = document.getElementById('req-target-userid').value;
    const rawOffer = document.getElementById('req-offered-skill-select').value;
    const rawReq = document.getElementById('req-requested-skill-select').value;
    const schedule = document.getElementById('req-schedule-input').value.trim();
    const message = document.getElementById('req-message-input').value.trim();

    let offeredSkill = { name: 'Skill Exchange' };
    let requestedSkill = { name: 'Collaborative Study' };
    try {
      offeredSkill = JSON.parse(rawOffer);
      requestedSkill = JSON.parse(rawReq);
    } catch (e) {}

    try {
      const res = await api.post('/requests', {
        recipientId,
        offeredSkill,
        requestedSkill,
        proposedSchedule: schedule,
        message: message || `Hi ${activeTargetCandidate.name}! I would love to exchange skills: I can teach ${offeredSkill.name} and learn ${requestedSkill.name}.`
      });

      if (res.success) {
        closeModal('send-request-modal');
        showToast('Skill exchange request sent successfully!', 'success');
        await loadPartnerRecommendations();
      }
    } catch (err) {
      showToast(err.message || 'Error sending exchange request', 'error');
    }
  });
}

let activeAiPlanText = '';

window.openAiStudyPlan = async function(partnerId) {
  const item = allRecommendations.find(r => r.candidateId === partnerId || (r.candidate && r.candidate._id === partnerId));
  const partnerName = item && item.candidate ? item.candidate.name : 'Partner';

  const modal = document.getElementById('ai-studyplan-modal');
  const title = document.getElementById('ai-plan-modal-title');
  const body = document.getElementById('ai-plan-modal-body');

  if (title) title.innerHTML = `<i class="fas fa-magic text-cyan"></i> AI 4-Week Roadmap: You & ${partnerName}`;
  if (body) {
    body.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem;">
        <i class="fas fa-spinner fa-spin text-cyan" style="font-size: 2rem; margin-bottom: 1rem;"></i>
        <h4 style="color: #fff; margin-bottom: 0.5rem;">Designing Custom Learning Roadmap...</h4>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Google Gemini 3.8 Flash is analyzing complementary skills, schedules, and learning milestones.</p>
      </div>
    `;
  }

  if (modal) modal.classList.add('active');

  try {
    const res = await api.post('/ai/study-plan/' + partnerId);
    if (res.success && res.studyPlan) {
      activeAiPlanText = res.studyPlan;

      // Format markdown to HTML
      let html = res.studyPlan
        .replace(/^# (.*$)/gim, '<h2 style="color: var(--secondary-cyan); margin-top: 1rem;">$1</h2>')
        .replace(/^## (.*$)/gim, '<h3 style="color: #fff; margin-top: 0.85rem;">$1</h3>')
        .replace(/^### (.*$)/gim, '<h4 style="color: var(--text-primary); margin-top: 0.65rem;">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/\n\n/g, '<p style="margin-bottom: 0.75rem;"></p>')
        .replace(/\n/g, '<br>');

      body.innerHTML = html;
    } else {
      body.innerHTML = '<p class="text-danger">Unable to generate roadmap. Please try again.</p>';
    }
  } catch (err) {
    body.innerHTML = `<p class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error generating study plan: ${err.message}</p>`;
  }
};

window.copyAiStudyPlan = function() {
  if (!activeAiPlanText) {
    showToast('No active roadmap to copy.', 'info');
    return;
  }
  navigator.clipboard.writeText(activeAiPlanText).then(() => {
    showToast('AI Study Roadmap copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy. Please manually select and copy.', 'error');
  });
};

window.aiDraftProposal = async function() {
  const recipientId = document.getElementById('req-target-userid').value;
  const rawOffer = document.getElementById('req-offered-skill-select').value;
  const rawReq = document.getElementById('req-requested-skill-select').value;
  const msgInput = document.getElementById('req-message-input');

  let offerName = 'My Skills';
  let reqName = 'Your Skills';
  try {
    offerName = JSON.parse(rawOffer).name || offerName;
    reqName = JSON.parse(rawReq).name || reqName;
  } catch (e) {}

  msgInput.value = 'Drafting friendly proposal with Gemini AI...';

  try {
    const res = await api.post('/ai/draft-proposal', {
      recipientId,
      teachSkill: offerName,
      learnSkill: reqName
    });

    if (res.success && res.draft) {
      msgInput.value = res.draft;
      showToast('AI Proposal drafted! Feel free to edit before sending.', 'success');
    }
  } catch (err) {
    msgInput.value = '';
    showToast('Failed to draft proposal: ' + err.message, 'error');
  }
};

