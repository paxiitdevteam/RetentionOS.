/**
 * RetentionOS Widget Entry Point
 * Detects cancel events and displays retention flows
 */

// Import dependencies (will be bundled by webpack)
import PMS from './pms';
import CancelButtonDetector from './detection/CancelButtonDetector';
import ApiClient from './api/client';
import RetentionModal from './modal/Modal';

class RetentionOS {
  constructor(config) {
    // Validate required config
    if (!config.apiKey) {
      throw new Error('apiKey is required');
    }
    if (!config.userId) {
      throw new Error('userId is required');
    }

    this.apiKey = config.apiKey;
    this.userId = config.userId;
    this.plan = config.plan || 'unknown';
    this.region = config.region || 'unknown';
    this.apiUrl = config.apiUrl || 'http://localhost:3000';
    
    // Configure PMS with API URL
    if (config.apiUrl) {
      PMS.setApiBaseUrl(config.apiUrl);
    }
    
    // Store config globally for PMS access
    window.RetentionOS = {
      config: {
        apiUrl: this.apiUrl,
        apiKey: this.apiKey,
        userId: this.userId,
        plan: this.plan,
        region: this.region,
      }
    };

    // Initialize components
    this.apiClient = new ApiClient(this.apiKey, PMS, {
      timeout: config.timeout || 5000,
      maxRetries: config.maxRetries || 3,
    });
    this.modal = new RetentionModal();
    this.detector = null;
    this.currentFlow = null;
  }

  init() {
    console.log('🚀 RetentionOS Widget initializing...');
    console.log('PMS Version:', PMS.getVersion());
    console.log('API Base URL:', PMS.getApiBaseUrl());

    // Setup cancel button detection
    this.setupCancelDetection();

    // Initialize modal
    this.modal.init();

    console.log('✅ RetentionOS Widget initialized');
  }

  /**
   * Setup cancel button detection
   */
  setupCancelDetection() {
    this.detector = new CancelButtonDetector({
      customSelectors: window.RetentionOS?.config?.customSelectors || [],
      observeMutations: true, // Watch for dynamic content
      onCancelDetected: (data) => {
        this.handleCancelDetected(data);
      },
    });

    this.detector.init();
  }

  /**
   * Handle cancel button detection
   */
  async handleCancelDetected(data) {
    console.log('🔍 Cancel button detected:', data.element);

    try {
      // Start retention flow
      const flow = await this.startRetentionFlow();
      
      if (flow && flow.flowId) {
        this.currentFlow = flow;
        this.showRetentionFlow(flow);
      } else {
        // No flow available, allow normal cancel
        console.log('ℹ️  No retention flow available, allowing cancel');
        this.allowCancel(data);
      }
    } catch (error) {
      console.error('❌ Error starting retention flow:', error);
      // On error, allow normal cancel
      this.allowCancel(data);
    }
  }

  /**
   * Start retention flow with backend
   */
  async startRetentionFlow() {
    try {
      const response = await this.apiClient.startRetentionFlow(
        this.userId,
        this.plan,
        this.region
      );

      if (response.success && response.flow) {
        return response.flow;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to start retention flow:', error);
      throw error;
    }
  }

  /**
   * Show retention flow modal
   */
  showRetentionFlow(flow) {
    if (!flow || !flow.steps || flow.steps.length === 0) {
      console.warn('⚠️  Invalid flow data');
      return;
    }

    this.modal.show(flow, {
      onDecision: async (decision) => {
        return await this.handleUserDecision(decision);
      },
      onClose: () => {
        // Allow normal cancel flow
        console.log('User chose to continue canceling');
      },
    });
  }

  /**
   * Handle user decision
   */
  async handleUserDecision(decision) {
    try {
      const response = await this.apiClient.sendDecision(
        decision.flowId,
        decision.offerType,
        decision.accepted,
        decision.revenueValue || null
      );

      if (response.success) {
        console.log('✅ Decision processed successfully:', response);
        return response;
      } else {
        throw new Error(response.message || 'Failed to process decision');
      }
    } catch (error) {
      console.error('❌ Error sending decision:', error);
      throw error;
    }
  }

  /**
   * Allow normal cancel (fallback)
   */
  allowCancel(data) {
    // Restore original behavior
    if (data.originalHref && data.element.tagName === 'A') {
      window.location.href = data.originalHref;
    } else if (data.originalOnClick) {
      data.originalOnClick.call(data.element, data.event);
    }
  }

  /**
   * Destroy widget instance
   */
  destroy() {
    if (this.detector) {
      this.detector.destroy();
    }
    if (this.modal) {
      this.modal.hide();
    }
    console.log('✅ RetentionOS Widget destroyed');
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.RetentionOS = RetentionOS;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RetentionOS;
}

export default RetentionOS;

