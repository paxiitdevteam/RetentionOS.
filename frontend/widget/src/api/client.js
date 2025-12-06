/**
 * API Client for RetentionOS Widget
 * Handles all communication with backend
 * Uses PMS for path management
 * Includes error handling, retry logic, and timeouts
 */

class ApiClient {
  constructor(apiKey, pms, config = {}) {
    this.apiKey = apiKey;
    this.pms = pms || window.PMS;
    this.timeout = config.timeout || 5000; // 5 seconds default
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000; // 1 second
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Make HTTP request with timeout and retry logic
   */
  async makeRequest(url, options, retryCount = 0) {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`API error: ${response.status} ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      const data = await response.json();
      
      // Log successful request
      this.logRequest('success', url, options.method || 'GET', response.status);
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.isTimeout = true;
        throw timeoutError;
      }

      // Retry logic
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`⚠️  Request failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        await this.sleep(delay);
        return this.makeRequest(url, options, retryCount + 1);
      }

      // Log failed request
      this.logRequest('error', url, options.method || 'GET', error.status || 0, error.message);
      
      throw error;
    }
  }

  /**
   * Determine if request should be retried
   */
  shouldRetry(error) {
    // Retry on network errors, timeouts, and 5xx errors
    if (error.isTimeout) return true;
    if (error.status >= 500) return true;
    if (error.status === 429) return true; // Rate limit
    if (!error.status) return true; // Network error
    
    return false;
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log request for debugging
   */
  logRequest(status, url, method, statusCode, errorMessage = null) {
    if (window.RetentionOS?.config?.debug) {
      console.log(`[API ${status.toUpperCase()}] ${method} ${url} - ${statusCode}${errorMessage ? ` - ${errorMessage}` : ''}`);
    }
  }

  /**
   * Start retention flow
   */
  async startRetentionFlow(userId, plan, region) {
    const url = this.pms.getRetentionPath('start');
    
    return await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        userId,
        plan,
        region,
      }),
    });
  }

  /**
   * Send user decision
   */
  async sendDecision(flowId, offerType, accepted, revenueValue = null) {
    const url = this.pms.getRetentionPath('decision');
    
    const body = {
      flowId,
      offerType,
      accepted,
    };

    if (revenueValue !== null) {
      body.revenueValue = revenueValue;
    }
    
    return await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * Get flow by ID
   */
  async getFlow(flowId) {
    const url = `${this.pms.getRetentionPath('flow')}/${flowId}`;
    
    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
      },
    });
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.RetentionOSApiClient = ApiClient;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
}

export default ApiClient;

