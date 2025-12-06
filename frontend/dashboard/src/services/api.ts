/**
 * API Client for RetentionOS Dashboard
 * Handles all communication with backend API
 * Uses PMS for path management
 */

import PMS from '../utils/pms';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = PMS.getApiBaseUrl();
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('retentionos_token');
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('retentionos_token', token);
      } else {
        localStorage.removeItem('retentionos_token');
      }
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Make authenticated request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // PMS already returns full URLs, so use endpoint directly if it starts with http
    // Otherwise, prepend baseUrl for relative paths
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for HTTP-only token
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      this.setToken(null);
      // Don't redirect if we're already on login page or checking auth
      // Only redirect if not already on login page and it's not an auth check
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');
      const isAuthCheck = endpoint.includes('/admin/me') || endpoint.includes('/admin/login');
      
      if (!isLoginPage && !isAuthCheck) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      
      // For 503 Service Unavailable (database connection errors), include details
      if (response.status === 503 && error.details) {
        throw new Error(`${error.message}\n\n${error.details}`);
      }
      
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    const response = await this.request<{
      success: boolean;
      token: string;
      admin: {
        id: number;
        email: string;
        role: string;
      };
    }>(PMS.getLoginUrl(), {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request(PMS.getLogoutUrl(), {
        method: 'POST',
      });
    } catch (error) {
      // Continue even if logout fails
      console.error('Logout error:', error);
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentAdmin() {
    return this.request<{
      success: boolean;
      admin: {
        id: number;
        email: string;
        role: string;
      };
    }>(PMS.getAdminPath('me'));
  }

  async updatePassword(currentPassword: string, newPassword: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(PMS.getAdminPath('password'), {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Analytics endpoints
  async getAnalyticsSummary() {
    return this.request<{
      success: boolean;
      summary: {
        totalRevenueSaved: number;
        totalUsersSaved: number;
        totalOffersShown: number;
        totalOffersAccepted: number;
        acceptanceRate: number;
        averageRevenuePerSavedUser: number;
      };
    }>(PMS.getAnalyticsPath('summary'));
  }

  async getOfferPerformance(days: number = 30) {
    return this.request<{
      success: boolean;
      offers: Array<{
        offerType: string;
        totalShown: number;
        totalAccepted: number;
        acceptanceRate: number;
        totalRevenueSaved: number;
        averageRevenuePerAcceptance: number;
      }>;
      period: {
        days: number;
      };
    }>(`${PMS.getAnalyticsPath('offers')}?days=${days}`);
  }

  async getChurnReasons() {
    return this.request<{
      success: boolean;
      reasons: Array<{
        reasonCode: string | null;
        count: number;
        percentage: number;
      }>;
    }>(PMS.getAnalyticsPath('reasons'));
  }

  async getRevenueOverTime(days: number = 30) {
    return this.request<{
      success: boolean;
      data: Array<{
        date: string;
        value: number;
      }>;
      period: {
        days: number;
      };
    }>(`${PMS.getApiPath('/admin/analytics/revenue-over-time')}?days=${days}`);
  }

  async getUsersOverTime(days: number = 30) {
    return this.request<{
      success: boolean;
      data: Array<{
        date: string;
        value: number;
      }>;
      period: {
        days: number;
      };
    }>(`${PMS.getApiPath('/admin/analytics/users-over-time')}?days=${days}`);
  }

  // Flow management endpoints
  async getFlows(language?: string) {
    const url = language
      ? `${PMS.getFlowsUrl()}?language=${language}`
      : PMS.getFlowsUrl();
    return this.request<{
      success: boolean;
      flows: Array<{
        id: number;
        name: string;
        steps: any[];
        language: string;
        rankingScore: number;
        createdAt: string;
        updatedAt: string;
      }>;
    }>(url);
  }

  async getFlow(id: number) {
    return this.request<{
      success: boolean;
      flow: {
        id: number;
        name: string;
        steps: any[];
        language: string;
        rankingScore: number;
        createdAt: string;
        updatedAt: string;
      };
    }>(PMS.getFlowsUrl(id));
  }

  async createFlow(flowData: {
    name: string;
    steps: any[];
    language?: string;
  }) {
    return this.request<{
      success: boolean;
      flow: {
        id: number;
        name: string;
        steps: any[];
        language: string;
        rankingScore: number;
        createdAt: string;
        updatedAt: string;
      };
    }>(PMS.getFlowsUrl(), {
      method: 'POST',
      body: JSON.stringify(flowData),
    });
  }

  async updateFlow(id: number, steps: any[]) {
    return this.request<{
      success: boolean;
      flow: {
        id: number;
        name: string;
        steps: any[];
        language: string;
        rankingScore: number;
        createdAt: string;
        updatedAt: string;
      };
    }>(PMS.getFlowsUrl(id), {
      method: 'PUT',
      body: JSON.stringify({ steps }),
    });
  }

  async deleteFlow(id: number) {
    return this.request<{
      success: boolean;
      message: string;
    }>(PMS.getFlowsUrl(id), {
      method: 'DELETE',
    });
  }

  async updateFlowFull(id: number, flowData: {
    name?: string;
    steps?: any[];
    language?: string;
  }) {
    return this.request<{
      success: boolean;
      flow: {
        id: number;
        name: string;
        steps: any[];
        language: string;
        rankingScore: number;
        createdAt: string;
        updatedAt: string;
      };
    }>(`${PMS.getFlowsUrl(id)}/full`, {
      method: 'PUT',
      body: JSON.stringify(flowData),
    });
  }

  async validateFlow(flowData: {
    name: string;
    steps: any[];
    language?: string;
  }) {
    return this.request<{
      success: boolean;
      validation: {
        valid: boolean;
        errors: string[];
        warnings: string[];
      };
    }>(`${PMS.getApiPath('/admin/flows/validate')}`, {
      method: 'POST',
      body: JSON.stringify(flowData),
    });
  }

  async duplicateFlow(id: number, name?: string) {
    return this.request<{
      success: boolean;
      flow: {
        id: number;
        name: string;
        steps: any[];
        language: string;
        rankingScore: number;
        createdAt: string;
        updatedAt: string;
      };
    }>(`${PMS.getFlowsUrl(id)}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getFlowTemplates(source: 'source' | 'database' | 'url' | 'excel' | 'googlesheets' | 'json' | 'xml' = 'source', options?: {
    url?: string;
    plan?: string;
    minValue?: number;
    maxValue?: number;
    region?: string;
    file?: File;
    googleSheetsUrl?: string;
    googleSheetsApiKey?: string;
  }) {
    if (source === 'database') {
      return this.request<{
        success: boolean;
        templates: any[];
      }>(`${PMS.getApiPath('/admin/flows/templates/from-database')}`, {
        method: 'POST',
        body: JSON.stringify({
          plan: options?.plan,
          minValue: options?.minValue,
          maxValue: options?.maxValue,
          region: options?.region,
        }),
      });
    }

    if (source === 'url') {
      return this.request<{
        success: boolean;
        templates: any[];
      }>(`${PMS.getApiPath('/admin/flows/templates/from-url')}`, {
        method: 'POST',
        body: JSON.stringify({ url: options?.url }),
      });
    }

    if (source === 'excel') {
      // For Excel, we'll handle file upload in the frontend
      // Parse Excel file client-side and convert to templates
      if (!options?.file) {
        throw new Error('Excel file is required');
      }
      return this.parseExcelFile(options.file);
    }

    if (source === 'googlesheets') {
      // Load from Google Sheets
      if (!options?.googleSheetsUrl) {
        throw new Error('Google Sheets URL is required');
      }
      return this.loadFromGoogleSheets(options.googleSheetsUrl, options.googleSheetsApiKey);
    }

    if (source === 'json') {
      if (!options?.file) {
        throw new Error('JSON file is required');
      }
      return this.parseJSONFile(options.file);
    }

    if (source === 'xml') {
      if (!options?.file) {
        throw new Error('XML file is required');
      }
      return this.parseXMLFile(options.file);
    }

    // Default: get from source
    return this.request<{
      success: boolean;
      templates: any[];
    }>(PMS.getApiPath('/admin/flows/templates'));
  }

  private async parseExcelFile(file: File): Promise<{
    success: boolean;
    templates: any[];
  }> {
    // Dynamic import of xlsx library (if available)
    // For now, return error suggesting to use a library
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // Basic CSV parsing (if file is CSV)
          const text = e.target?.result as string;
          if (file.name.endsWith('.csv')) {
            const templates = this.parseCSVToTemplates(text);
            resolve({ success: true, templates });
          } else {
            // For Excel files, would need xlsx library
            reject(new Error('Excel file parsing requires xlsx library. Please convert to CSV or use another source.'));
          }
        } catch (error: any) {
          reject(new Error(`Failed to parse file: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private parseCSVToTemplates(csvText: string): any[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const templates: any[] = [];
    const templateMap = new Map<string, any>();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      const templateName = row['template_name'] || row['name'] || 'Imported Template';
      if (!templateMap.has(templateName)) {
        templateMap.set(templateName, {
          name: templateName,
          language: row['language'] || 'en',
          steps: [],
        });
      }

      const template = templateMap.get(templateName);
      if (row['step_type'] && row['step_title'] && row['step_message']) {
        template.steps.push({
          type: row['step_type'],
          title: row['step_title'],
          message: row['step_message'],
          config: row['step_config'] ? JSON.parse(row['step_config']) : {},
        });
      }
    }

    return Array.from(templateMap.values());
  }

  async getFlowTemplatesFromSource() {
    return this.request<{
      success: boolean;
      templates: Array<{
        name: string;
        steps: any[];
        language: string;
      }>;
    }>(`${PMS.getApiPath('/admin/flows/templates')}`);
  }

  // Subscription Monitoring APIs
  async getUpcomingSubscriptions(days: number = 30) {
    return this.request<{
      success: boolean;
      subscriptions: any[];
      count: number;
    }>(`${PMS.getApiPath('/admin/subscriptions/upcoming')}?days=${days}`);
  }

  async getSubscriptionsNeedingRetention() {
    return this.request<{
      success: boolean;
      subscriptions: any[];
      count: number;
    }>(PMS.getApiPath('/admin/subscriptions/needing-retention'));
  }

  async getSubscriptionStats() {
    return this.request<{
      success: boolean;
      stats: {
        totalActive: number;
        expiringIn7Days: number;
        expiringIn30Days: number;
        expiringIn90Days: number;
        totalValueAtRisk: number;
        averageDaysUntilExpiration: number;
      };
    }>(PMS.getApiPath('/admin/subscriptions/stats'));
  }

  async checkAlerts(alertDays?: number[]) {
    return this.request<{
      success: boolean;
      alerts: any[];
      count: number;
    }>(PMS.getApiPath('/admin/subscriptions/check-alerts'), {
      method: 'POST',
      body: JSON.stringify({ alertDays }),
    });
  }

  async triggerProactiveRetention(daysBeforeEnd: number = 7) {
    return this.request<{
      success: boolean;
      results: any[];
      triggered: number;
      failed: number;
    }>(PMS.getApiPath('/admin/subscriptions/trigger-retention'), {
      method: 'POST',
      body: JSON.stringify({ daysBeforeEnd }),
    });
  }

  async getAlerts(limit: number = 100) {
    return this.request<{
      success: boolean;
      alerts: any[];
      count: number;
    }>(`${PMS.getApiPath('/admin/alerts')}?limit=${limit}`);
  }

  async getAlertStats() {
    return this.request<{
      success: boolean;
      stats: {
        total: number;
        unread: number;
        byType: Record<string, number>;
        recent24Hours: number;
      };
    }>(PMS.getApiPath('/admin/alerts/stats'));
  }

  async markAlertAsRead(alertId: number) {
    return this.request<{
      success: boolean;
      alert: any;
    }>(PMS.getApiPath(`/admin/alerts/${alertId}/read`), {
      method: 'PUT',
    });
  }

  async markAllAlertsAsRead(subscriptionId: number) {
    return this.request<{
      success: boolean;
      count: number;
    }>(PMS.getApiPath(`/admin/subscriptions/${subscriptionId}/alerts/read-all`), {
      method: 'PUT',
    });
  }

  async activateFlow(id: number) {
    return this.request<{
      success: boolean;
      flow: {
        id: number;
        name: string;
        steps: any[];
        language: string;
        rankingScore: number;
        createdAt: string;
        updatedAt: string;
      };
    }>(`${PMS.getFlowsUrl(id)}/activate`, {
      method: 'POST',
    });
  }

  async deactivateFlow(id: number) {
    return this.request<{
      success: boolean;
      flow: {
        id: number;
        name: string;
        steps: any[];
        language: string;
        rankingScore: number;
        createdAt: string;
        updatedAt: string;
      };
    }>(`${PMS.getFlowsUrl(id)}/deactivate`, {
      method: 'POST',
    });
  }

  // AI endpoints
  async getChurnRisk(userId: number) {
    return this.request<{
      success: boolean;
      risk: {
        score: number;
        factors: {
          behavior: number;
          value: number;
          history: number;
          cancelAttempts: number;
        };
        segment: string;
        explanation: string;
      };
    }>(`${PMS.getApiPath(`/admin/ai/churn-risk/${userId}`)}`);
  }

  async getAIRecommendations(userId: number, flowId?: number) {
    const url = flowId
      ? `${PMS.getApiPath(`/admin/ai/recommendations/${userId}`)}?flowId=${flowId}`
      : PMS.getApiPath(`/admin/ai/recommendations/${userId}`);
    return this.request<{
      success: boolean;
      recommendations: {
        churnRisk: {
          score: number;
          factors: Record<string, number>;
          segment: string;
          explanation: string;
        };
        offer: {
          offerType: string;
          confidence: number;
          reason: string;
          expectedAcceptanceRate: number;
        };
        message: {
          message: string;
          template: string;
          personalization: Record<string, any>;
        };
      };
    }>(url);
  }

  async getAIPerformance() {
    return this.request<{
      success: boolean;
      metrics: {
        totalOffers: number;
        totalAccepted: number;
        overallAcceptanceRate: number;
        offerPerformance: Array<{
          offerType: string;
          totalShown: number;
          totalAccepted: number;
          acceptanceRate: number;
          avgRevenueSaved: number;
        }>;
        weights: Array<{
          name: string;
          value: number;
        }>;
      };
    }>(`${PMS.getApiPath('/admin/ai/performance')}`);
  }

  // API Key management endpoints
  async getApiKeys() {
    return this.request<{
      success: boolean;
      keys: Array<{
        id: number;
        maskedKey: string;
        ownerId: number;
        ownerEmail: string | null;
        createdAt: string;
        lastUsed: string | null;
        expiresAt: string | null;
        isExpired: boolean;
      }>;
    }>(PMS.getAdminPath('api-keys'));
  }

  async createApiKey() {
    return this.request<{
      success: boolean;
      key: {
        id: number;
        key: string; // Plain text key - show only once!
        expiresAt: string | null;
        createdAt: string;
      };
      warning: string;
    }>(PMS.getAdminPath('api-keys'), {
      method: 'POST',
    });
  }

  async deleteApiKey(id: number) {
    return this.request<{
      success: boolean;
      message: string;
    }>(PMS.getAdminPath('api-keys', id), {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
const apiClient = new ApiClient();
export default apiClient;

