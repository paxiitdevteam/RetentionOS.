/**
 * Path Manager System (PMS) - Widget
 * Centralized path management for RetentionOS widget
 * Single source of truth for all API paths
 */

class PathManagerSystem {
  constructor() {
    this.version = '1.0.0';
    // Get API URL from config or use default
    this.apiBaseUrl = window.RetentionOS?.config?.apiUrl || 'http://localhost:3000';
  }

  /**
   * Get API endpoint path
   */
  getApiPath(endpoint) {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.apiBaseUrl}/${cleanEndpoint}`;
  }

  /**
   * Get retention API endpoints
   */
  getRetentionPath(action) {
    const endpoints = {
      start: '/retention/start',
      decision: '/retention/decision',
      flow: '/retention/flow',
    };
    return this.getApiPath(endpoints[action] || endpoints.start);
  }

  /**
   * Get version
   */
  getVersion() {
    return this.version;
  }

  /**
   * Get API base URL
   */
  getApiBaseUrl() {
    return this.apiBaseUrl;
  }

  /**
   * Set API base URL (for dynamic configuration)
   */
  setApiBaseUrl(url) {
    this.apiBaseUrl = url;
  }
}

// Export singleton instance
const PMS = new PathManagerSystem();

// Make available globally
if (typeof window !== 'undefined') {
  window.PMS = PMS;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PMS;
}

export default PMS;

