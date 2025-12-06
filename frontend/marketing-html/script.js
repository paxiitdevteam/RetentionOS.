// Mobile Menu Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('active');
    }
});

// Animate Stats on Scroll
const animateStats = () => {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseFloat(entry.target.getAttribute('data-target'));
                const duration = 2000;
                const increment = target / (duration / 16);
                let current = 0;
                
                const updateNumber = () => {
                    current += increment;
                    if (current < target) {
                        entry.target.textContent = Math.floor(current);
                        requestAnimationFrame(updateNumber);
                    } else {
                        entry.target.textContent = target;
                    }
                };
                
                updateNumber();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => observer.observe(stat));
};

// Smooth Scroll - only for anchor links (not dashboard links)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    const href = anchor.getAttribute('href');
    const id = anchor.getAttribute('id');
    
    // Skip dashboard/login/trial links - they're handled by PMS
    if (href === '#' && id && (id.includes('login') || id.includes('dashboard') || id.includes('trial') || id.includes('started') || id.includes('pricing'))) {
        return; // Let PMS handle it
    }
    
    // Only handle actual anchor links (like #section)
    if (href && href.length > 1 && href.startsWith('#')) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            try {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            } catch (err) {
                // Invalid selector, ignore
                console.warn('Invalid selector:', href);
            }
        });
    }
});

// Initialize PMS Links
const initPMSLinks = () => {
    // Wait for PMS to be available
    if (typeof PMS === 'undefined') {
        setTimeout(initPMSLinks, 100);
        return;
    }
    
    // Update all dashboard links by ID
    const dashboardLinkIds = ['loginLink', 'getStartedLink', 'heroTrialLink', 'ctaTrialLink', 'footerDashboardLink', 'pricingStarterBtn', 'pricingProBtn'];
    dashboardLinkIds.forEach(id => {
        const link = document.getElementById(id);
        if (link) {
            const dashboardUrl = PMS.getDashboardUrl('/login');
            link.href = dashboardUrl;
            // Remove any existing onclick handlers
            link.onclick = null;
            // Add click handler
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = dashboardUrl;
            });
        }
    });
    
    // Update any remaining dashboard links with IDs (fallback)
    document.querySelectorAll('a[href="#"]').forEach(link => {
        const id = link.getAttribute('id');
        if (id && (id.includes('login') || id.includes('dashboard') || id.includes('trial') || id.includes('started') || id.includes('pricing'))) {
            const dashboardUrl = PMS.getDashboardUrl('/login');
            link.href = dashboardUrl;
            link.onclick = null; // Remove any existing onclick
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = dashboardUrl;
            });
        }
    });
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    animateStats();
    initPMSLinks();
    
    // Set active nav link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || (currentPage === '' && linkHref === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Scroll to Top Button
const createScrollToTop = () => {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'scroll-to-top';
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: var(--primary-blue);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 1.5rem;
        cursor: pointer;
        display: none;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s;
    `;
    
    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            button.style.display = 'block';
        } else {
            button.style.display = 'none';
        }
    });
    
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
        button.style.background = 'var(--primary-light)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.background = 'var(--primary-blue)';
    });
    
    document.body.appendChild(button);
};

createScrollToTop();

