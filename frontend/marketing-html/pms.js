/**
 * Path Manager System (PMS) for Marketing Website
 * Centralized path management for consistent navigation
 */

const PMS = {
    // Base URLs
    baseUrl: window.location.origin,
    
    // Defaults for local dev; override with <meta name="retentionos-dashboard-url"> / retentionos-api-url>
    dashboardUrl: 'http://localhost:3001',
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
    
    // Initialize — optional <meta name="retentionos-dashboard-url" content="https://..."> (and api-url)
    init: function() {
        try {
            var dm = document.querySelector('meta[name="retentionos-dashboard-url"]');
            var am = document.querySelector('meta[name="retentionos-api-url"]');
            if (dm && dm.getAttribute('content') && dm.getAttribute('content').trim()) {
                this.dashboardUrl = dm.getAttribute('content').trim().replace(/\/$/, '');
            }
            if (am && am.getAttribute('content') && am.getAttribute('content').trim()) {
                this.apiUrl = am.getAttribute('content').trim().replace(/\/$/, '');
            }
        } catch (e) { /* SSR-safe */ }

        window.PMS = this;
    }
};

// Auto-initialize
PMS.init();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PMS;
}

