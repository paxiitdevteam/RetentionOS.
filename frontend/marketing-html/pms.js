/**
 * Path Manager System (PMS) for Marketing Website
 * Resolves links relative to the current page so GitHub Pages (/repo/) and local dev both work.
 */

const PMS = {
  dashboardUrl: 'http://localhost:3001',
  apiUrl: 'http://localhost:3000',

  pages: {
    home: 'index.html',
    features: 'features.html',
    pricing: 'pricing.html',
    about: 'about.html',
    contact: 'contact.html',
    privacy: 'privacy.html',
    terms: 'terms.html',
    cookies: 'cookies.html',
    integration: 'integration.html',
  },

  /**
   * Absolute URL to a marketing page, works when hosted under a subpath (e.g. GitHub Pages).
   */
  getPageUrl: function (pageName) {
    const page = this.pages[pageName];
    if (!page) {
      console.warn('Page "' + pageName + '" not found in PMS');
      return new URL('index.html', window.location.href).href;
    }
    return new URL(page, window.location.href).href;
  },

  getDashboardUrl: function (path) {
    if (path === void 0) path = '/login';
    return this.dashboardUrl + path;
  },

  getApiUrl: function (endpoint) {
    if (endpoint === void 0) endpoint = '';
    return this.apiUrl + endpoint;
  },

  navigate: function (pageName) {
    window.location.href = this.getPageUrl(pageName);
  },

  isProduction: function () {
    return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  },

  init: function () {
    try {
      var dm = document.querySelector('meta[name="retentionos-dashboard-url"]');
      var am = document.querySelector('meta[name="retentionos-api-url"]');
      if (dm && dm.getAttribute('content') && dm.getAttribute('content').trim()) {
        this.dashboardUrl = dm.getAttribute('content').trim().replace(/\/$/, '');
      }
      if (am && am.getAttribute('content') && am.getAttribute('content').trim()) {
        this.apiUrl = am.getAttribute('content').trim().replace(/\/$/, '');
      }
    } catch (e) {}

    window.PMS = this;
  },
};

PMS.init();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PMS;
}
