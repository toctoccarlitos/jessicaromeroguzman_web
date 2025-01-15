export const recaptchaConfig = {
    siteKey: '6LcRZ6MqAAAAAPVN8N-xthV42hn9va2MyKT9kQIl',
    actions: {
        login: 'login',
        verifyEmail: 'verify_email',
        contactSubmit: 'submit_contact',
        newsletterSubmit: 'submit_newsletter'
    }
};

export async function executeRecaptcha(action) {
    try {
        await new Promise(resolve => {
            if (window.grecaptcha && window.grecaptcha.execute) {
                resolve();
            } else {
                window.onRecaptchaLoad = resolve;
            }
        });

        return await grecaptcha.execute(recaptchaConfig.siteKey, {
            action: action 
        });
    } catch (error) {
        console.error('Error executing reCAPTCHA:', error);
        throw new Error('Failed to execute reCAPTCHA verification');
    }
}