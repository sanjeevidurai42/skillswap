/**
 * SkillSwap - Notifications Page Controller
 * Developer: Sanjeeviraj
 */

let allNotifications = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;
  await loadNotifications();
});

async function loadNotifications() {
  const container = document.getElementById('notifications-container');
  const unreadPill = document.getElementById('unread-count-pill');

  try {
    const res = await api.get('/notifications');
    if (res.success && res.notifications) {
      allNotifications = res.notifications;
      if (unreadPill) unreadPill.textContent = res.unreadCount || 0;
      renderNotifications();
      updateNotificationBadge();
    }
  } catch (err) {
    if (container) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Error loading notifications.</p>';
    }
  }
}

function filterNotifications(type) {
  currentFilter = type;
  const allBtn = document.getElementById('tab-all-notifs');
  const unreadBtn = document.getElementById('tab-unread-notifs');

  if (type === 'all') {
    allBtn.classList.add('active');
    unreadBtn.classList.remove('active');
  } else {
    unreadBtn.classList.add('active');
    allBtn.classList.remove('active');
  }

  renderNotifications();
}

function renderNotifications() {
  const container = document.getElementById('notifications-container');
  if (!container) return;

  const filtered = currentFilter === 'all'
    ? allNotifications
    : allNotifications.filter(n => !n.read);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-bell-slash"></i></div>
        <h3>No ${currentFilter === 'unread' ? 'unread' : ''} notifications</h3>
        <p style="color: var(--text-muted);">You're all caught up with your study exchanges!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((n, idx) => {
    let iconClass = 'fas fa-info';
    let iconBg = 'rgba(59, 130, 246, 0.15)';
    let iconColor = 'var(--status-info)';

    if (n.type === 'request_received') {
      iconClass = 'fas fa-envelope';
      iconBg = 'rgba(139, 92, 246, 0.15)';
      iconColor = 'var(--primary-violet)';
    } else if (n.type === 'request_accepted') {
      iconClass = 'fas fa-check-circle';
      iconBg = 'rgba(16, 185, 129, 0.15)';
      iconColor = 'var(--status-success)';
    } else if (n.type === 'points_awarded') {
      iconClass = 'fas fa-trophy';
      iconBg = 'rgba(34, 211, 238, 0.15)';
      iconColor = 'var(--secondary-cyan)';
    } else if (n.type === 'session_scheduled') {
      iconClass = 'fas fa-calendar-alt';
      iconBg = 'rgba(245, 158, 11, 0.15)';
      iconColor = 'var(--status-warning)';
    }

    const timeAgo = formatTimeAgo(new Date(n.createdAt));

    return `
      <div class="notif-card ${!n.read ? 'unread' : ''} reveal-on-scroll delay-${(idx % 4) + 1}">
        <div class="notif-icon-box" style="background: ${iconBg}; color: ${iconColor};">
          <i class="${iconClass}"></i>
        </div>

        <div style="flex: 1;">
          <div class="flex items-center justify-between">
            <h4 style="font-size: 1rem; color: #fff;">${n.title}</h4>
            <div class="flex items-center gap-1">
              <span style="font-size: 0.75rem; color: var(--text-muted);">${timeAgo}</span>
              ${!n.read ? '<div class="notif-unread-dot" title="Unread"></div>' : ''}
            </div>
          </div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 4px;">${n.message}</p>
          <div class="flex items-center gap-2 mt-2">
            <a href="${n.link || '/dashboard.html'}" class="btn btn-sm btn-outline-violet" style="font-size: 0.8rem; padding: 0.3rem 0.7rem;">
              View Details <i class="fas fa-arrow-right"></i>
            </a>
            ${!n.read ? `
              <button onclick="markAsRead('${n._id}')" class="btn btn-sm btn-secondary" style="font-size: 0.8rem; padding: 0.3rem 0.7rem; color: var(--text-muted);">
                Mark as Read
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  initScrollReveal();
}

window.markAsRead = async function(notifId) {
  try {
    const res = await api.put(`/notifications/${notifId}/read`, {});
    if (res.success) {
      const target = allNotifications.find(n => n._id === notifId);
      if (target) target.read = true;
      renderNotifications();
      updateNotificationBadge();
    }
  } catch (err) {}
};

window.markAllNotificationsAsRead = async function() {
  try {
    const res = await api.put('/notifications/mark-all-read', {});
    if (res.success) {
      allNotifications.forEach(n => { n.read = true; });
      renderNotifications();
      updateNotificationBadge();
      showToast('All notifications marked as read', 'info');
    }
  } catch (err) {
    showToast('Error updating notifications', 'error');
  }
};

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
