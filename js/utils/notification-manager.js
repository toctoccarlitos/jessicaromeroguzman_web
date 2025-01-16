// js/utils/notification-manager.js
class NotificationManager {
    constructor() {
        this.notificationElement = null;
        this.timeout = null;
        this.init();
    }

    init() {
        if (!document.getElementById('global-notification')) {
            const notificationHTML = `
                <div id="global-notification" class="notification-overlay">
                    <div class="notification-content">
                        <div class="notification-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h3 class="notification-title">Éxito</h3>
                        <p class="notification-message"></p>
                        <button class="notification-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML('beforeend', notificationHTML);
            this.notificationElement = document.getElementById('global-notification');

            // Configurar el botón de cerrar
            const closeButton = this.notificationElement.querySelector('.notification-close');
            closeButton.addEventListener('click', () => this.hide());

            // Cerrar al hacer clic fuera
            this.notificationElement.addEventListener('click', (e) => {
                if (e.target === this.notificationElement) {
                    this.hide();
                }
            });

            // Cerrar con la tecla ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.notificationElement.classList.contains('visible')) {
                    this.hide();
                }
            });
        }
    }

    show(options = {}) {
        const {
            type = 'success',
            title = 'Éxito',
            message = '',
            duration = 3000,
            showClose = true
        } = options;

        if (!this.notificationElement) this.init();

        // Limpiar timeout anterior si existe
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        // Configurar tipo de notificación
        const iconElement = this.notificationElement.querySelector('.notification-icon i');
        iconElement.className = this.getIconClass(type);

        // Actualizar contenido
        this.notificationElement.querySelector('.notification-title').textContent = title;
        this.notificationElement.querySelector('.notification-message').textContent = message;

        // Aplicar estilos según el tipo
        this.notificationElement.setAttribute('data-type', type);

        // Mostrar/ocultar botón de cerrar
        const closeButton = this.notificationElement.querySelector('.notification-close');
        closeButton.style.display = showClose ? 'block' : 'none';

        // Mostrar notificación
        this.notificationElement.classList.add('visible');

        // Auto-ocultar después del tiempo especificado
        if (duration > 0) {
            this.timeout = setTimeout(() => this.hide(), duration);
        }
    }

    hide() {
        if (!this.notificationElement) return;

        this.notificationElement.classList.remove('visible');
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    getIconClass(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }
}

export const notificationManager = new NotificationManager();