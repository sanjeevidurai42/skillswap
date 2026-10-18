/**
 * SkillSwap - Core API Client & UI Utilities
 * Developer: Sanjeeviraj
 */

// Dynamically determine API base URL (works both on port 5000 and 5500/Live Server)
const API_BASE = window.location.origin.includes(':5500') || window.location.origin.includes(':3000')
  ? 'http://localhost:5000/api'
  : '/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('skillswap_token');
  }

  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders(options.headers);

    const config = {
      ...options,
      headers,
      credentials: 'include'
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && !window.location.pathname.includes('login.html')) {
          // Token expired
          localStorage.removeItem('skillswap_token');
          localStorage.removeItem('skillswap_user');
          // Optional redirect if on protected page
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const api = new ApiClient();

/* Toast Notification Utility */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fas fa-info-circle';
  if (type === 'success') icon = 'fas fa-check-circle text-green-400';
  if (type === 'error') icon = 'fas fa-exclamation-triangle text-red-400';

  toast.innerHTML = `
    <i class="${icon}" style="font-size: 1.2rem; margin-top: 2px;"></i>
    <div style="flex: 1; font-size: 0.9rem;">${message}</div>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0 4px;">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

/* Modal Helpers */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* Scroll Reveal Observer */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
}

/* Animated Number Counter */
function animateCounter(element, target, duration = 1200) {
  if (!element) return;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out quartic
    const easeOut = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(start + (target - start) * easeOut);
    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target;
    }
  }

  requestAnimationFrame(update);
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
});
