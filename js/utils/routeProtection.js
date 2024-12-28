// js/utils/routeProtection.js
import { authService } from '../services/authService.js';

class RouteProtection {
    constructor() {
        // Rutas que siempre son accesibles
        this.publicRoutes = [
            '/',
            '/index.html',
            '/terminos.html',
            '/politicas.html',
            '/cookies.html'
        ];

        // Rutas relacionadas con autenticación
        this.authRoutes = [
            '/login.html',
            '/recuperar-password.html'
        ];

        // Rutas que requieren autenticación
        this.protectedRoutes = [
            '/dashboard.html',
            '/profile.html',
            '/users.html'
        ];
    }

    async validateRoute() {
        const currentPath = window.location.pathname;

        // Siempre permitir acceso a rutas públicas
        if (this.isPublicRoute(currentPath)) {
            console.log('Ruta pública, acceso permitido');
            return true;
        }

        const hasToken = !!localStorage.getItem('token');
        const hasRefreshToken = !!localStorage.getItem('refresh_token');

        try {
            // Verificar si tenemos ambos tokens
            if (hasToken && hasRefreshToken) {
                console.log('Tokens encontrados, verificando validez...');
                const isValidToken = await this.verifyToken();

                if (isValidToken) {
                    console.log('Token válido');
                    // Si el token es válido y está en una ruta de auth, redirigir al dashboard
                    if (this.isAuthRoute(currentPath)) {
                        console.log('Redirigiendo a dashboard desde ruta de auth');
                        window.location.href = '/dashboard.html';
                        return false;
                    }
                    return true;
                } else {
                    console.log('Token inválido, limpiando sesión');
                    // Si el token no es válido, limpiar y redirigir según la ruta
                    this.clearSession();
                    if (this.isProtectedRoute(currentPath)) {
                        this.redirectToLogin();
                        return false;
                    }
                }
            } else {
                // Sin tokens, verificar si necesita autenticación
                if (this.isProtectedRoute(currentPath)) {
                    console.log('Ruta protegida, redirigiendo a login');
                    this.redirectToLogin();
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Error validating route:', error);
            // Si hay error en ruta protegida, redirigir a login
            if (this.isProtectedRoute(currentPath)) {
                this.clearSession();
                this.redirectToLogin();
                return false;
            }
            return true;
        }
    }

    async verifyToken() {
        try {
            // Primero verificar si tenemos los tokens necesarios
            const token = localStorage.getItem('token');
            const refreshToken = localStorage.getItem('refresh_token');

            if (!token || !refreshToken) {
                return false;
            }

            // Intentar obtener el perfil
            try {
                await authService.getProfile();
                return true;
            } catch (error) {
                if (error.status === 401) {
                    // Si es un error de autorización, intentar refresh
                    try {
                        const response = await httpInterceptor.fetch('/refresh', {
                            method: 'POST',
                            body: JSON.stringify({
                                refresh_token: refreshToken
                            })
                        });

                        if (response.data?.access_token) {
                            localStorage.setItem('token', response.data.access_token);
                            if (response.data.refresh_token) {
                                localStorage.setItem('refresh_token', response.data.refresh_token);
                            }
                            return true;
                        }
                    } catch (refreshError) {
                        console.error('Error refreshing token:', refreshError);
                        return false;
                    }
                }
                return false;
            }
        } catch (error) {
            console.error('Error verifying token:', error);
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
        // No guardar rutas de auth en redirectUrl
        if (!this.isAuthRoute(window.location.pathname)) {
            sessionStorage.setItem('redirectUrl', currentUrl);
        }
        window.location.href = '/login.html';
    }

    clearSession() {
        console.log('Limpiando sesión');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userProfile');
    }
}

export const routeProtection = new RouteProtection();