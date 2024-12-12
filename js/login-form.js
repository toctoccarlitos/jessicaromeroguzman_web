// js/login-form.js

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

// Función principal de inicialización
export function initializeLoginForm() {
    const emailStep = document.getElementById('email-step');
    const passwordStep = document.getElementById('password-step');
    const emailForm = document.getElementById('email-form');
    const passwordForm = document.getElementById('password-form');
    const backButton = document.getElementById('back-to-email');
    const displayEmail = document.getElementById('display-email');
    const togglePasswordBtn = document.getElementById('togglePassword');

    // Verificar si hay un email en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    if (emailFromUrl) {
        document.getElementById('login-email').value = decodeURIComponent(emailFromUrl);
    }

    // Manejar toggle de contraseña
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

    const forgotPasswordBtn = document.getElementById('forgot-password-btn');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = displayEmail.textContent;
            
            // Mostrar modal o mensaje
            showToast('Se ha enviado un email de recuperación a ' + email, 'info');
            
            // En producción, aquí iría la llamada al servidor
            console.log('Recuperar contraseña para:', email);
        });
    }

    // Manejar envío del email
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = emailForm.querySelector('input[type="email"]');
        const email = emailInput.value.trim();
    
        if (email && emailInput.checkValidity()) {
            const submitButton = emailForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    
            try {
                // Actualizar URL sin recargar
                const newUrl = `${window.location.pathname}?email=${encodeURIComponent(email)}`;
                window.history.pushState({ email }, '', newUrl);
    
                // Mostrar email en el siguiente paso
                displayEmail.textContent = email;
    
                // Suavizar transición
                document.getElementById('cardContainer').style.height = 
                    document.getElementById('password-step').offsetHeight + 'px';
    
                // Activar transición con delay para animación más suave
                setTimeout(() => {
                    emailStep.classList.add('slide-left');
                    passwordStep.classList.add('slide-in');
                }, 50);
    
                // Enfocar campo de contraseña
                setTimeout(() => {
                    document.getElementById('login-password').focus();
                }, 500);
            } catch (error) {
                showToast('Ocurrió un error. Por favor, inténtalo de nuevo.', 'error');
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = `
                    <span class="group-hover:hidden">Continuar</span>
                    <span class="hidden group-hover:inline-flex items-center">
                        ¡Vamos allá! <i class="fas fa-arrow-right ml-2"></i>
                    </span>`;
            }
        }
    });

    // Manejar botón de retroceso
    backButton.addEventListener('click', () => {
        // Actualizar URL sin recargar
        window.history.pushState({}, '', window.location.pathname);

        // Revertir transición
        emailStep.classList.remove('slide-left');
        passwordStep.classList.remove('slide-in');

        document.getElementById('cardContainer').style.height = 'auto';

        // Enfocar campo de email
        setTimeout(() => {
            document.getElementById('login-email').focus();
        }, 300);
    });

    // Manejar envío del formulario de contraseña
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const passwordInput = passwordForm.querySelector('input[type="password"]');
        const password = passwordInput.value;

        if (password) {
            const submitButton = passwordForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accediendo...';

            try {
                // Simular login exitoso
                setTimeout(() => {
                    showToast('¡Login exitoso! Redirigiendo...', 'success');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                }, 1000);

            } catch (error) {
                showToast('Error en el inicio de sesión. Por favor, inténtalo de nuevo.', 'error');
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = `
                    <span class="group-hover:hidden">Iniciar Sesión</span>
                    <span class="hidden group-hover:inline-flex items-center justify-center">
                        ¡Adelante! <i class="fas fa-sign-in-alt ml-2"></i>
                    </span>`;
            }
        }
    });
}

// Función para mostrar mensajes toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-500' : 
                    type === 'success' ? 'bg-green-500' : 
                    'bg-purple-500';
    
    toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Manejar eventos de navegación
window.addEventListener('popstate', (event) => {
    const emailStep = document.getElementById('email-step');
    const passwordStep = document.getElementById('password-step');
    
    if (event.state && event.state.email) {
        // Ir al paso de contraseña
        emailStep.classList.add('slide-left');
        passwordStep.classList.add('slide-in');
        document.getElementById('display-email').textContent = event.state.email;
    } else {
        // Volver al paso de email
        emailStep.classList.remove('slide-left');
        passwordStep.classList.remove('slide-in');
    }
});