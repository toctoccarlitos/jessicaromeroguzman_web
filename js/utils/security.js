export function sanitizeInput(input) {
    return input.replace(/<[^>]*>/g, '').trim();
}

export function generateCSRFToken() {
    return Math.random().toString(36).substring(2);
}

export function checkRateLimit(key, limit, timeWindow) {
    const now = Date.now();
    const timestamps = JSON.parse(localStorage.getItem(key) || '[]');

    // Limpiar timestamps antiguos
    const validTimestamps = timestamps.filter(time => now - time < timeWindow);

    if (validTimestamps.length >= limit) {
        return false;
    }

    validTimestamps.push(now);
    localStorage.setItem(key, JSON.stringify(validTimestamps));
    return true;
}