/**
 * Retention Modal Component
 * Displays retention flow steps to user
 * Per brand guidelines: Deep Blue (#003A78), Green (#1F9D55)
 */

class RetentionModal {
  constructor() {
    this.element = null;
    this.overlay = null;
    this.currentFlow = null;
    this.currentStepIndex = 0;
    this.onDecision = null;
    this.onClose = null;
  }

  /**
   * Initialize modal
   */
  init() {
    // Modal will be created on first show
  }

  /**
   * Show modal with flow
   */
  show(flow, callbacks = {}) {
    if (!flow || !flow.steps || flow.steps.length === 0) {
      console.error('Invalid flow data');
      return;
    }

    this.currentFlow = flow;
    this.currentStepIndex = 0;
    this.onDecision = callbacks.onDecision || null;
    this.onClose = callbacks.onClose || null;

    // Create modal if it doesn't exist
    if (!this.element) {
      this.createModal();
    }

    // Render first step
    this.renderStep(flow.steps[0]);

    // Show modal
    this.element.style.display = 'block';
    this.overlay.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Add animation
    setTimeout(() => {
      this.element.classList.add('retentionos-modal-visible');
      this.overlay.classList.add('retentionos-overlay-visible');
    }, 10);
  }

  /**
   * Create modal DOM structure
   */
  createModal() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'retentionos-overlay';
    this.overlay.addEventListener('click', () => this.hide());

    // Create modal container
    this.element = document.createElement('div');
    this.element.className = 'retentionos-modal';
    this.element.innerHTML = `
      <div class="retentionos-modal-content">
        <button class="retentionos-modal-close" aria-label="Close">&times;</button>
        <div class="retentionos-modal-header">
          <h2 class="retentionos-modal-title">Before you go</h2>
        </div>
        <div class="retentionos-modal-body">
          <div class="retentionos-step-container"></div>
        </div>
        <div class="retentionos-modal-footer">
          <div class="retentionos-loading" style="display: none;">
            <span>Processing...</span>
          </div>
          <div class="retentionos-error" style="display: none;"></div>
        </div>
      </div>
    `;

    // Close button handler
    const closeBtn = this.element.querySelector('.retentionos-modal-close');
    closeBtn.addEventListener('click', () => this.hide());

