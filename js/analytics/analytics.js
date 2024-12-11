let gtag;

async function initializeAnalytics(trackingId) {  // Ya no necesita ser exportada
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){dataLayer.push(arguments);}
    gtag = window.gtag;

    gtag('js', new Date());
    gtag('config', trackingId, {
        'send_page_view': false
    });

    // Retornar una promesa para el script
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function manageGoogleAnalytics(allow) {  // Ya no necesita ser exportada
    if (typeof gtag === 'function') {
        gtag('consent', 'update', {
            'analytics_storage': allow ? 'granted' : 'denied'
        });
    }
}

export class CookieConsentManager {
    constructor(options = {}) {
        this.options = {
            consentDuration: 180,
            showDelay: 1800,
            trackingId: null,
            ...options
        };
        this.banner = null;
    }

    async init() {
        try {
            // Llamar a initializeAnalytics dentro de la clase usando this
            await initializeAnalytics(this.options.trackingId);

            // Esperar a que el banner se cargue como componente
            setTimeout(() => {
                this.banner = document.getElementById('cookieConsent');
                if (this.banner) {
                    this.setupBannerListeners();
                    if (!this.checkCookieConsent()) {
                        setTimeout(() => this.showBanner(), this.options.showDelay);
                    }
                }
            }, 500);
        } catch (error) {
            console.error('Error initializing analytics:', error);
        }
    }

    setupBannerListeners() {
        const acceptButton = this.banner.querySelector('#acceptCookies');
        const rejectButton = this.banner.querySelector('#rejectCookies');

        if (acceptButton) {
            acceptButton.addEventListener('click', () => {
                this.savePreference(true);
                this.hideBanner();
            });
        }

        if (rejectButton) {
            rejectButton.addEventListener('click', () => {
                this.savePreference(false);
                this.hideBanner();
            });
        }
    }

    showBanner() {
        if (this.banner) {
            this.banner.style.transform = 'translateY(0)';
            this.banner.style.opacity = '1';
        }
    }

    hideBanner() {
        if (this.banner) {
            this.banner.style.transform = 'translateY(100%)';
            this.banner.style.opacity = '0';
        }
    }

    savePreference(accepted) {
        localStorage.setItem('cookieConsent', accepted);
        localStorage.setItem('cookieConsentDate', new Date().toISOString());
        manageGoogleAnalytics(accepted);
    }

    checkCookieConsent() {
        const consent = localStorage.getItem('cookieConsent');
        const consentDate = localStorage.getItem('cookieConsentDate');

        if (!consent || !consentDate ||
            (new Date() - new Date(consentDate)) > (this.options.consentDuration * 24 * 60 * 60 * 1000)) {
            return false;
        }

        manageGoogleAnalytics(consent === 'true');
        return true;
    }
}