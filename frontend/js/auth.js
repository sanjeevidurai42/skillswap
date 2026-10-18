/**
 * SkillSwap - Authentication Manager & Route Protection
 * Developer: Sanjeeviraj
 */

const Auth = {
  getUser() {
    try {
      const data = localStorage.getItem('skillswap_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('skillswap_token');
  },

  setSession(token, user) {
    localStorage.setItem('skillswap_token', token);
    localStorage.setItem('skillswap_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('skillswap_token');
    localStorage.removeItem('skillswap_user');
  },

  isLoggedIn() {
    return Boolean(this.getToken() && this.getUser());
  },

  async verifySession() {
    if (!this.getToken()) return null;
    try {
      const res = await api.get('/auth/me');
      if (res.success && res.user) {
        localStorage.setItem('skillswap_user', JSON.stringify(res.user));
        return res.user;
      }
    } catch (err) {
      this.clearSession();
    }
    return null;
  },

  async logout() {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {}
    this.clearSession();
    window.location.href = '/login.html';
  },

  // Guard for protected pages (e.g. dashboard, profile, requests, sessions, feedback)
  requireAuth() {
    if (!this.isLoggedIn()) {
      const currentPath = window.location.pathname;
      window.location.href = `/login.html?redirect=${encodeURIComponent(currentPath)}`;
      return false;
    }
    return true;
  }
};
