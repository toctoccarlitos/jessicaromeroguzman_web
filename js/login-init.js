// js/login-init.js

import { validateLoginForm, showPasswordStrength } from './utils/form-validation.js';
import { initializeLoginSecurity, preventBruteForce, sanitizeLoginInput } from './utils/login-security.js';

let recaptchaReady = false;

// Función para cargar reCAPTCHA
function loadRecaptcha() {
    return new Promise((resolve) => {
        window.onRecaptchaLoad = () => {
            grecaptcha.enterprise.ready(() => {
                recaptchaReady = true;
                resolve();
            });
        };
    });
}

// Función para obtener y validar el token (simulación cliente)
async function validateRecaptchaToken(action) {
    if (!recaptchaReady) {
        console.error('reCAPTCHA no está listo');
        return false;
    }

    try {
        const token = await grecaptcha.enterprise.execute('TU_SITE_KEY', {
            action: action
        });

        // En un entorno real, esto se haría en el servidor
        // Aquí solo simulamos una validación básica
        if (token && token.length > 0) {
            console.log(`Token de reCAPTCHA generado para acción: ${action}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al obtener/validar token de reCAPTCHA:', error);
        return false;
    }
}

// Datos de prueba (solo para demostración)
const TEST_USERS = {
    'demo@example.com': 'Demo1234!'
};

export async function initializeLoginForm() {
    await loadRecaptcha();

    const emailStep = document.getElementById('email-step');
    const passwordStep = document.getElementById('password-step');
    const emailForm = document.getElementById('email-form');
    const passwordForm = document.getElementById('password-form');
    const backButton = document.getElementById('back-to-email');

    let currentEmail = '';

    // Manejar el paso de email
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = sanitizeLoginInput(emailForm.email.value);

        // Validar reCAPTCHA
        const isRecaptchaValid = await validateRecaptchaToken('email_validation');
        if (!isRecaptchaValid) {
            showError('Error de verificación. Por favor, inténtalo de nuevo.');
            return;
        }

        // Validar email
        const validation = validateLoginForm({ email });
        if (!validation.isValid) {
            showError(validation.errors.email);
            return;
        }

        // Transición al paso de contraseña
        currentEmail = email;
        document.getElementById('user-email').textContent = email;

        // Animación de transición
        emailStep.style.transform = 'translateX(-100%)';
        passwordStep.style.transform = 'translateX(-100%)';
    });

    // Manejar el paso de contraseña
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = sanitizeLoginInput(passwordForm.password.value);

        // Validar reCAPTCHA
        const isRecaptchaValid = await validateRecaptchaToken('login');
        if (!isRecaptchaValid) {
            showError('Error de verificación. Por favor, inténtalo de nuevo.');
            return;
        }

        // Validar contraseña
        const validation = validateLoginForm({ password });
        if (!validation.isValid) {
            showError(validation.errors.password);
            return;
        }

        const loginButton = document.getElementById('login-button');
        loginButton.disabled = true;
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accediendo...';

        // Simular proceso de login
        setTimeout(() => {
            if (TEST_USERS[currentEmail] === password) {
                // Login exitoso
                localStorage.setItem('isLoggedIn', 'true');
                showSuccess('¡Login exitoso!');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showError('Credenciales incorrectas');
                loginButton.disabled = false;
                loginButton.innerHTML = 'Iniciar Sesión';
            }
        }, 1500);
    });

    // Botón de retroceso
    backButton.addEventListener('click', () => {
        emailStep.style.transform = 'translateX(0)';
        passwordStep.style.transform = 'translateX(0)';
    });

    // Mostrar fortaleza de la contraseña
    const passwordInput = document.getElementById('password');
    const strengthElement = document.querySelector('.password-strength');

    passwordInput.addEventListener('input', () => {
        const strength = validatePassword(passwordInput.value).strength;
        showPasswordStrength(strength, strengthElement);
    });
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}