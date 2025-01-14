import { ComponentLoader } from './components/ComponentLoader.js';
import { CookieConsentManager } from './analytics/analytics.js';
import { smoothScroll } from './utils/dom-utils.js';
import { authManager } from './utils/authManager.js';
import { routeProtection } from './utils/routeProtection.js';
import { initializeContactForm } from './components/contact-form.js';
import { initializeNewsletterForm } from './components/newsletter-form.js';

export async function initializePage() {
    try {
        const currentPath = window.location.pathname;

        // 1. Solo validar rutas protegidas
        if (!routeProtection.isPublicRoute(currentPath)) {
            // Para rutas que no son públicas, validar acceso
            if (routeProtection.isProtectedRoute(currentPath)) {
                const canContinue = await routeProtection.validateRoute();
                if (!canContinue) return;
                await authManager.init();
            }
        }

        // 2. Inicialización común para todas las páginas
        const componentLoader = new ComponentLoader();
        await componentLoader.init();

        // 3. Inicializar Analytics
        const analytics = new CookieConsentManager({
            trackingId: 'G-T6CXB9CQYT',
            showDelay: 1800
        });
        await analytics.init();

        // 4. Inicializar características de UI
        initializeUIFeatures();

        return {
            componentLoader,
            analytics,
            authManager
        };
    } catch (error) {
        console.error('Error in initializePage:', error);
        throw error;
    }
}

function initializeUIFeatures() {
    // Configurar smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = anchor.getAttribute('href');
            smoothScroll(target);
        });
    });

    // Inicializar animaciones de scroll
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });
    }

    // Inicializar formularios
    initializeForms();
}

function initializeForms() {
    // Inicializar validación del formulario de contacto
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        initializeContactForm(contactForm);
    }

    // Inicializar validación del formulario de newsletter
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        initializeNewsletterForm(newsletterForm);
    }
}