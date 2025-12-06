/**
 * Path Manager System (PMS) for Marketing Website
 * Centralized path management for consistent navigation
 */

const PMS = {
    // Base URLs
    baseUrl: window.location.origin,
    
    // Dashboard URL
    dashboardUrl: 'http://localhost:3001',
    
    // API URL
    apiUrl: 'http://localhost:3000',
    
    // Marketing pages paths
    pages: {
        home: '/',
        features: '/features.html',
        pricing: '/pricing.html',
        about: '/about.html',
        contact: '/contact.html',
        privacy: '/privacy.html',
        terms: '/terms.html',
        cookies: '/cookies.html',
    },
    
    // Get full URL for a page
    getPageUrl: function(pageName) {
        const page = this.pages[pageName];
        if (!page) {
            console.warn(`Page "${pageName}" not found in PMS`);
            return this.baseUrl + '/';
        }
        return this.baseUrl + page;
    },
    
    // Get dashboard URL
    getDashboardUrl: function(path = '/login') {
        return this.dashboardUrl + path;
    },
    
    // Get API URL
    getApiUrl: function(endpoint = '') {
        return this.apiUrl + endpoint;
    },
    
    // Navigate to a page
    navigate: function(pageName) {
        window.location.href = this.getPageUrl(pageName);
    },
    
    // Check if running in production
    isProduction: function() {
        return window.location.hostname !== 'localhost' && 
               window.location.hostname !== '127.0.0.1';
    },
    
    // Initialize - update URLs based on environment
    init: function() {
        if (this.isProduction()) {
            // In production, use relative paths or configured domain
            this.dashboardUrl = 'https://dashboard.retentionos.com';
            this.apiUrl = 'https://api.retentionos.com';
        }
        
        // Make PMS available globally
        window.PMS = this;
    }
};

// Auto-initialize
PMS.init();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PMS;
}

