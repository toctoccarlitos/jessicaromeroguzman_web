import { loadingManager } from './loading-manager.js';

class HttpInterceptor {
    constructor() {
        this.baseURL = 'https://jessicaromeroguzman.com/api';
        this.refreshPromise = null;

        // Lista ampliada de endpoints donde el spinner está desactivado
        this.noSpinnerEndpoints = [
            'login',
            'verify_email',
            'refresh',
            'status',
            'security/csrf-token'
        ];

        // Nueva lista de páginas donde nunca mostrar el spinner
        this.noSpinnerPages = [
            '/login.html',
            '/index.html',
            '/',
            '/cookies.html',
            '/terminos.html',
            '/politicas.html'
        ];
    }

    shouldShowSpinner(endpoint, options = {}) {
        // 1. Si se especificó explícitamente showLoading en las opciones, respetar ese valor
        if (options.hasOwnProperty('showLoading')) {
            return options.showLoading;
        }

        // 2. Verificar si estamos en una página donde nunca mostrar spinner
        const currentPage = window.location.pathname;
        if (this.noSpinnerPages.includes(currentPage)) {
            return false;
        }

        // 3. Verificar si el endpoint está en la lista de exclusión
        const isExcludedEndpoint = this.noSpinnerEndpoints.some(noSpinnerPath =>
            endpoint.toLowerCase().includes(noSpinnerPath.toLowerCase())
        );
        if (isExcludedEndpoint) {
            return false;
        }

        // Por defecto, mostrar spinner
        return true;
    }

    async fetch(endpoint, options = {}) {
         // Determinar si mostrar el spinner basado en la nueva lógica
         const shouldShowLoading = this.shouldShowSpinner(endpoint, options);

         const {
             showLoading = shouldShowLoading,
             loadingText = 'Cargando...',
             ...fetchOptions
         } = options;

         // Si showLoading es true, envolver la petición con el loading manager
         if (showLoading) {
             return loadingManager.wrapPromise(
                 this._executeRequest(endpoint, fetchOptions),
                 { loadingText }
             );
         }

        // Si no, ejecutar la petición directamente
        return this._executeRequest(endpoint, fetchOptions);
    }

    async _executeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint}`;
        options.headers = options.headers || {};

        // Añadir token si existe
        const token = localStorage.getItem('token');
        if (token) {
            options.headers['JRG-Authorization'] = `Bearer ${token}`;
        }

        const finalOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            console.log('Response status:', response.status);

            // Si es 401 (no autorizado), manejar el error de autenticación
            if (response.status === 401) {
                console.log('Got 401, token:', localStorage.getItem('token'));
                const refreshToken = localStorage.getItem('refresh_token');

                // Intentar refrescar el token si es posible
                if (refreshToken && !endpoint.includes('/refresh') && !endpoint.includes('/login')) {
                    try {
                        const refreshResponse = await fetch(`${this.baseURL}/refresh`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest'
                            },
                            body: JSON.stringify({ refresh_token: refreshToken })
                        });

                        if (!refreshResponse.ok) {
                            throw new Error('Refresh token failed');
                        }

                        const refreshData = await refreshResponse.json();
                        if (refreshData.data?.access_token) {
                            localStorage.setItem('token', refreshData.data.access_token);
                            if (refreshData.data.refresh_token) {
                                localStorage.setItem('refresh_token', refreshData.data.refresh_token);
                            }

                            // Reintentar la petición original con el nuevo token
                            finalOptions.headers['JRG-Authorization'] = `Bearer ${refreshData.data.access_token}`;
                            return await fetch(url, finalOptions).then((res) => res.json());
                        }
                    } catch (refreshError) {
                        console.error('Error refreshing token:', refreshError);
                    }
                }

                // Si no se puede refrescar el token, manejar el error
                this.handleAuthError();
                throw {
                    status: 401,
                    message: 'Unauthorized access'
                };
            }

            // Para cualquier respuesta no OK
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw {
                    status: response.status,
                    message: errorData.message || 'Error en la petición',
                    data: errorData
                };
            }

            // Intentar parsear como JSON
            try {
                return await response.json();
            } catch (e) {
                return response;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    clearTokens() {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
    }

    async refreshAuthToken(refreshToken) {
        try {
            const response = await fetch(`${this.baseURL}/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();

            if (data.status === 'success' && data.data && data.data.access_token) {
                localStorage.setItem('token', data.data.access_token);
                if (data.data.refresh_token) {
                    localStorage.setItem('refresh_token', data.data.refresh_token);
                }
                return data;
            } else {
                throw new Error('Invalid refresh token response');
            }
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            throw error;
        }
    }

    getFullUrl(endpoint) {
        return endpoint.startsWith('https') ? endpoint : `${this.baseURL}${endpoint}`;
    }

    getHeaders(customHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...customHeaders
        };

        const token = localStorage.getItem('token');
        if (token) {
            headers['JRG-Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    handleAuthError() {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userProfile');

        // Solo redirigir al login si no estamos ya en la página de login
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = '/login.html';
        }
    }
}

export const httpInterceptor = new HttpInterceptor();