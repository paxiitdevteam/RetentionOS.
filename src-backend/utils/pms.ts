/**
 * Path Manager System (PMS) - Backend
 * Centralized path management for RetentionOS backend
 * Single source of truth for all file paths and URLs
 */

class PathManagerSystem {
  private version: string = '1.0.0';
  private baseUrl: string;
  private apiBaseUrl: string;

  constructor() {
    // Get base URLs from environment or use defaults
    this.baseUrl = process.env.BASE_URL || 'http://localhost:8000';
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
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
   * Get retention API endpoints
   */
  getRetentionPath(action: 'start' | 'decision' | 'flow'): string {
    const endpoints = {
      start: '/retention/start',
      decision: '/retention/decision',
      flow: '/retention/flow',
    };
    return this.getApiPath(endpoints[action]);
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
   * Get dashboard URL
   */
  getDashboardUrl(path: string = ''): string {
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3001';
    return path ? `${dashboardUrl}/${path}` : dashboardUrl;
  }

  /**
   * Get widget CDN URL
   */
  getWidgetUrl(): string {
    return process.env.WIDGET_CDN_URL || 'http://localhost:3002/widget.js';
  }

  /**
   * Get static asset path
   */
  getAssetPath(asset: string): string {
    const assetBase = process.env.ASSET_BASE_URL || this.baseUrl;
    return asset.startsWith('http') ? asset : `${assetBase}/assets/${asset}`;
  }

  /**
   * Get database connection string
   */
  getDatabaseUrl(): string {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '3306';
    const database = process.env.DB_NAME || 'retentionos';
    const user = process.env.DB_USER || 'retentionos';
    const password = process.env.DB_PASSWORD || 'password';
    return `mysql://${user}:${password}@${host}:${port}/${database}`;
  }

  /**
   * Get Redis URL
   */
  getRedisUrl(): string {
    return process.env.REDIS_URL || 'redis://localhost:6379';
  }

  /**
   * Get version
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
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