    // Append to body
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.element);

    // Inject styles
    this.injectStyles();
  }

  /**
   * Render current step
   */
  renderStep(step) {
    const container = this.element.querySelector('.retentionos-step-container');
    if (!container) return;

    // Clear previous step
    container.innerHTML = '';

    // Create step content
    const stepElement = document.createElement('div');
    stepElement.className = 'retentionos-step';

    // Step message
    if (step.message) {
      const messageEl = document.createElement('p');
      messageEl.className = 'retentionos-step-message';
      messageEl.textContent = step.message;
      stepElement.appendChild(messageEl);
    }

    // Step title
    if (step.title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'retentionos-step-title';
      titleEl.textContent = step.title;
      stepElement.insertBefore(titleEl, stepElement.firstChild);
    }

    // Step buttons based on type
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'retentionos-step-buttons';

    switch (step.type) {
      case 'pause':
        buttonsContainer.appendChild(this.createPauseButton(step));
        break;
      case 'downgrade':
        buttonsContainer.appendChild(this.createDowngradeButton(step));
        break;
      case 'discount':
        buttonsContainer.appendChild(this.createDiscountButton(step));
        break;
      case 'support':
        buttonsContainer.appendChild(this.createSupportButton(step));
        break;
      case 'feedback':
        buttonsContainer.appendChild(this.createFeedbackForm(step));
        break;
    }

    // Continue to cancel link
    const cancelLink = document.createElement('a');
    cancelLink.href = '#';
    cancelLink.className = 'retentionos-cancel-link';
    cancelLink.textContent = 'Continue to cancel';
    cancelLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleCancel();
    });

    stepElement.appendChild(buttonsContainer);
    stepElement.appendChild(cancelLink);
    container.appendChild(stepElement);
  }

  /**
   * Create pause button
   */
  createPauseButton(step) {
    const button = document.createElement('button');
    button.className = 'retentionos-button retentionos-button-primary';
    button.textContent = step.config?.buttonText || 'Pause Subscription';
    button.addEventListener('click', () => this.handleDecision('pause', true));
    return button;
  }

  /**
   * Create downgrade button
   */
  createDowngradeButton(step) {
    const button = document.createElement('button');
    button.className = 'retentionos-button retentionos-button-primary';
    button.textContent = step.config?.buttonText || 'Downgrade Plan';
    button.addEventListener('click', () => this.handleDecision('downgrade', true));
    return button;
  }

  /**
   * Create discount button
   */
  createDiscountButton(step) {
    const button = document.createElement('button');
    button.className = 'retentionos-button retentionos-button-primary';
    const discountText = step.config?.discountPercent 
      ? `Get ${step.config.discountPercent}% Off`
      : 'Apply Discount';
    button.textContent = step.config?.buttonText || discountText;
    button.addEventListener('click', () => this.handleDecision('discount', true));
    return button;
  }

  /**
   * Create support button
   */
  createSupportButton(step) {
    const button = document.createElement('button');
    button.className = 'retentionos-button retentionos-button-secondary';
    button.textContent = step.config?.buttonText || 'Contact Support';
    button.addEventListener('click', () => {
      if (step.config?.supportUrl) {
        window.open(step.config.supportUrl, '_blank');
      }
      this.handleDecision('support', false);
    });
    return button;
  }

  /**
   * Create feedback form
   */
  createFeedbackForm(step) {
    const form = document.createElement('form');
    form.className = 'retentionos-feedback-form';

    const textarea = document.createElement('textarea');
    textarea.className = 'retentionos-feedback-input';
    textarea.placeholder = step.config?.placeholder || 'Tell us why you\'re canceling...';
    textarea.rows = 4;
    textarea.required = step.config?.required || false;

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'retentionos-button retentionos-button-primary';
    submitButton.textContent = step.config?.buttonText || 'Submit Feedback';

    form.appendChild(textarea);
    form.appendChild(submitButton);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const feedback = textarea.value.trim();
      if (feedback || !step.config?.required) {
        this.handleDecision('feedback', false, feedback);
      }
    });

    return form;
  }

  /**
   * Handle user decision
   */
  async handleDecision(offerType, accepted, feedback = null) {
    // Show loading state
    this.showLoading();

    try {
      // Call decision callback
      if (this.onDecision) {
        await this.onDecision({
          flowId: this.currentFlow.flowId,
          offerType,
          accepted,
          feedback,
        });
      }

      // Show success state
      this.showSuccess(offerType, accepted);
    } catch (error) {
      console.error('Error processing decision:', error);
      this.showError(error.message || 'An error occurred');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Handle cancel (continue to cancel)
   */
  handleCancel() {
    this.hide();
    if (this.onClose) {
      this.onClose();
    }
  }

  /**
   * Update to next step
   */
  updateStep(step) {
    if (!this.currentFlow) return;
    this.renderStep(step);
  }

  /**
   * Show loading state
   */
  showLoading() {
    const loading = this.element.querySelector('.retentionos-loading');
    const error = this.element.querySelector('.retentionos-error');
    if (loading) loading.style.display = 'block';
    if (error) error.style.display = 'none';
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    const loading = this.element.querySelector('.retentionos-loading');
    if (loading) loading.style.display = 'none';
  }

  /**
   * Show error state
   */
  showError(message) {
    const error = this.element.querySelector('.retentionos-error');
    if (error) {
      error.textContent = message;
      error.style.display = 'block';
    }
  }

  /**
   * Show success state
   */
  showSuccess(offerType, accepted) {
    const container = this.element.querySelector('.retentionos-step-container');
    if (container) {
      container.innerHTML = `
        <div class="retentionos-success">
          <h3>${accepted ? 'Thank you!' : 'We appreciate your feedback'}</h3>
          <p>${accepted ? 'Your subscription has been updated.' : 'We\'ll review your feedback.'}</p>
        </div>
      `;
    }

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hide();
    }, 3000);
  }

  /**
   * Hide modal
   */
  hide() {
    if (!this.element) return;

    this.element.classList.remove('retentionos-modal-visible');
    this.overlay.classList.remove('retentionos-overlay-visible');

    setTimeout(() => {
      this.element.style.display = 'none';
      this.overlay.style.display = 'none';
      document.body.style.overflow = ''; // Restore scrolling
    }, 300);
  }

  /**
   * Inject modal styles
   */
  injectStyles() {
    if (document.getElementById('retentionos-modal-styles')) {
      return; // Styles already injected
    }

    const style = document.createElement('style');
    style.id = 'retentionos-modal-styles';
    style.textContent = `
      .retentionos-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9998;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .retentionos-overlay-visible {
        opacity: 1;
      }
      
      .retentionos-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      .retentionos-modal-visible {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      
      .retentionos-modal-content {
        padding: 24px;
        position: relative;
      }
      
      .retentionos-modal-close {
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 32px;
        height: 32px;
        line-height: 32px;
      }
      
      .retentionos-modal-close:hover {
        color: #333;
      }
      
      .retentionos-modal-header {
        margin-bottom: 20px;
      }
      
      .retentionos-modal-title {
        font-size: 24px;
        font-weight: 600;
        color: #003A78;
        margin: 0;
      }
      
      .retentionos-modal-body {
        margin-bottom: 20px;
      }
      
      .retentionos-step-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0 0 12px 0;
      }
      
      .retentionos-step-message {
        font-size: 16px;
        color: #666;
        margin: 0 0 20px 0;
        line-height: 1.5;
      }
      
      .retentionos-step-buttons {
        margin-bottom: 16px;
      }
      
      .retentionos-button {
        display: block;
        width: 100%;
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        margin-bottom: 12px;
        transition: background-color 0.2s ease;
      }
      
      .retentionos-button-primary {
        background: #003A78;
        color: white;
      }
      
      .retentionos-button-primary:hover {
        background: #002d5c;
      }
      
      .retentionos-button-secondary {
        background: #f5f5f5;
        color: #333;
      }
      
      .retentionos-button-secondary:hover {
        background: #e0e0e0;
      }
      
      .retentionos-feedback-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .retentionos-feedback-input {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        min-height: 100px;
      }
      
      .retentionos-feedback-input:focus {
        outline: none;
        border-color: #003A78;
      }
      
      .retentionos-cancel-link {
        display: block;
        text-align: center;
        color: #666;
        text-decoration: none;
        font-size: 14px;
        margin-top: 16px;
      }
      
      .retentionos-cancel-link:hover {
        color: #333;
        text-decoration: underline;
      }
      
      .retentionos-loading {
        text-align: center;
        color: #666;
        padding: 12px;
      }
      
      .retentionos-error {
        background: #fee;
        color: #c33;
        padding: 12px;
        border-radius: 6px;
        margin-top: 12px;
      }
      
      .retentionos-success {
        text-align: center;
        padding: 20px;
      }
      
      .retentionos-success h3 {
        color: #1F9D55;
        margin: 0 0 12px 0;
      }
      
      .retentionos-success p {
        color: #666;
        margin: 0;
      }
      
      @media (max-width: 480px) {
        .retentionos-modal {
          width: 95%;
          max-height: 95vh;
        }
        
        .retentionos-modal-content {
          padding: 16px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.RetentionOSModal = RetentionModal;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RetentionModal;
}

export default RetentionModal;
