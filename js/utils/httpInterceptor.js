class HttpInterceptor {
    constructor() {
        // Actualizar a la URL correcta de tu API
        this.baseURL = 'https://jessicaromeroguzman.com';
        this.refreshPromise = null;
    }

    async fetch(endpoint, options = {}) {
        const url = `${this.baseURL}/api/${endpoint}`;

        // Mantener los headers simples como en Postman
        const finalOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        // Añadir token si existe
        const token = localStorage.getItem('token');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        try
        {
            console.log('Sending request to:', url, finalOptions);

            const response = await fetch(url, finalOptions);

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries([...response.headers]));

            // Si es un 406, loguear los headers para debugging
            if (response.status === 406) {
                console.log('Request headers:', options.headers);
                console.log('Response headers:', Object.fromEntries([...response.headers]));
            }

            // Si es un 401 y no estamos en refresh
            if (response.status === 401 && !endpoint.includes('/refresh')) {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    this.handleAuthError();
                    throw new Error('No refresh token available');
                }

                try {
                    const refreshResponse = await fetch(`${this.baseURL}/refresh`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: JSON.stringify({
                            refresh_token: refreshToken
                        })
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
                        options.headers['Authorization'] = `Bearer ${refreshData.data.access_token}`;
                        response = await fetch(url, options);
                    }
                } catch (refreshError) {
                    console.error('Error refreshing token:', refreshError);
                    this.handleAuthError();
                    throw refreshError;
                }
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
            headers['Authorization'] = `Bearer ${token}`;
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