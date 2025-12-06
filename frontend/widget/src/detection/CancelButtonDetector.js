/**
 * Cancel Button Detector
 * Detects cancel button clicks using multiple strategies
 * Supports SPA and dynamic content
 */

class CancelButtonDetector {
  constructor(config = {}) {
    // Default selectors for common cancel button patterns
    this.selectors = config.selectors || [
      // Common button text patterns
      'button:contains("Cancel")',
      'button:contains("Cancel Subscription")',
      'button:contains("Unsubscribe")',
      'a:contains("Cancel")',
      'a:contains("Cancel Subscription")',
      'a:contains("Unsubscribe")',
      
      // Common class names
      '.cancel-button',
      '.cancel-subscription',
      '.unsubscribe',
      '.cancel-btn',
      '[class*="cancel"]',
      '[class*="unsubscribe"]',
      
      // Common data attributes
      '[data-action="cancel"]',
      '[data-cancel]',
      '[data-unsubscribe]',
      '[data-retentionos="cancel"]',
      
      // Common IDs
      '#cancel',
      '#cancel-subscription',
      '#unsubscribe',
      
      // Stripe-specific patterns
      '[data-testid*="cancel"]',
      '[aria-label*="cancel" i]',
      '[aria-label*="unsubscribe" i]',
    ];
    
    // Custom selectors from config
    if (config.customSelectors) {
      this.selectors = [...this.selectors, ...config.customSelectors];
    }
    
    // Event handlers
    this.onCancelDetected = config.onCancelDetected || null;
    
    // State
    this.isInitialized = false;
    this.observer = null;
    this.delegatedHandler = null;
    
    // MutationObserver for SPA support
    this.observeMutations = config.observeMutations !== false;
  }

  /**
   * Initialize detection
   */
  init() {
    if (this.isInitialized) {
      return;
    }

    // Setup event delegation on document
    this.setupEventDelegation();
    
    // Setup MutationObserver for dynamic content
    if (this.observeMutations) {
      this.setupMutationObserver();
    }
    
    // Scan existing DOM
    this.scanExistingElements();
    
    this.isInitialized = true;
    console.log('✅ CancelButtonDetector initialized');
  }

  /**
   * Setup event delegation for cancel button clicks
   */
  setupEventDelegation() {
    // Use event delegation on document to catch all clicks
    this.delegatedHandler = (event) => {
      const target = event.target;
      
      // Check if clicked element matches any cancel pattern
      if (this.isCancelButton(target)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Call handler
        if (this.onCancelDetected) {
          this.onCancelDetected({
            element: target,
            event: event,
            originalHref: target.href,
            originalOnClick: target.onclick,
          });
        }
        
        return false;
      }
    };
    
    // Use capture phase to intercept before other handlers
    document.addEventListener('click', this.delegatedHandler, true);
  }

  /**
   * Setup MutationObserver to watch for dynamically added elements
   */
  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check if the added node is a cancel button
            if (this.isCancelButton(node)) {
              // Already handled by event delegation, but we can log it
              console.log('🔍 Cancel button detected in new content:', node);
            }
            
            // Check for cancel buttons within the added node
            const cancelButtons = this.findCancelButtons(node);
            if (cancelButtons.length > 0) {
              console.log(`🔍 Found ${cancelButtons.length} cancel button(s) in new content`);
            }
          }
        });
      });
    });

    // Observe document for changes
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Check if an element is a cancel button
   */
  isCancelButton(element) {
    if (!element || element.nodeType !== 1) {
      return false;
    }

    // Check text content
    const text = (element.textContent || '').toLowerCase().trim();
    const cancelTexts = ['cancel', 'unsubscribe', 'cancel subscription', 'end subscription'];
    if (cancelTexts.some(cancelText => text.includes(cancelText))) {
      return true;
    }

    // Check attributes
    const attributes = ['data-action', 'data-cancel', 'data-unsubscribe', 'data-retentionos', 'aria-label'];
    for (const attr of attributes) {
      const value = element.getAttribute(attr);
      if (value && /cancel|unsubscribe/i.test(value)) {
        return true;
      }
    }

    // Check class names
    const className = element.className || '';
    if (typeof className === 'string' && /cancel|unsubscribe/i.test(className)) {
      return true;
    }

    // Check ID
    const id = element.id || '';
    if (/cancel|unsubscribe/i.test(id)) {
      return true;
    }

    // Check href for links
    if (element.tagName === 'A') {
      const href = element.href || '';
      if (/cancel|unsubscribe/i.test(href)) {
        return true;
      }
    }

    // Check data-testid (common in React apps)
    const testId = element.getAttribute('data-testid') || '';
    if (/cancel|unsubscribe/i.test(testId)) {
      return true;
    }

    // Check custom selectors
    for (const selector of this.selectors) {
      try {
        // Handle :contains() pseudo-selector (not native, but common pattern)
        if (selector.includes(':contains(')) {
          const baseSelector = selector.split(':contains(')[0];
          const containsText = selector.match(/:contains\("([^"]+)"\)/)?.[1];
          if (containsText) {
            const elements = document.querySelectorAll(baseSelector);
            for (const el of elements) {
              if (el.textContent.includes(containsText) && el === element) {
                return true;
              }
            }
          }
        } else {
          // Standard CSS selector
          if (element.matches && element.matches(selector)) {
            return true;
          }
        }
      } catch (e) {
        // Invalid selector, skip
        console.warn('Invalid selector:', selector);
      }
    }

    return false;
  }

  /**
   * Find all cancel buttons in a container
   */
  findCancelButtons(container = document) {
    const buttons = [];
    
    // Check all buttons and links
    const candidates = container.querySelectorAll('button, a, [role="button"]');
    
    for (const candidate of candidates) {
      if (this.isCancelButton(candidate)) {
        buttons.push(candidate);
      }
    }
    
    return buttons;
  }

  /**
   * Scan existing DOM for cancel buttons
   */
  scanExistingElements() {
    const buttons = this.findCancelButtons();
    if (buttons.length > 0) {
      console.log(`🔍 Found ${buttons.length} existing cancel button(s)`);
    }
    return buttons;
  }

  /**
   * Add custom selector
   */
  addSelector(selector) {
    if (!this.selectors.includes(selector)) {
      this.selectors.push(selector);
    }
  }

  /**
   * Remove selector
   */
  removeSelector(selector) {
    this.selectors = this.selectors.filter(s => s !== selector);
  }

  /**
   * Cleanup and destroy detector
   */
  destroy() {
    if (this.delegatedHandler) {
      document.removeEventListener('click', this.delegatedHandler, true);
      this.delegatedHandler = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.isInitialized = false;
    console.log('✅ CancelButtonDetector destroyed');
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.RetentionOSCancelButtonDetector = CancelButtonDetector;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CancelButtonDetector;
}

export default CancelButtonDetector;

