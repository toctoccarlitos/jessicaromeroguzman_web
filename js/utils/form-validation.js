export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function validatePhone(phone) {
    if (!phone) return true; // Opcional
    const re = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return re.test(phone);
}

export function validateForm(form) {
    const inputs = form.querySelectorAll('input, textarea');
    let isValid = true;

    inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value) {
            isValid = false;
        }
        if (input.type === 'email' && !validateEmail(input.value)) {
            isValid = false;
        }
        if (input.type === 'tel' && input.value && !validatePhone(input.value)) {
            isValid = false;
        }
    });

    return isValid;
}

export function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
        isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
        strength: calculatePasswordStrength(password),
        errors: {
            length: password.length < minLength,
            upperCase: !hasUpperCase,
            lowerCase: !hasLowerCase,
            numbers: !hasNumbers,
            specialChar: !hasSpecialChar
        }
    };
}

function calculatePasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 10;

    return strength;
}

export function validateLoginForm(formData) {
    const errors = {};

    // Validar email
    if (!validateEmail(formData.email)) {
        errors.email = 'Por favor, introduce un email válido';
    }

    // Validar contraseña
    if (formData.password) {
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            errors.password = 'La contraseña no cumple con los requisitos mínimos';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

export function showPasswordStrength(strength, element) {
    const strengthClasses = {
        weak: 'bg-red-500',
        medium: 'bg-yellow-500',
        strong: 'bg-green-500'
    };

    let strengthText = '';
    let strengthClass = '';

    if (strength < 40) {
        strengthText = 'Débil';
        strengthClass = strengthClasses.weak;
    } else if (strength < 70) {
        strengthText = 'Media';
        strengthClass = strengthClasses.medium;
    } else {
        strengthText = 'Fuerte';
        strengthClass = strengthClasses.strong;
    }

    element.innerHTML = `
        <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full ${strengthClass} transition-all duration-300" style="width: ${strength}%"></div>
        </div>
        <span class="text-xs text-gray-600 mt-1">${strengthText}</span>
    `;
}