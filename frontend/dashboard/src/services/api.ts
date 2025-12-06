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
      // Only redirect if not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
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

  async getFlowTemplates() {
    return this.request<{
      success: boolean;
      templates: Array<{
        name: string;
        steps: any[];
        language: string;
      }>;
    }>(`${PMS.getApiPath('/admin/flows/templates')}`);
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

