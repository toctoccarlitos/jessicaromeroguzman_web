import { authService } from './services/authService.js';
import { initializeLoginSecurity, preventBruteForce, sanitizeLoginInput } from './utils/login-security.js';

let currentEmail = '';

export async function initializeLoginForm() {
    const emailStep = document.getElementById('email-step');
    const passwordStep = document.getElementById('password-step');
    const emailForm = document.getElementById('email-form');
    const passwordForm = document.getElementById('password-form');
    const backButton = document.getElementById('back-to-email');
    const displayEmail = document.getElementById('display-email');
    const cardContainer = document.getElementById('cardContainer');

    // Verificar si ya hay una sesión activa
    const checkExistingSession = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await authService.getProfile();
                window.location.href = '/dashboard.html';
                return true;
            } catch (error) {
                if (error.status === 401) {
                    try {
                        await authService.refreshToken();
                        window.location.href = '/dashboard.html';
                        return true;
                    } catch (refreshError) {
                        console.error('Error refreshing token:', refreshError);
                        authService.clearAuthData();
                    }
                }
            }
        }
        return false;
    };

    // Verificar sesión existente
    await checkExistingSession();

    // Establecer altura inicial del contenedor
    if (cardContainer && emailStep) {
        requestAnimationFrame(() => {
            cardContainer.style.height = `${emailStep.offsetHeight}px`;
        });
    }

    // Email form submission
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = emailForm.querySelector('input[type="email"]');
            const email = sanitizeLoginInput(emailInput.value);

            resetInput(emailInput);

            // Verificar intentos de fuerza bruta
            // if (!preventBruteForce(email)) {
            //     showToast('Demasiados intentos. Por favor, espera unos minutos.');
            //     return;
            // }

            if (!emailInput.checkValidity()) {
                showError('Por favor, introduce un email válido', emailInput);
                return;
            }

            const submitButton = emailForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Verificando...';

            try {
                currentEmail = email;
                if (displayEmail) displayEmail.textContent = email;

                if (cardContainer && passwordStep) {
                    cardContainer.style.height = `${passwordStep.offsetHeight}px`;
                }
                emailStep.classList.add('slide-left');
                passwordStep.classList.add('slide-in');

                setTimeout(() => {
                    document.getElementById('login-password')?.focus();
                }, 800);
            } catch (error) {
                showError(error.message, emailInput);
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = `
                    <span class="group-hover:hidden">Continuar</span>
                    <span class="hidden group-hover:inline-flex items-center">
                        ¡Vamos allá! <i class="fas fa-arrow-right ml-2"></i>
                    </span>`;
            }
        });
    }

    // Password form submission
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const passwordInput = document.getElementById('login-password');
            const password = passwordInput?.value || '';
            const submitButton = passwordForm.querySelector('button[type="submit"]');

            if (!passwordInput) return;
            resetInput(passwordInput);

            if (!password) {
                showError('Por favor, introduce tu contraseña', passwordInput);
                return;
            }

            if (!submitButton) return;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Verificando...';

            try {
                await new Promise(resolve => grecaptcha.ready(resolve));

                const recaptchaToken = await new Promise((resolve, reject) => {
                    grecaptcha.execute('6LcRZ6MqAAAAAPVN8N-xthV42hn9va2MyKT9kQIl', { action: 'login' }).then(resolve).catch(reject);
                  });

                // console.log('Token reCAPTCHA:', recaptchaToken);

                const loginResponse = await authService.login(currentEmail, password, recaptchaToken);

                if (loginResponse.status === 'success') {
                    submitButton.classList.add('success-button');
                    submitButton.innerHTML = '<i class="fas fa-check animate-bounce"></i> ¡Bienvenido!';

                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 1500);
                } else {
                    throw new Error('Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('Credenciales incorrectas', passwordInput);
                submitButton.disabled = false;
                submitButton.innerHTML = 'Iniciar Sesión';
            }
        });
    }

    // Back button handler
    if (backButton && cardContainer && emailStep) {
        backButton.addEventListener('click', () => {
            cardContainer.style.height = `${emailStep.offsetHeight}px`;
            emailStep.classList.remove('slide-left');
            passwordStep.classList.remove('slide-in');

            setTimeout(() => {
                document.getElementById('login-email')?.focus();
            }, 800);
        });
    }
}

// Función para resetear input
function resetInput(input) {
    if (!input) return;
    input.classList.remove('border-red-500');
    const errorMsg = input.parentElement?.querySelector('.text-red-500');
    errorMsg?.remove();
}

// Función para mostrar error
function showError(message, inputElement) {
    if (!inputElement) return;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-red-500 text-sm mt-1';
    errorDiv.textContent = message;

    const existingError = inputElement.parentElement?.querySelector('.text-red-500');
    existingError?.remove();

    inputElement.classList.add('border-red-500');
    inputElement.parentElement?.appendChild(errorDiv);
}

// Función para mostrar mensajes toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const icon = type === 'success' ? 'check-circle' :
                 type === 'error' ? 'exclamation-circle' : 'info-circle';

    toast.className = `fixed bottom-4 right-4 ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' : 'bg-purple-500'
    } text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-2
    transform transition-all duration-300 opacity-0 translate-y-2`;

    toast.innerHTML = `
        <i class="fas fa-${icon} animate-bounce"></i>
        <span class="ml-2">${message}</span>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

async function handleLoginSuccess(loginResponse) {
    try {
        if (loginResponse.status === 'success' && loginResponse.data) {
            // Guardar tokens
            localStorage.setItem('token', loginResponse.data.access_token);
            localStorage.setItem('refresh_token', loginResponse.data.refresh_token);

            // Guardar datos básicos del usuario
            if (loginResponse.data.user) {
                localStorage.setItem('userProfile', JSON.stringify(loginResponse.data.user));
            }

            // Actualizar UI
            const submitButton = document.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.classList.add('success-button');
                submitButton.innerHTML = '<i class="fas fa-check animate-bounce"></i> ¡Bienvenido!';
            }

            // Redirección
            setTimeout(() => {
                const redirectUrl = sessionStorage.getItem('redirectUrl') || '/dashboard.html';
                sessionStorage.removeItem('redirectUrl');
                window.location.href = redirectUrl;
            }, 1500);

            return true;
        }
        return false;
    } catch (error) {
        console.error('Error processing login response:', error);
        return false;
    }
}

// Manejar eventos de navegación
window.addEventListener('popstate', (event) => {
    const emailStep = document.getElementById('email-step');
    const passwordStep = document.getElementById('password-step');
    const cardContainer = document.getElementById('cardContainer');

    if (event.state && event.state.email) {
        emailStep.classList.add('slide-left');
        passwordStep.classList.add('slide-in');
        document.getElementById('display-email').textContent = event.state.email;
        cardContainer.style.height = `${passwordStep.offsetHeight}px`;
    } else {
        emailStep.classList.remove('slide-left');
        passwordStep.classList.remove('slide-in');
        cardContainer.style.height = `${emailStep.offsetHeight}px`;
    }
});

// Inicializar seguridad del login al cargar
initializeLoginSecurity();