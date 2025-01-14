import { authService } from '../services/authService.js';

class AuthManager {
    constructor() {
        this.publicRoutes = [
            '/',
            '/index.html',
            '/terminos.html',
            '/politicas.html',
            '/cookies.html'
        ];
        
        this.protectedRoutes = [
            '/dashboard.html',
            '/profile.html',
            '/users.html'
        ];
        
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        const currentPath = window.location.pathname;
        
        // No inicializar verificaciones de autenticación en rutas públicas
        if (this.isPublicRoute(currentPath)) {
            this.initialized = true;
            return;
        }

        // Verificar autenticación en carga inicial
        await this.checkAuth();

        // Configurar verificación periódica del token solo si es ruta protegida
        if (this.isProtectedRoute(currentPath)) {
            this.startTokenCheck();
            this.setupInactivityDetection();
        }

        this.initialized = true;
    }

    isPublicRoute(path) {
        return this.publicRoutes.some(route => 
            path === route || 
            path === route + '/' || 
            path.startsWith(route + '#')
        );
    }

    isProtectedRoute(path) {
        return this.protectedRoutes.some(route => 
            path === route || 
            path === route + '/' || 
            path.startsWith(route + '#')
        );
    }

    async checkAuth() {
        const currentPath = window.location.pathname;
        const isProtectedRoute = this.isProtectedRoute(currentPath);

        try {
            const isAuthenticated = await this.verifyAuthentication();

            if (!isAuthenticated && isProtectedRoute) {
                // Si no está autenticado y trata de acceder a ruta protegida
                this.redirectToLogin();
                return false;
            }

            if (isAuthenticated && currentPath === '/login.html') {
                // Si está autenticado y trata de acceder al login
                window.location.href = '/dashboard.html';
                return false;
            }

            // Si está autenticado y en una ruta protegida, actualizar UI
            if (isAuthenticated && isProtectedRoute) {
                await this.updateAuthenticatedUI();
            }

            return true;
        } catch (error) {
            console.error('Error checking auth:', error);
            if (isProtectedRoute) {
                this.redirectToLogin();
                return false;
            }
            return true;
        }
    }

    async verifyAuthentication() {
        const token = localStorage.getItem('token');
        if (!token) return false;

        try {
            // Intentar obtener el perfil como verificación
            await authService.getProfile();
            return true;
        } catch (error) {
            // Si hay error, intentar refresh
            try {
                await authService.refreshToken();
                return true;
            } catch (refreshError) {
                return false;
            }
        }
    }

    startTokenCheck() {
        // Limpiar intervalo existente si lo hay
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
        }

        // Verificar token cada 4 minutos
        this.tokenCheckInterval = setInterval(async () => {
            try {
                if (!await this.verifyAuthentication()) {
                    this.handleLogout();
                }
            } catch (error) {
                console.error('Error checking token:', error);
            }
        }, 4 * 60 * 1000);
    }

    setupInactivityDetection() {
        let inactivityTimeout;
        const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutos

        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimeout);
            inactivityTimeout = setTimeout(() => {
                this.handleLogout();
            }, INACTIVE_TIMEOUT);
        };

        // Eventos para resetear el timer de inactividad
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetInactivityTimer);
        });

        // Iniciar el timer
        resetInactivityTimer();
    }

    isPublicRoute(path) {
        return this.publicRoutes.some(route => path === route || path.startsWith(route));
    }

    isProtectedRoute(path) {
        return this.protectedRoutes.some(route => path === route || path.startsWith(route));
    }

    redirectToLogin() {
        sessionStorage.setItem('redirectUrl', window.location.href);
        window.location.href = '/login.html';
    }

    async updateAuthenticatedUI() {
        try {
            const profile = await authService.getProfile();

            // Actualizar elementos de UI
            const userNameElements = document.querySelectorAll('.user-name');
            userNameElements.forEach(element => {
                element.textContent = profile.email || 'Usuario';
            });

            // Configurar botón de logout
            const logoutButtons = document.querySelectorAll('#logout-button');
            logoutButtons.forEach(button => {
                button.addEventListener('click', () => this.handleLogout());
            });

            // Otras actualizaciones de UI basadas en el rol
            if (profile.roles?.includes('ROLE_ADMIN')) {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.classList.remove('hidden');
                });
            }
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    async handleLogout() {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            this.clearSession();
            window.location.href = '/login.html';
        }
    }

    clearSession() {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userProfile');

        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
        }
    }

    hasRole(requiredRole) {
        try {
            const profile = JSON.parse(localStorage.getItem('userProfile'));
            return profile?.roles?.includes(requiredRole) || false;
        } catch {
            return false;
        }
    }
}

// Crear instancia única
export const authManager = new AuthManager();