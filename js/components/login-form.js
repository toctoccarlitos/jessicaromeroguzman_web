import { httpInterceptor } from '../utils/httpInterceptor.js';
import { formSecurity } from '../utils/form-security.js';

export async function initializeLoginForm() {
    const emailStep = document.getElementById('email-step');
    const passwordStep = document.getElementById('password-step');
    const emailForm = document.getElementById('email-form');
    const passwordForm = document.getElementById('password-form');
    const backButton = document.getElementById('back-to-email');
    const displayEmail = document.getElementById('display-email');
    const cardContainer = document.getElementById('cardContainer');

    let currentEmail = '';

    // Establecer altura inicial del contenedor
    if (cardContainer && emailStep) {
        requestAnimationFrame(() => {
            cardContainer.style.height = `${emailStep.offsetHeight}px`;
        });
    }

    // Email form submission
    if (emailForm) {

        // Inicializar seguridad del formulario
        await formSecurity.initializeForm(emailForm);

        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = emailForm.querySelector('input[type="email"]');
            const email = formSecurity.sanitizeInput(emailInput.value);
            resetInput(emailInput);

            if (!emailInput.checkValidity()) {
                showError('Por favor, introduce un email válido', emailInput);
                return;
            }

            const submitButton = emailForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Verificando...';

            try {
                // Preparar datos con seguridad
                const formData = await formSecurity.prepareFormData(emailForm, 'verify_email');
                formData.email = email;

                // Validar datos antes de continuar
                if (!formSecurity.validateFormData(formData)) {
                    throw new Error('Invalid form data');
                }

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

        // Inicializar seguridad del formulario
        await formSecurity.initializeForm(passwordForm);

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
                // Preparar datos con seguridad
                const formData = await formSecurity.prepareFormData(passwordForm, 'login');
                formData.email = currentEmail;
                formData.password = password;

                // Validar datos antes del envío
                if (!formSecurity.validateFormData(formData)) {
                    throw new Error('Invalid form data');
                }

                const loginResponse = await httpInterceptor.fetch('login', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });

                if (loginResponse.status === 'success') {

                    // Guardar tokens
                    localStorage.setItem('token', loginResponse.data.access_token);
                    localStorage.setItem('refresh_token', loginResponse.data.refresh_token);

                    // Si hay datos del usuario, guardarlos también
                    if (loginResponse.data.user) {
                        localStorage.setItem('userProfile', JSON.stringify(loginResponse.data.user));
                    }

                    // Manejar "Recordarme"
                    const rememberCheckbox = document.getElementById('remember');
                    if (rememberCheckbox?.checked) {
                        localStorage.setItem('rememberedEmail', currentEmail);
                    } else {
                        localStorage.removeItem('rememberedEmail');
                    }

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

    // Inicializar funcionalidades adicionales
    setupPasswordVisibility();
    setupRememberMe();
}

// Funciones auxiliares que se mantienen igual
function resetInput(input) {
    if (!input) return;
    input.classList.remove('border-red-500');
    const errorMsg = input.parentElement?.querySelector('.text-red-500');
    errorMsg?.remove();
}

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

function setupPasswordVisibility() {
    const toggleButton = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('login-password');

    if (!toggleButton || !passwordInput) return;

    toggleButton.addEventListener('click', () => {
        // Cambiar tipo de input
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Cambiar icono
        const icon = toggleButton.querySelector('i');
        if (type === 'text') {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            toggleButton.setAttribute('aria-label', 'Ocultar contraseña');
        } else {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            toggleButton.setAttribute('aria-label', 'Mostrar contraseña');
        }

        // Mantener el foco en el input de contraseña
        passwordInput.focus();
    });
}

function setupRememberMe() {
    const rememberCheckbox = document.getElementById('remember');

    if (!rememberCheckbox) return;

    // Restaurar estado previo si existe
    const remembered = localStorage.getItem('rememberedEmail');
    if (remembered) {
        const emailInput = document.getElementById('login-email');
        if (emailInput) {
            emailInput.value = remembered;
            rememberCheckbox.checked = true;
        }
    }

    // No necesitamos un event listener aquí, manejaremos esto en el submit del formulario
}