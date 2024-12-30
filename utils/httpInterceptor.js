// js/utils/httpInterceptor.js
class HttpInterceptor {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';  // Asegúrate que esta URL sea correcta
        this.refreshPromise = null;
    }

    async fetch(endpoint, options = {}) {
        const url = this.getFullUrl(endpoint);
        options.headers = this.getHeaders(options.headers);

        try {
            let response = await fetch(url, options);

            // Si obtenemos 401, intentamos refresh solo si no estamos ya haciendo un refresh
            if (response.status === 401 && !endpoint.includes('/refresh')) {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    this.handleAuthError();
                    throw new Error('No refresh token available');
                }

                // Si ya hay un refresh en progreso, esperamos a que termine
                if (this.refreshPromise) {
                    await this.refreshPromise;
                    // Reintentar la petición original con el nuevo token
                    options.headers = this.getHeaders(options.headers);
                    response = await fetch(url, options);
                } else {
                    // Iniciar nuevo proceso de refresh
                    try {
                        this.refreshPromise = this.refreshAuthToken(refreshToken);
                        await this.refreshPromise;

                        // Reintentar la petición original con el nuevo token
                        options.headers = this.getHeaders(options.headers);
                        response = await fetch(url, options);
                    } finally {
                        this.refreshPromise = null;
                    }
                }
            }

            // Para otros errores HTTP que no sean 401
            if (!response.ok && response.status !== 401) {
                const error = await response.json();
                throw {
                    status: response.status,
                    message: error.message || 'Error en la petición',
                    data: error
                };
            }

            // Intentar parsear la respuesta como JSON
            try {
                const data = await response.json();
                return data;
            } catch (e) {
                // Si la respuesta no es JSON, devolver la respuesta tal cual
                return response;
            }
        } catch (error) {
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw {
                    status: 0,
                    message: 'No se pudo conectar con el servidor'
                };
            }
            throw error;
        }
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

            // Asegurarse de que tenemos los tokens en la respuesta
            if (data.data && data.data.access_token) {
                localStorage.setItem('token', data.data.access_token);
                if (data.data.refresh_token) {
                    localStorage.setItem('refresh_token', data.data.refresh_token);
                }
                return data;
            } else {
                throw new Error('Invalid refresh token response');
            }
        } catch (error) {
            // localStorage.removeItem('token');
            // localStorage.removeItem('refresh_token');
            throw error;
        }
    }

    getFullUrl(endpoint) {
        return endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    }

    getHeaders(customHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders
        };

        const token = localStorage.getItem('token');
        if (token) {
            headers['JRG-Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    handleAuthError() {
        // No borrar los tokens aquí, solo cuando falla el refresh
    }
}

export const httpInterceptor = new HttpInterceptor();