// utils/authManager.js

import { authService } from '../services/authService.js';

export class AuthManager {
    constructor() {
        this.publicRoutes = [
            '/login.html',
            '/registro.html',
            '/recuperar-password.html',
            '/terminos.html',
            '/politicas.html',
            '/cookies.html'
        ];

        this.init();
    }

    init() {
        // Verificar autenticación en cada carga de página
        this.checkAuth();

        // Añadir listener para expiración de token
        this.setupTokenExpirationCheck();

        // Añadir interceptor para respuestas 401
        this.setupResponseInterceptor();
    }

    checkAuth() {
        const currentPath = window.location.pathname;
        const isPublicRoute = this.publicRoutes.includes(currentPath);
        const isAuthenticated = authService.isAuthenticated();

        if (!isPublicRoute && !isAuthenticated) {
            // Guardar la URL actual para redireccionar después del login
            sessionStorage.setItem('redirectUrl', window.location.href);
            window.location.href = '/login.html';
            return;
        }

        if (isAuthenticated && currentPath === '/login.html') {
            // Si está autenticado y trata de acceder al login, redirigir al inicio
            window.location.href = '/';
            return;
        }

        // Si está autenticado, actualizar la UI
        if (isAuthenticated) {
            this.updateAuthenticatedUI();
        }
    }

    setupTokenExpirationCheck() {
        // Verificar el token cada minuto
        setInterval(async () => {
            if (authService.isAuthenticated()) {
                try {
                    // Intentar refrescar el token
                    await authService.refreshToken();
                } catch (error) {
                    // Si falla el refresh, cerrar sesión
                    this.logout();
                }
            }
        }, 60000); // 1 minuto
    }

    setupResponseInterceptor() {
        // Interceptar respuestas 401 globalmente
        window.addEventListener('unhandledrejection', async (event) => {
            if (event.reason?.status === 401) {
                try {
                    await authService.refreshToken();
                    // Reintentar la petición original
                    // Aquí podrías implementar un sistema de retry para la petición original
                } catch (error) {
                    this.logout();
                }
            }
        });
    }

    async logout() {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            // Limpiar storage y redirigir
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login.html';
        }
    }

    updateAuthenticatedUI() {
        // Actualizar elementos de UI para usuario autenticado
        const userMenus = document.querySelectorAll('.user-menu');
        const authButtons = document.querySelectorAll('.auth-button');
        const userProfileElements = document.querySelectorAll('.user-profile');

        // Obtener datos del usuario
        authService.getProfile().then(profile => {
            // Actualizar elementos con datos del usuario
            userProfileElements.forEach(element => {
                element.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <img src="${profile.avatar || '/img/default-avatar.png'}"
                             alt="Profile"
                             class="w-8 h-8 rounded-full">
                        <span class="text-sm font-medium">${profile.email}</span>
                    </div>
                `;
            });

            // Mostrar/ocultar elementos según estado de autenticación
            userMenus.forEach(menu => menu.classList.remove('hidden'));
            authButtons.forEach(button => button.classList.add('hidden'));
        }).catch(error => {
            console.error('Error fetching profile:', error);
        });
    }

    // Método para verificar roles específicos
    hasRole(requiredRole) {
        try {
            const profile = JSON.parse(localStorage.getItem('userProfile'));
            return profile?.roles?.includes(requiredRole) || false;
        } catch {
            return false;
        }
    }
}

// Singleton instance
export const authManager = new AuthManager();