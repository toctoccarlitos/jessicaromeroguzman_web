// Actualizar la clase MobileDashboardHandler

class MobileDashboardHandler {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.mobileOverlay = document.getElementById('mobile-overlay');
        this.mobileMenuButton = document.getElementById('mobile-menu-button');
        this.init();
    }

    init() {
        if (!this.sidebar || !this.mobileOverlay || !this.mobileMenuButton) {
            console.error('Required elements not found');
            return;
        }

        // Asignar eventos
        this.mobileMenuButton.addEventListener('click', () => this.toggleMobileMenu());
        this.mobileOverlay.addEventListener('click', () => this.closeMobileMenu());
        
        // Manejar eventos de teclas
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeMobileMenu();
        });

        // Manejar cambios de orientación/resize
        window.addEventListener('resize', () => this.handleResize());
    }

    toggleMobileMenu() {
        if (this.sidebar.classList.contains('mobile-open')) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        this.sidebar.classList.add('mobile-open');
        this.mobileOverlay.classList.add('visible');
        document.body.classList.add('mobile-menu-open');
        this.mobileMenuButton.setAttribute('aria-expanded', 'true');
    }

    closeMobileMenu() {
        this.sidebar.classList.remove('mobile-open');
        this.mobileOverlay.classList.remove('visible');
        document.body.classList.remove('mobile-menu-open');
        this.mobileMenuButton.setAttribute('aria-expanded', 'false');
    }

    handleResize() {
        const isDesktop = window.innerWidth >= 1024;
        if (isDesktop) {
            this.closeMobileMenu();
            this.enableDesktopMode();
        } else {
            this.enableMobileMode();
        }
    }

    enableDesktopMode() {
        this.sidebar.style.transform = '';
        document.body.classList.remove('mobile-menu-open');
    }

    enableMobileMode() {
        if (!this.sidebar.classList.contains('mobile-open')) {
            this.sidebar.style.transform = 'translateX(-100%)';
        }
    }
}

// Exportar la clase
export { MobileDashboardHandler };