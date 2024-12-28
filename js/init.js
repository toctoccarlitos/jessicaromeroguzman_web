import { ComponentLoader } from './components/ComponentLoader.js';
import { CookieConsentManager } from './analytics/analytics.js';
import { smoothScroll } from './utils/dom-utils.js';
import { authManager } from './utils/authManager.js';
import { routeProtection } from './utils/routeProtection.js';

export async function initializePage() {
    try {
        // Primero validar la ruta y autenticación
        const currentPath = window.location.pathname;

        // Validar si el usuario está autenticado y está intentando acceder al login
        if (currentPath.includes('login.html')) {
            const token = localStorage.getItem('token');
            if (token) {
                // Intentar verificar si el token es válido
                try {
                    const isValid = await routeProtection.verifyToken();
                    if (isValid) {
                        // Si el token es válido, redirigir al dashboard
                        window.location.href = '/dashboard.html';
                        return;
                    }
                } catch (error) {
                    console.error('Error verifying token:', error);
                    // Si hay error, limpiar la sesión
                    routeProtection.clearSession();
                }
            }
        }

        // Para otras rutas protegidas, validar normalmente
        if (!currentPath.includes('index.html')) {
            const canContinue = await routeProtection.validateRoute();
            if (!canContinue) return;
        }

        // Inicializar el gestor de autenticación
        await authManager.init();

        // Inicializar cargador de componentes
        const componentLoader = new ComponentLoader();
        await componentLoader.init();

        // Inicializar Analytics
        const analytics = new CookieConsentManager({
            trackingId: 'G-T6CXB9CQYT',
            showDelay: 1800
        });
        await analytics.init();

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

function initializeContactForm(form) {
    const termsCheckbox = document.getElementById('terms');
    const submitButton = document.getElementById('submitButton');

    if (form && termsCheckbox && submitButton) {
        const validateForm = () => {
            let isValid = form.checkValidity();
            if (isValid) {
                // Validaciones adicionales aquí si las necesitas
            }
            submitButton.disabled = !isValid || !termsCheckbox.checked;
        };

        termsCheckbox.addEventListener('change', validateForm);
        form.addEventListener('input', validateForm);

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitButton.textContent = 'Enviando...';
            submitButton.disabled = true;

            // Simulación de envío
            setTimeout(() => {
                alert('¡Mensaje enviado con éxito! Me pondré en contacto contigo pronto.');
                form.reset();
                submitButton.textContent = 'Enviar Mensaje';
                submitButton.disabled = true;
                termsCheckbox.checked = false;
            }, 1500);
        });
    }
}

function initializeNewsletterForm(form) {
    if (form) {
        const submitButton = form.querySelector('button[type="submit"]');
        const termsCheckbox = form.querySelector('#newsletter-terms');

        if (submitButton && termsCheckbox) {
            const validateForm = () => {
                const isValid = form.checkValidity();
                submitButton.disabled = !isValid || !termsCheckbox.checked;
            };

            termsCheckbox.addEventListener('change', validateForm);
            form.addEventListener('input', validateForm);

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                // Lógica de envío del newsletter aquí
                alert('¡Gracias por suscribirte!');
                form.reset();
            });
        }
    }
}