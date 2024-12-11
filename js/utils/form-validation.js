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