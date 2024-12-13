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

// Función para obtener el token de reCAPTCHA
async function getRecaptchaToken(action) {
    if (!recaptchaReady) {
        console.error('reCAPTCHA no está listo');
        return null;
    }

    try {
        const token = await grecaptcha.enterprise.execute('TU_SITE_KEY', {
            action: action
        });
        return token;
    } catch (error) {
        console.error('Error al obtener token de reCAPTCHA:', error);
        return null;
    }
}

// Función para resetear input
function resetInput(input) {
    input.classList.remove('border-red-500');
    const errorMsg = input.parentNode.querySelector('.text-red-500');
    if (errorMsg) errorMsg.remove();
}

// Función para mostrar mensaje de error
function showError(message, inputElement) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-red-500 text-sm mt-2 absolute bottom-[-20px] left-0';
    errorDiv.textContent = message;

    inputElement.classList.add('border-red-500');

    return errorDiv;
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

// Función principal de inicialización
export function initializeLoginForm() {
    const emailStep = document.getElementById('email-step');
    const passwordStep = document.getElementById('password-step');
    const emailForm = document.getElementById('email-form');
    const passwordForm = document.getElementById('password-form');
    const backButton = document.getElementById('back-to-email');
    const displayEmail = document.getElementById('display-email');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const cardContainer = document.getElementById('cardContainer');

    // Establecer altura inicial del contenedor
    requestAnimationFrame(() => {
        cardContainer.style.height = `${emailStep.offsetHeight}px`;
    });

    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('login-password');
            const icon = this.querySelector('i');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // Email form submission
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = emailForm.querySelector('input[type="email"]');
        const email = emailInput.value.trim();

        // Limpiar errores previos
        const existingError = emailForm.querySelector('.text-red-500');
        if (existingError) existingError.remove();

        // Validar email vacío
        if (!email) {
            emailInput.parentNode.appendChild(
                showError('Por favor, introduce tu email', emailInput)
            );
            return;
        }

        // Validar formato de email
        if (!emailInput.checkValidity()) {
            emailInput.parentNode.appendChild(
                showError('Por favor, introduce un email válido', emailInput)
            );
            return;
        }

        const submitButton = emailForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Verificando...';

        try {
            const newUrl = `${window.location.pathname}?email=${encodeURIComponent(email)}`;
            window.history.pushState({ email }, '', newUrl);

            displayEmail.textContent = email;
            cardContainer.style.height = `${passwordStep.offsetHeight}px`;

            emailStep.classList.add('slide-left');
            passwordStep.classList.add('slide-in');

            setTimeout(() => {
                document.getElementById('login-password').focus();
            }, 800);
        } catch (error) {
            showError('Ocurrió un error. Por favor, inténtalo de nuevo.');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = `
                <span class="group-hover:hidden">Continuar</span>
                <span class="hidden group-hover:inline-flex items-center">
                    ¡Vamos allá! <i class="fas fa-arrow-right ml-2"></i>
                </span>`;
        }
    });

    // Password form submission
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const passwordInput = document.getElementById('login-password');
        const submitButton = passwordForm.querySelector('button[type="submit"]');

        // Limpiar errores previos
        const existingError = passwordForm.querySelector('.text-red-500');
        if (existingError) existingError.remove();

        if (!passwordInput.value) {
            passwordInput.parentNode.appendChild(
                showError('Por favor, introduce tu contraseña', passwordInput)
            );
            return;
        }

        if (!validatePassword(passwordInput.value)) {
            passwordInput.parentNode.appendChild(
                showError('La contraseña debe tener al menos 6 caracteres', passwordInput)
            );
            return;
        }

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Verificando...';

        setTimeout(() => {
            submitButton.classList.remove('loading-button');
            submitButton.classList.add('success-button');
            submitButton.innerHTML = '<i class="fas fa-check animate-bounce"></i> ¡Bienvenido!';

            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        }, 2000);
    });

    // Forgot password handler
    const forgotPasswordBtn = document.getElementById('forgot-password-btn');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = displayEmail.textContent;
            const submitButton = passwordForm.querySelector('button[type="submit"]');

            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Recuperando...';

            setTimeout(() => {
                submitButton.classList.add('success-button');
                submitButton.innerHTML = '<i class="fas fa-check animate-bounce"></i> Email enviado';

                showToast(`Se ha enviado un email a ${email} con las instrucciones para recuperar tu contraseña.`, 'success');

                setTimeout(() => {
                    submitButton.classList.remove('success-button');
                    submitButton.disabled = false;
                    submitButton.innerHTML = `
                        <span class="group-hover:hidden">Iniciar Sesión</span>
                        <span class="hidden group-hover:inline-flex items-center justify-center">
                            ¡Adelante! <i class="fas fa-sign-in-alt ml-2"></i>
                        </span>`;
                }, 2000);
            }, 1500);
        });
    }

    // Back button handler
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.history.pushState({}, '', window.location.pathname);
            cardContainer.style.height = `${emailStep.offsetHeight}px`;

            emailStep.classList.remove('slide-left');
            passwordStep.classList.remove('slide-in');

            setTimeout(() => {
                document.getElementById('login-email').focus();
            }, 800);
        });
    }

    // Input reset handlers
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    emailInput.addEventListener('input', () => resetInput(emailInput));
    passwordInput.addEventListener('input', () => resetInput(passwordInput));
}

// Función para validar la contraseña
function validatePassword(password) {
    return password && password.length >= 6;
}

// Manejar eventos de navegación
window.addEventListener('popstate', (event) => {
    const emailStep = document.getElementById('email-step');
    const passwordStep = document.getElementById('password-step');

    if (event.state && event.state.email) {
        emailStep.classList.add('slide-left');
        passwordStep.classList.add('slide-in');
        document.getElementById('display-email').textContent = event.state.email;
    } else {
        emailStep.classList.remove('slide-left');
        passwordStep.classList.remove('slide-in');
    }
});