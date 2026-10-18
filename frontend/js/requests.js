/**
 * SkillSwap - Skill Exchange Requests Page Controller
 * Developer: Sanjeeviraj
 */

let activeTab = 'incoming';
let incomingRequests = [];
let outgoingRequests = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;
  await loadAllRequests();
  setupAcceptModalForm();
});

async function loadAllRequests() {
  try {
    const [inRes, outRes] = await Promise.all([
      api.get('/requests/incoming'),
      api.get('/requests/outgoing')
    ]);

    incomingRequests = inRes.success ? inRes.requests : [];
    outgoingRequests = outRes.success ? outRes.requests : [];

    const inBadge = document.getElementById('incoming-count-badge');
    const outBadge = document.getElementById('outgoing-count-badge');
    if (inBadge) inBadge.textContent = incomingRequests.length;
    if (outBadge) outBadge.textContent = outgoingRequests.length;

    renderRequestsList();
  } catch (err) {
    showToast('Failed to load exchange requests: ' + err.message, 'error');
  }
}

function switchRequestTab(tab) {
  activeTab = tab;
  const inBtn = document.getElementById('tab-incoming-btn');
  const outBtn = document.getElementById('tab-outgoing-btn');

  if (tab === 'incoming') {
    inBtn.classList.add('active');
    outBtn.classList.remove('active');
  } else {
    outBtn.classList.add('active');
    inBtn.classList.remove('active');
  }

  renderRequestsList();
}

function renderRequestsList() {
  const container = document.getElementById('requests-list-container');
  if (!container) return;

  const list = activeTab === 'incoming' ? incomingRequests : outgoingRequests;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-inbox"></i></div>
        <h3>No ${activeTab} exchange requests</h3>
        <p style="color: var(--text-muted); max-width: 450px;">
          ${activeTab === 'incoming'
            ? 'When peers discover your skills in the directory, their proposals will appear here.'
            : 'You haven\'t proposed any skill exchanges yet. Find a study partner to get started!'}
        </p>
        <a href="/partners.html" class="btn btn-primary mt-2">Find Learning Partners</a>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((req, index) => {
    const isIncoming = activeTab === 'incoming';
    const partner = isIncoming ? req.sender : req.recipient;

    // Status Badge
    let statusBadge = '<span class="badge badge-warning">Pending</span>';
    if (req.status === 'accepted') statusBadge = '<span class="badge badge-success">Accepted</span>';
    else if (req.status === 'rejected') statusBadge = '<span class="badge badge-danger">Declined</span>';
    else if (req.status === 'cancelled') statusBadge = '<span class="badge badge-secondary">Cancelled</span>';

    // Actions
    let actionButtonsHtml = '';
    if (isIncoming && req.status === 'pending') {
      actionButtonsHtml = `
        <div class="flex gap-1" style="margin-left: auto;">
          <button onclick="openAcceptModal('${req._id}')" class="btn btn-sm btn-success">
            <i class="fas fa-check"></i> Accept Proposal
          </button>
          <button onclick="rejectRequest('${req._id}')" class="btn btn-sm btn-danger">
            <i class="fas fa-times"></i> Decline
          </button>
        </div>
      `;
    } else if (!isIncoming && req.status === 'pending') {
      actionButtonsHtml = `
        <button onclick="cancelRequest('${req._id}')" class="btn btn-sm btn-danger" style="margin-left: auto;">
          <i class="fas fa-ban"></i> Cancel Request
        </button>
      `;
    } else if (req.status === 'accepted') {
      actionButtonsHtml = `
        <a href="/sessions.html" class="btn btn-sm btn-primary" style="margin-left: auto;">
          <i class="fas fa-calendar-plus"></i> Schedule Session Now
        </a>
      `;
    }

    const createdDate = new Date(req.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    return `
      <div class="request-item-card reveal-on-scroll delay-${(index % 3) + 1}">
        <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 0.75rem;">
          <div class="flex items-center gap-2">
            <img src="${partner?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" alt="${partner?.name}">
            <div>
              <h3 style="font-size: 1.1rem; color: #fff;">${partner?.name || 'Peer Student'}</h3>
              <p style="font-size: 0.8rem; color: var(--secondary-cyan);">${partner?.headline || 'SkillSwap Member'}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span style="font-size: 0.8rem; color: var(--text-muted);"><i class="far fa-clock"></i> ${createdDate}</span>
            ${statusBadge}
          </div>
        </div>

        <!-- Exchange Deal Graphic -->
        <div class="exchange-deal-box">
          <div class="deal-col">
            <h5>${isIncoming ? 'They Offer to Teach You' : 'You Offer to Teach Them'}</h5>
            <strong style="color: var(--primary-violet); font-size: 1rem;">${req.offeredSkill.name}</strong>
          </div>
          <div class="deal-icon">
            <i class="fas fa-arrows-alt-h"></i>
          </div>
          <div class="deal-col">
            <h5>${isIncoming ? 'In Exchange to Learn From You' : 'In Exchange to Learn From Them'}</h5>
            <strong style="color: var(--secondary-cyan); font-size: 1rem;">${req.requestedSkill.name}</strong>
          </div>
        </div>

        <!-- Proposal Message & Schedule -->
        <div style="background: rgba(15, 18, 29, 0.6); padding: 0.85rem 1.1rem; border-radius: var(--radius-sm); font-size: 0.875rem;">
          <p style="color: var(--text-primary); margin-bottom: 4px;"><strong>Proposal Note:</strong> "${req.message}"</p>
          <span style="color: var(--text-muted); font-size: 0.8rem;">
            <i class="far fa-calendar-check text-cyan"></i> Proposed Timing: ${req.proposedSchedule || 'Flexible'}
          </span>
          ${req.responseMessage ? `<p style="color: #6ee7b7; margin-top: 6px; font-size: 0.825rem;"><i class="fas fa-comment-dots"></i> Response: "${req.responseMessage}"</p>` : ''}
        </div>

        <!-- Footer / Action Row -->
        <div class="flex items-center" style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
          ${actionButtonsHtml}
        </div>
      </div>
    `;
  }).join('');

  initScrollReveal();
}

window.openAcceptModal = function(requestId) {
  document.getElementById('accept-req-id').value = requestId;
  openModal('accept-modal');
};

function setupAcceptModalForm() {
  const form = document.getElementById('accept-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const reqId = document.getElementById('accept-req-id').value;
    const msg = document.getElementById('accept-response-msg').value.trim();

    try {
      const res = await api.put(`/requests/${reqId}/accept`, { responseMessage: msg });
      if (res.success) {
        closeModal('accept-modal');
        showToast('Exchange proposal accepted! You can now schedule sessions.', 'success');
        await loadAllRequests();
      }
    } catch (err) {
      showToast(err.message || 'Error accepting request', 'error');
    }
  });
}

window.rejectRequest = async function(requestId) {
  if (!confirm('Are you sure you want to decline this exchange request?')) return;
  try {
    const res = await api.put(`/requests/${requestId}/reject`, {
      responseMessage: 'Thank you for reaching out, but I cannot commit right now.'
    });
    if (res.success) {
      showToast('Exchange request declined.', 'info');
      await loadAllRequests();
    }
  } catch (err) {
    showToast(err.message || 'Error declining request', 'error');
  }
};

window.cancelRequest = async function(requestId) {
  if (!confirm('Cancel your pending exchange request?')) return;
  try {
    const res = await api.put(`/requests/${requestId}/cancel`, {});
    if (res.success) {
      showToast('Request cancelled.', 'info');
      await loadAllRequests();
    }
  } catch (err) {
    showToast(err.message || 'Error cancelling request', 'error');
  }
};
