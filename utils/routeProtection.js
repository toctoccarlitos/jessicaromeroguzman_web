import { authService } from '../services/authService.js';

class RouteProtection {
    constructor() {
        this.publicRoutes = [
            '/',
            '/index.html',
            '/terminos.html',
            '/politicas.html',
            '/cookies.html'
        ];

        this.authRoutes = [
            '/login.html',
            '/recuperar-password.html'
        ];

        this.protectedRoutes = [
            '/dashboard.html',
            '/profile.html',
            '/users.html'
        ];
    }

    async validateRoute() {
        const currentPath = window.location.pathname;
        const hasToken = !!localStorage.getItem('token');

        try {
            if (hasToken) {
                // Verificar si el token es válido
                const isValidToken = await this.verifyToken();

                if (isValidToken) {
                    // Si el token es válido y está en una ruta de auth, redirigir al dashboard
                    if (this.isAuthRoute(currentPath)) {
                        window.location.href = '/dashboard.html';
                        return false;
                    }
                    return true;
                } else {
                    // Si el token no es válido, limpiar y redirigir según la ruta
                    this.clearSession();
                    if (this.isProtectedRoute(currentPath)) {
                        this.redirectToLogin();
                        return false;
                    }
                }
            } else {
                // Sin token, verificar si necesita autenticación
                if (this.isProtectedRoute(currentPath)) {
                    this.redirectToLogin();
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Error validating route:', error);
            if (this.isProtectedRoute(currentPath)) {
                this.redirectToLogin();
                return false;
            }
            return true;
        }
    }

    async verifyToken() {
        try {
            // Intentar obtener el perfil como verificación del token
            await authService.getProfile();
            return true;
        } catch (error) {
            // Si hay error 401, intentar refresh token
            if (error.status === 401) {
                try {
                    await authService.refreshToken();
                    return true;
                } catch (refreshError) {
                    return false;
                }
            }
            return false;
        }
    }

    isPublicRoute(path) {
        return this.publicRoutes.some(route => path === route);
    }

    isAuthRoute(path) {
        return this.authRoutes.some(route => path === route);
    }

    isProtectedRoute(path) {
        return this.protectedRoutes.some(route => path === route);
    }

    redirectToLogin() {
        const currentUrl = window.location.href;
        sessionStorage.setItem('redirectUrl', currentUrl);
        window.location.href = '/login.html';
    }

    clearSession() {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userProfile');
    }
}

export const routeProtection = new RouteProtection();