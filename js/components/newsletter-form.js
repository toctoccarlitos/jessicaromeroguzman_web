// js/components/newsletter-form.js

import { httpInterceptor } from '../utils/httpInterceptor.js';
import { formSecurity } from '../utils/form-security.js';
import { recaptchaConfig, executeRecaptcha } from '../config/recaptcha.js';

export async function initializeNewsletterForm(form) {
    if (!form) return;

    // Inicializar seguridad del formulario
    await formSecurity.initializeForm(form);

    const submitButton = form.querySelector('#newsletter-submit');

    // Deshabilitar el botón al inicio
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    }

    setupFormValidation(form);
    setupSubmitHandler(form);
}

function setupFormValidation(form) {
    const emailInput = form.querySelector('#newsletter-email');
    const termsCheckbox = form.querySelector('#newsletter-terms');
    const submitButton = form.querySelector('#newsletter-submit');

    if (!emailInput || !termsCheckbox || !submitButton) return;

    const validateForm = () => {
        // Validar email
        const isEmailValid = emailInput.value.trim() !== '' &&
                           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);

        // Validar términos
        const areTermsAccepted = termsCheckbox.checked;

        // Actualizar estado del botón
        const isFormValid = isEmailValid && areTermsAccepted;
        submitButton.disabled = !isFormValid;

        if (isFormValid) {
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        }

        return isFormValid;
    };

    // Validar en cada cambio
    emailInput.addEventListener('input', validateForm);
    termsCheckbox.addEventListener('change', validateForm);

    // Validación inicial
    validateForm();
}

async function setupSubmitHandler(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = form.querySelector('#newsletter-submit');
        if (submitButton.disabled) return;

        const originalButtonText = submitButton.innerHTML;

        try {
            // Deshabilitar botón y mostrar estado de carga
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i> Suscribiendo...';

            // Preparar datos con seguridad
            const formData = await formSecurity.prepareFormData(form, 'submit_newsletter');

            // Validar datos antes del envío
            if (!formSecurity.validateFormData(formData)) {
                throw new Error('Los datos del formulario son inválidos');
            }

            // Enviar la solicitud
            const response = await httpInterceptor.fetch('newsletter/subscribe', {
                method: 'POST',
                body: JSON.stringify(formData),
                showLoading: false
            });

            if (response.status === 'success') {
                // Mostrar éxito
                submitButton.classList.remove('bg-purple-600');
                submitButton.classList.add('bg-green-500');
                submitButton.innerHTML = '<i class="fas fa-check mr-2"></i> ¡Suscrito!';

                // Limpiar formulario y reinicializar seguridad
                form.reset();
                await formSecurity.initializeForm(form);

                // Restaurar estado original después de 2 segundos
                setTimeout(() => {
                    submitButton.classList.remove('bg-green-500');
                    submitButton.classList.add('bg-purple-600');
                    submitButton.innerHTML = originalButtonText;
                    submitButton.disabled = true;
                    submitButton.classList.add('opacity-50', 'cursor-not-allowed');
                }, 2000);
            } else {
                throw new Error(response.message || 'Error en el servidor');
            }
        } catch (error) {
            console.error('Error:', error);

            // Mostrar error
            submitButton.classList.remove('bg-purple-600');
            submitButton.classList.add('bg-red-500');
            submitButton.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> ' +
                (error.message || 'Error al procesar la solicitud');

            // Restaurar estado original después de 2 segundos
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