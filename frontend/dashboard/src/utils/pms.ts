/**
 * Path Manager System (PMS) - Frontend Dashboard
 * Centralized path management for RetentionOS dashboard
 * Single source of truth for all API paths and navigation
 */

class PathManagerSystem {
  private version: string = '1.0.0';
  private apiBaseUrl: string;
  private basePath: string;

  constructor() {
    // Get API URL from environment or use default
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    this.basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  }

  /**
   * Get API endpoint path
   */
  getApiPath(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.apiBaseUrl}/${cleanEndpoint}`;
  }

  /**
   * Get admin API endpoints
   */
  getAdminPath(action: string, id?: string | number): string {
    const basePath = '/admin';
    if (id) {
      return this.getApiPath(`${basePath}/${action}/${id}`);
    }
    return this.getApiPath(`${basePath}/${action}`);
  }

  /**
   * Get analytics API endpoints
   */
  getAnalyticsPath(type: 'summary' | 'offers' | 'reasons'): string {
    return this.getApiPath(`/admin/analytics/${type}`);
  }

  /**
   * Navigate to dashboard page
   */
  navigateTo(page: string): string {
    const cleanPage = page.startsWith('/') ? page.slice(1) : page;
    return `${this.basePath}/${cleanPage}`;
  }

  /**
   * Get dashboard pages
   */
  getPages() {
    return {
      home: this.navigateTo(''),
      dashboard: this.navigateTo('dashboard'),
      analytics: this.navigateTo('analytics'),
      flows: this.navigateTo('flows'),
      settings: this.navigateTo('settings'),
      apiKeys: this.navigateTo('settings/api-keys'),
      account: this.navigateTo('settings/account'),
    };
  }

  /**
   * Get login endpoint
   */
  getLoginUrl(): string {
    return this.getAdminPath('login');
  }

  /**
   * Get logout endpoint
   */
  getLogoutUrl(): string {
    return this.getAdminPath('logout');
  }

  /**
   * Get flows endpoints
   */
  getFlowsUrl(id?: string | number): string {
    return this.getAdminPath('flows', id);
  }

  /**
   * Get version
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Get API base URL
   */
  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }
}

// Export singleton instance
export const PMS = new PathManagerSystem();
export default PMS;

