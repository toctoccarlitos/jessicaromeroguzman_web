const LOGIN_ATTEMPT_KEY = 'login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

export function initializeLoginSecurity() {
    const loginAttempts = getLoginAttempts();
    if (isAccountLocked(loginAttempts)) {
        disableLoginForm();
        showLockoutMessage(loginAttempts.lockoutEnd);
        return false;
    }
    return true;
}

export function handleFailedLogin() {
    const attempts = getLoginAttempts();
    attempts.count = (attempts.count || 0) + 1;

    if (attempts.count >= MAX_ATTEMPTS) {
        attempts.lockoutEnd = Date.now() + LOCKOUT_TIME;
        disableLoginForm();
        showLockoutMessage(attempts.lockoutEnd);
    }

    localStorage.setItem(LOGIN_ATTEMPT_KEY, JSON.stringify(attempts));
}

export function resetLoginAttempts() {
    localStorage.removeItem(LOGIN_ATTEMPT_KEY);
}

function getLoginAttempts() {
    const attempts = localStorage.getItem(LOGIN_ATTEMPT_KEY);
    return attempts ? JSON.parse(attempts) : { count: 0 };
}

function isAccountLocked(attempts) {
    if (!attempts.lockoutEnd) return false;
    if (Date.now() >= attempts.lockoutEnd) {
        resetLoginAttempts();
        return false;
    }
    return true;
}

function disableLoginForm() {
    const form = document.getElementById('login-form');
    if (form) {
        form.querySelectorAll('input, button').forEach(el => el.disabled = true);
    }
}

// js/utils/login-security.js (continuación)

function showLockoutMessage(lockoutEnd) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'text-red-500 text-sm mt-4';

    const updateMessage = () => {
        const timeLeft = Math.ceil((lockoutEnd - Date.now()) / 1000);
        if (timeLeft <= 0) {
            location.reload();
            return;
        }
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        messageDiv.textContent = `Demasiados intentos fallidos. Por favor, espera ${minutes}:${seconds.toString().padStart(2, '0')} minutos antes de intentarlo de nuevo.`;
    };

    updateMessage();
    const interval = setInterval(updateMessage, 1000);

    const form = document.getElementById('login-form');
    if (form) {
        form.parentNode.insertBefore(messageDiv, form.nextSibling);
    }
}

// Función para validar el reCAPTCHA
export async function validateRecaptcha() {
    try {
        const token = await grecaptcha.execute('YOUR_SITE_KEY', {action: 'login'});
        const response = await fetch('/verify-recaptcha', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
        });

        const data = await response.json();
        return data.score >= 0.5; // Umbral de puntuación recomendado por Google
    } catch (error) {
        console.error('Error validating reCAPTCHA:', error);
        return false;
    }
}

// Función para prevenir ataques de fuerza bruta
export function preventBruteForce(email) {
    const key = `attempt_${email}_${new Date().toISOString().split('T')[0]}`;
    const attempts = JSON.parse(localStorage.getItem(key) || '{"count": 0, "timestamp": 0}');

    if (attempts.count >= MAX_ATTEMPTS) {
        const timeSinceLastAttempt = Date.now() - attempts.timestamp;
        if (timeSinceLastAttempt < LOCKOUT_TIME) {
            return false;
        }
        // Resetear intentos si ha pasado el tiempo de bloqueo
        localStorage.removeItem(key);
        return true;
    }

    attempts.count++;
    attempts.timestamp = Date.now();
    localStorage.setItem(key, JSON.stringify(attempts));
    return true;
}

// Función para sanitizar inputs
export function sanitizeLoginInput(input) {
    return input.replace(/[<>]/g, '').trim();
}