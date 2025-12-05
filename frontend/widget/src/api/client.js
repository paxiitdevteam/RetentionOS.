/**
 * API Client for RetentionOS Widget
 * Handles all communication with backend
 */

class ApiClient {
  constructor(apiKey, apiUrl) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async startRetentionFlow(userId, plan, region) {
    // TODO: Implement /retention/start call
    throw new Error('Not implemented');
  }

  async sendDecision(flowId, offerType, accepted) {
    // TODO: Implement /retention/decision call
    throw new Error('Not implemented');
  }
}

export default ApiClient;

