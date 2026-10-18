/**
 * SkillSwap - Explore Skills Page Controller
 * Developer: Sanjeeviraj
 */

let activeCategory = 'All';
let searchDebounceTimeout = null;
let allAvailableMentors = [];

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q');
  if (initialQuery) {
    document.getElementById('skill-search-input').value = initialQuery;
  }

  // Live typing search listener
  const searchInput = document.getElementById('skill-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(() => {
        handleSearch();
      }, 350);
    });
  }

  await loadSkills();
  setupRequestModalForm();
});

function selectCategory(category, element) {
  activeCategory = category;
  document.querySelectorAll('.category-pill').forEach(btn => btn.classList.remove('active'));
  if (element) element.classList.add('active');
  handleSearch();
}

async function handleSearch() {
  const query = document.getElementById('skill-search-input').value.trim();
  const format = document.getElementById('format-filter').value;
  await loadSkills(query, activeCategory, format);
}

async function loadSkills(query = '', category = 'All', format = 'all') {
  const container = document.getElementById('explore-skills-container');
  if (!container) return;

  try {
    let url = `/skills?page=1&limit=60`;
    if (query) url += `&q=${encodeURIComponent(query)}`;
    if (category && category !== 'All') url += `&category=${encodeURIComponent(category)}`;

    const res = await api.get(url);
    if (res.success && res.skills && res.skills.length > 0) {
      container.innerHTML = res.skills.map((skill, index) => {
        const tagsHtml = (skill.tags || []).map(t => `<span class="tag-chip">${t}</span>`).join('');
        return `
          <div class="explore-skill-card reveal-on-scroll delay-${(index % 3) + 1}">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="badge ${index % 2 === 0 ? 'badge-violet' : 'badge-cyan'}">${skill.category}</span>
                <i class="${skill.icon || 'fas fa-code'} text-cyan" style="font-size: 1.4rem;"></i>
              </div>
              <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: #fff;">${skill.name}</h3>
              <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">
                ${skill.description || 'Collaborate with student peers to master this topic through reciprocal sessions.'}
              </p>
              <div class="flex items-center gap-1" style="flex-wrap: wrap; margin-bottom: 1rem;">
                ${tagsHtml}
              </div>
            </div>

            <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
              <div class="flex items-center justify-between mb-2">
                <span style="font-size: 0.85rem; color: var(--secondary-cyan);">
                  <i class="fas fa-chalkboard-teacher"></i> ${skill.availableMentors || 1} Available Mentors
                </span>
                <span class="badge badge-warning" style="font-size: 0.7rem;">High Demand</span>
              </div>
              <div class="flex gap-1">
                <button onclick="openExchangeProposal('${skill.name}', '${skill.category}')" class="btn btn-sm btn-primary w-full">
                  <i class="fas fa-handshake"></i> Request Exchange
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
      initScrollReveal();
    } else {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon"><i class="fas fa-search-minus"></i></div>
          <h3>No matching skills found</h3>
          <p style="color: var(--text-muted); max-width: 450px;">
            We couldn't find any skills matching your search query. Try searching for a different keyword or browse all disciplines.
          </p>
          <button onclick="document.getElementById('skill-search-input').value=''; selectCategory('All', document.querySelector('.category-pill'));" class="btn btn-secondary mt-2">
            Reset Filters
          </button>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1; text-align: center;">Error loading skill directory.</p>';
  }
}

// Open exchange proposal modal from a specific skill
window.openExchangeProposal = async function(skillName, skillCategory) {
  if (!Auth.isLoggedIn()) {
    showToast('Please sign in or use a demo account to propose a skill exchange.', 'info');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    }, 1200);
    return;
  }

  document.getElementById('req-modal-skill-learn').value = skillName;

  // Load mentors from recommendations or users
  try {
    const res = await api.get('/partners/recommendations');
    const mentorSelect = document.getElementById('req-modal-mentor-select');
    mentorSelect.innerHTML = '<option value="">-- Choose a Learning Partner --</option>';

    if (res.success && res.recommendations && res.recommendations.length > 0) {
      allAvailableMentors = res.recommendations;
      res.recommendations.forEach(r => {
        const c = r.candidate;
        const opt = document.createElement('option');
        opt.value = c._id;
        opt.textContent = `${c.name} (${r.compatibilityScore}% Compatibility Match)`;
        mentorSelect.appendChild(opt);
      });
    }

    // Populate "Skill You Offer in Return" from logged in user's teachSkills
    const user = Auth.getUser();
    const myOfferSelect = document.getElementById('req-modal-my-offer');
    myOfferSelect.innerHTML = '';

    if (user && user.teachSkills && user.teachSkills.length > 0) {
      user.teachSkills.forEach(s => {
        const opt = document.createElement('option');
        opt.value = JSON.stringify({ name: s.name, category: s.category, proficiency: s.proficiency });
        opt.textContent = `${s.name} (${s.proficiency})`;
        myOfferSelect.appendChild(opt);
      });
    } else {
      const opt = document.createElement('option');
      opt.value = JSON.stringify({ name: 'General Collaborative Study', category: 'General', proficiency: 'intermediate' });
      opt.textContent = 'General Collaborative Study';
      myOfferSelect.appendChild(opt);
    }

    openModal('explore-request-modal');
  } catch (err) {
    showToast('Could not load partner list for this skill', 'error');
  }
};

function setupRequestModalForm() {
  const form = document.getElementById('explore-request-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const recipientId = document.getElementById('req-modal-mentor-select').value;
    const requestedSkillName = document.getElementById('req-modal-skill-learn').value;
    const rawOffer = document.getElementById('req-modal-my-offer').value;
    const message = document.getElementById('req-modal-msg').value.trim();

    if (!recipientId) {
      showToast('Please select a partner to send the exchange request to.', 'error');
      return;
    }

    let offeredSkill = { name: 'Collaborative Exchange', category: 'General' };
    try {
      offeredSkill = JSON.parse(rawOffer);
    } catch (e) {}

    try {
      const res = await api.post('/requests', {
        recipientId,
        requestedSkill: { name: requestedSkillName, category: 'General' },
        offeredSkill,
        message: message || `Hi! I would love to learn ${requestedSkillName} from you and offer ${offeredSkill.name} in exchange.`
      });

      if (res.success) {
        closeModal('explore-request-modal');
        showToast('Exchange proposal sent! View status under "Requests".', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error sending request', 'error');
    }
  });
}
