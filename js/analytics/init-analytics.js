import { CookieConsentManager } from './analytics.js';

// Inicializar el gestor de consentimiento de cookies
const cookieManager = new CookieConsentManager({
    trackingId: 'G-T6CXB9CQYT',
    consentDuration: 180, // días
    showDelay: 1800 // 1.8 segundos
});

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => cookieManager.init());
} else {
    cookieManager.init();
}