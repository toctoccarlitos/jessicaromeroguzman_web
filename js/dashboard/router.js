export class DashboardRouter {
    constructor() {
        this.routes = new Map();
        this.contentContainer = document.getElementById('main-content');
        this.currentView = null;

        // Mapear las rutas a las ubicaciones de los templates
        this.viewPaths = {
            '/dashboard': '/views/home/index.html',
            '/newsletter': '/views/newsletter/index.html'
        };

        // Configurar navegación
        this.setupNavigation();
    }

    addRoute(path, viewClass) {
        this.routes.set(path, viewClass);
    }

    async navigate(path) {
        try {
            console.log('Navigating to:', path);
            const viewClass = this.routes.get(path);
            if (!viewClass) {
                console.error(`Route not found: ${path}`);
                return;
            }

            // Obtener la ruta correcta del template
            const templatePath = this.viewPaths[path];
            if (!templatePath) {
                throw new Error(`Template path not found for route: ${path}`);
            }

            console.log('Loading template from:', templatePath);
            const response = await fetch(templatePath);

            if (!response.ok) {
                console.error('Template load error:', response.statusText);
                throw new Error(`Error loading template: ${response.statusText}`);
            }

            const html = await response.text();
            console.log('Template loaded successfully');

            // Limpiar la vista actual antes de insertar la nueva
            if (this.currentView) {
                console.log('Cleaning up previous view');
                this.currentView = null;
            }

            // Insertar el nuevo contenido
            this.contentContainer.innerHTML = html;
            console.log('Template inserted into DOM');

            // Inicializar la nueva vista
            console.log('Initializing new view');
            this.currentView = new viewClass();
            await this.currentView.init();
            console.log('View initialized successfully');

            // Actualizar la navegación
            this.updateActiveNavItem(path);

        } catch (error) {
            console.error('Navigation error:', {
                error: error.message,
                stack: error.stack,
                path: path
            });

            // Mostrar un mensaje de error más amigable al usuario
            if (error.message.includes('Failed to fetch')) {
                alert('Error de conexión: No se pudo cargar la vista. Por favor, verifica tu conexión.');
            } else {
                alert('Error al cargar la vista: ' + error.message);
            }
        }
    }

    setupNavigation() {
        document.querySelectorAll('[data-route]').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.currentTarget.dataset.route;
                this.navigate(route);

                // En móvil, cerrar el menú si está abierto
                const sidebar = document.getElementById('sidebar');
                const mobileOverlay = document.getElementById('mobile-overlay');
                if (sidebar && sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                    if (mobileOverlay) {
                        mobileOverlay.classList.remove('visible');
                    }
                    document.body.classList.remove('mobile-menu-open');
                }
            });
        });
    }

    updateActiveNavItem(path) {
        // Remover clase activa de todos los items
        document.querySelectorAll('[data-route]').forEach(element => {
            element.classList.remove('active');
        });

        // Agregar clase activa al item actual
        const activeItem = document.querySelector(`[data-route="${path}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    showError(message) {
        console.error(message);
        alert(message);
    }
}