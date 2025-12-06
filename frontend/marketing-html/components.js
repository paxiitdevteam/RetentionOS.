/**
 * Header and Footer Component Loader
 * Loads consistent header and footer across all pages
 */

class ComponentLoader {
    constructor() {
        this.headerLoaded = false;
        this.footerLoaded = false;
    }

    /**
     * Load header component
     */
    async loadHeader() {
        if (this.headerLoaded) return;
        
        try {
            const response = await fetch('components/header.html');
            if (!response.ok) throw new Error('Failed to load header');
            
            const html = await response.text();
            const headerPlaceholder = document.getElementById('header-placeholder');
            
            if (headerPlaceholder) {
                headerPlaceholder.outerHTML = html;
                this.headerLoaded = true;
                this.initHeader();
            }
        } catch (error) {
            console.error('Error loading header:', error);
        }
    }

    /**
     * Load footer component
     */
    async loadFooter() {
        if (this.footerLoaded) return;
        
        try {
            const response = await fetch('components/footer.html');
            if (!response.ok) throw new Error('Failed to load footer');
            
            const html = await response.text();
            const footerPlaceholder = document.getElementById('footer-placeholder');
            
            if (footerPlaceholder) {
                footerPlaceholder.outerHTML = html;
                this.footerLoaded = true;
                this.initFooter();
            }
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    }

    /**
     * Initialize header functionality
     */
    initHeader() {
        // Mobile menu toggle
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // Set active page
        const currentPage = this.getCurrentPage();
        const navLinks = document.querySelectorAll('.nav-link[data-page]');
        navLinks.forEach(link => {
            if (link.getAttribute('data-page') === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Initialize PMS links
        this.initPMSLinks();
    }

    /**
     * Initialize footer functionality
     */
    initFooter() {
        // Initialize PMS links in footer
        this.initPMSLinks();
    }

    /**
     * Get current page identifier
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        if (filename === 'index.html' || filename === '') return 'home';
        if (filename === 'features.html') return 'features';
        if (filename === 'pricing.html') return 'pricing';
        if (filename === 'integration.html') return 'integration';
        if (filename === 'about.html') return 'about';
        if (filename === 'contact.html') return 'contact';
        
        return '';
    }

    /**
     * Initialize PMS links
     */
    initPMSLinks() {
        if (typeof PMS === 'undefined') {
            setTimeout(() => this.initPMSLinks(), 100);
            return;
        }

        // Update all dashboard links
        const dashboardLinks = document.querySelectorAll('#loginLink, #getStartedLink, #heroTrialLink, #ctaTrialLink, #footerDashboardLink, #pricingStarterBtn, #pricingProBtn');
        dashboardLinks.forEach(link => {
            if (link) {
                link.href = PMS.getDashboardUrl('/login');
            }
        });
    }

    /**
     * Load all components
     */
    async loadAll() {
        await Promise.all([
            this.loadHeader(),
            this.loadFooter()
        ]);
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const loader = new ComponentLoader();
        loader.loadAll();
    });
} else {
    const loader = new ComponentLoader();
    loader.loadAll();
}

