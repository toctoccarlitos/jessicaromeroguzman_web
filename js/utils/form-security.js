import { executeRecaptcha } from '../config/recaptcha.js';

class FormSecurity {
    constructor() {
        this.tokenEndpoint = '/api/security/csrf-token';
        this.tokens = new Map();

        this.loginAttempts = new Map();
        this.maxLoginAttempts = 5;
        this.lockoutTime = 15 * 60 * 1000; // 15 minuto
    }

    async initializeForm(form) {
        const formId = form.dataset.formId;
        if (!formId) return;

        try {
            // Generar token CSRF
            const token = await this.getToken();

            // Actualizar el input hidden del CSRF
            const csrfInput = form.querySelector('input[name="csrf_token"]');
            if (csrfInput) {
                csrfInput.value = token;
                this.tokens.set(formId, token);
            }

            // Actualizar timestamp
            const timestampInput = form.querySelector('input[name="timestamp"]');
            if (timestampInput) {
                timestampInput.value = Date.now().toString();
            }
        } catch (error) {
            console.error('Error initializing form security:', error);
        }
    }

    async prepareFormData(form, action) {
        const formData = {};

        try {
            // Generar nuevo token CSRF
            const newToken = await this.getToken();

            // Obtener token reCAPTCHA
            const recaptchaToken = await this.getReCaptchaToken(action);

            // Recopilar datos básicos del formulario
            const formElements = form.elements;
            for (let element of formElements) {
                if (element.name && !element.disabled) {
                    if (element.type === 'checkbox') {
                        formData[element.name] = element.checked;
                    } else {
                        formData[element.name] = this.sanitizeInput(element.value);
                    }
                }
            }

            // Añadir datos de seguridad
            return {
                ...formData,
                csrf_token: newToken,
                timestamp: Date.now().toString(),
                recaptcha_token: recaptchaToken,
                form_id: form.dataset.formId
            };
        } catch (error) {
            console.error('Error preparing form data:', error);
            throw error;
        }
    }

    async getToken() {
        try {
            const response = await fetch(this.tokenEndpoint);
            if (!response.ok) throw new Error('Failed to get CSRF token');
            const data = await response.json();
            return data.token;
        } catch (error) {
            console.error('Error getting CSRF token:', error);
            return this.generateFallbackToken();
        }
    }

    async getReCaptchaToken(action) {
        try {
            return await executeRecaptcha(action);
        } catch (error) {
            console.error('Error getting reCAPTCHA token:', error);
            throw error;
        }
    }

    generateFallbackToken() {
        return `temp_${Date.now()}_${Math.random().toString(36).substr(2)}`;
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input.replace(/<[^>]*>/g, '').trim();
    }

    validateFormData(data) {
        return !!(data.csrf_token && data.timestamp && data.recaptcha_token);
    }

    // Métodos específicos para login
    checkLoginAttempts(email) {
        const attempts = this.loginAttempts.get(email) || { count: 0, lockoutEnd: 0 };

        if (attempts.lockoutEnd > Date.now()) {
            return {
                allowed: false,
                remainingTime: Math.ceil((attempts.lockoutEnd - Date.now()) / 1000)
            };
        }

        if (attempts.count >= this.maxLoginAttempts) {
            attempts.lockoutEnd = Date.now() + this.lockoutTime;
            this.loginAttempts.set(email, attempts);
            return {
                allowed: false,
                remainingTime: this.lockoutTime / 1000
            };
        }

        return { allowed: true };
    }

    incrementLoginAttempts(email) {
        const attempts = this.loginAttempts.get(email) || { count: 0, lockoutEnd: 0 };
        attempts.count++;
        this.loginAttempts.set(email, attempts);
    }

    resetLoginAttempts(email) {
        this.loginAttempts.delete(email);
    }
}

export const  formSecurity = new FormSecurity();