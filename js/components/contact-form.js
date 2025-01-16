import { httpInterceptor } from '../utils/httpInterceptor.js';
import { formSecurity } from '../utils/form-security.js';
import { recaptchaConfig, executeRecaptcha } from '../config/recaptcha.js';

export async function initializeContactForm(form) {
    if (!form) return;

    // Inicializar seguridad del formulario
    await formSecurity.initializeForm(form);

    const termsCheckbox = form.querySelector('#terms');
    const submitButton = form.querySelector('button[type="submit"]');

    if (!termsCheckbox || !submitButton) return;

    // Deshabilitar el botón al inicio
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    }

    const validateForm = () => {
        const requiredFields = form.querySelectorAll('[required]');

        let isValid = true;
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
            }
            if (field.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(field.value)) {
                    isValid = false;
                }
            }
        });

        isValid = isValid && termsCheckbox.checked;
        submitButton.disabled = !isValid;

        if (isValid) {
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        }

        return isValid;
    };

    form.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('input', validateForm);
        field.addEventListener('change', validateForm);
    });

    validateForm();

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm()) return;

        const originalButtonText = submitButton.innerHTML;

        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i> Enviando...';

            // Obtener los datos del formulario con los nombres correctos en inglés
            const contactData = {
                name: form.querySelector('#nombre').value.trim(),
                email: form.querySelector('#email').value.trim(),
                phone: form.querySelector('#telefono')?.value.trim() || null,
                message: form.querySelector('#mensaje').value.trim(),
                subscribe_newsletter: form.querySelector('#newsletter')?.checked || false
            };

            // Preparar datos de seguridad
            const securityData = await formSecurity.prepareFormData(form, 'submit_contact');

            // Combinar los datos
            const formData = {
                ...securityData,
                ...contactData
            };

            // Validar datos antes del envío
            if (!formSecurity.validateFormData(formData)) {
                throw new Error('Invalid form data');
            }

            // Verificar campos requeridos
            if (!formData.name || !formData.email || !formData.message) {
                throw new Error('All required fields must be filled');
            }

            const response = await httpInterceptor.fetch('contact', {
                method: 'POST',
                body: JSON.stringify(formData),
                showLoading: false
            });

            if (response.status === 'success') {
                // Estado de éxito
                submitButton.classList.remove('bg-purple-600');
                submitButton.classList.add('bg-green-500');
                submitButton.innerHTML = '<i class="fas fa-check mr-2"></i> ¡Mensaje enviado!';

                // Limpiar formulario y reinicializar seguridad
                form.reset();
                await formSecurity.initializeForm(form);

                // Restaurar estado original
                setTimeout(() => {
                    submitButton.classList.remove('bg-green-500');
                    submitButton.classList.add('bg-purple-600');
                    submitButton.innerHTML = originalButtonText;
                    submitButton.disabled = true;
                    submitButton.classList.add('opacity-50', 'cursor-not-allowed');
                }, 2000);
            }
        } catch (error) {
            console.error('Error:', error);

            // Estado de error corregido
            submitButton.classList.remove('bg-purple-600');
            submitButton.classList.add('bg-red-500');
            submitButton.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> ' +
                (error.message || 'Error al procesar la solicitud');

            // Restaurar estado original después de un tiempo
            setTimeout(() => {
                submitButton.classList.remove('bg-red-500');
                submitButton.classList.add('bg-purple-600');
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
                submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
            }, 2000);

            // Reinicializar seguridad después de un error
            await formSecurity.initializeForm(form);
        }
    });
}