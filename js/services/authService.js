// js/services/authService.js
import { httpInterceptor } from '../utils/httpInterceptor.js';

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.refreshTokenPromise = null;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 segundo
    }

    async login(email, password, recaptchaToken = '') {
        try {
            if (!email || !password) {
                throw new Error('Email y contraseña son requeridos');
            }

            // Intentar login con reintentos
            const response = await this.retryOperation(async () => {
                // Construir el cuerpo de la petición
                const requestBody = {
                    email,
                    password,
                    recaptcha_token: recaptchaToken,
                    device_info: this.getDeviceInfo()
                };

                // Log para comparar con Postman
                console.log('Request payload:', {
                    url: `${this.baseURL}/login`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: requestBody
                });

                const response = await httpInterceptor.fetch('login', {
                    method: 'POST',
                    body: JSON.stringify(requestBody)
                });

                return response;
            });

            // Procesar respuesta exitosa
            if (response.status === 'success' && response.data) {
                // Guardar tokens
                this.saveAuthTokens(response.data);

                // Guardar información del usuario
                if (response.data.user) {
                    localStorage.setItem('userProfile', JSON.stringify({
                        id: response.data.user.id,
                        email: response.data.user.email,
                        roles: response.data.user.roles
                    }));
                }

                return response;
            }

            throw new Error('Invalid login response');
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }

    async logout() {
        try {
            const refresh_token = localStorage.getItem('refresh_token');
            await httpInterceptor.fetch('/logout', {
                method: 'POST',
                body: JSON.stringify({
                    refresh_token,
                    device_info: this.getDeviceInfo()
                })
            });
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            this.clearAuthData();
        }
    }

    async refreshToken() {
        // Si ya hay una operación de refresh en curso, esperar a que termine
        if (this.refreshTokenPromise) {
            return this.refreshTokenPromise;
        }

        try {
            const refresh_token = localStorage.getItem('refresh_token');
            if (!refresh_token) {
                throw new Error('No hay refresh token disponible');
            }

            this.refreshTokenPromise = this.retryOperation(async () => {
                const response = await httpInterceptor.fetch('/refresh', {
                    method: 'POST',
                    body: JSON.stringify({
                        refresh_token,
                        device_info: this.getDeviceInfo()
                    })
                });

                if (response.status === 'success' && response.data) {
                    this.saveAuthTokens(response.data);
                } else {
                    throw new Error('Invalid refresh token response');
                }

                return response;
            });

            return await this.refreshTokenPromise;
        } catch (error) {
            console.error('Error al refrescar token:', error);
            this.clearAuthData();
            throw error;
        } finally {
            this.refreshTokenPromise = null;
        }
    }

    async getProfile() {
        try {
            // Verificar si tenemos token antes de hacer la petición
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token available');
            }

            const response = await httpInterceptor.fetch('profile');

            if (response.data) {
                localStorage.setItem('userProfile', JSON.stringify(response.data));
                return response.data;
            }

            throw new Error('Invalid profile response');
        } catch (error) {
            console.error('Error getting profile:', error);
            throw error;
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            // Validar requisitos de contraseña
            if (!this.validatePasswordRequirements(newPassword)) {
                throw new Error('La nueva contraseña no cumple con los requisitos mínimos');
            }

            const response = await httpInterceptor.fetch('/profile/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            if (response.status === 'success') {
                // Forzar relogin después de cambio de contraseña
                await this.refreshToken();
            }

            return response;
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            throw error;
        }
    }

    async requestPasswordReset(email) {
        try {
            if (!email) {
                throw new Error('Email es requerido');
            }

            const response = await httpInterceptor.fetch('/password/reset-request', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    device_info: this.getDeviceInfo()
                })
            });

            return response;
        } catch (error) {
            console.error('Error al solicitar reset de contraseña:', error);
            throw error;
        }
    }

    async resetPassword(token, newPassword) {
        try {
            if (!this.validatePasswordRequirements(newPassword)) {
                throw new Error('La nueva contraseña no cumple con los requisitos mínimos');
            }

            const response = await httpInterceptor.fetch('/password/reset', {
                method: 'POST',
                body: JSON.stringify({
                    token,
                    password: newPassword
                })
            });

            return response;
        } catch (error) {
            console.error('Error al resetear contraseña:', error);
            throw error;
        }
    }

    async verifyAuthentication() {
        try {
            // Verificar si tenemos token
            const token = localStorage.getItem('token');
            if (!token) return false;

            // Intentar obtener el perfil
            const profile = await this.getProfile();
            return !!profile;
        } catch (error) {
            // Si es un error de autorización, intentamos refresh
            if (error.status === 401) {
                try {
                    await this.refreshToken();
                    return true;
                } catch (refreshError) {
                    console.error('Error refreshing token:', refreshError);
                    return false;
                }
            }
            return false;
        }
    }

    isAuthenticated() {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refresh_token');
        return !!(token && refreshToken);
    }

    hasRole(role) {
        try {
            const profile = JSON.parse(localStorage.getItem('userProfile'));
            return profile?.roles?.includes(role) || false;
        } catch {
            return false;
        }
    }

    // Métodos de utilidad (internos)
    validatePasswordRequirements(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return password.length >= minLength &&
               hasUpperCase &&
               hasLowerCase &&
               hasNumbers &&
               hasSpecialChar;
    }

    saveAuthTokens(data) {
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
        }
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }
    }

    clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userProfile');
        this.token = null;
    }

    async retryOperation(operation, retries = this.maxRetries) {
        for (let i = 0; i < retries; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
            }
        }
    }

    handleAuthError(error) {
        if (error.status === 401) {
            this.clearAuthData();
        }
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${window.screen.width}x${window.screen.height}`
        };
    }
}

export const authService = new AuthService();