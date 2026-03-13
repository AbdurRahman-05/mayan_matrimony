/**
 * Utility to handle NeonDB errors cleanly.
 * Detects quota/billing errors and returns a clean message
 * instead of dumping the full stack trace to console.
 */

export function isQuotaError(error) {
    if (!error) return false;
    const msg = error.message || '';
    return (
        msg.includes('HTTP status 402') ||
        msg.includes('exceeded the data transfer quota') ||
        msg.includes('Upgrade your plan')
    );
}

export function logDbError(label, error) {
    if (isQuotaError(error)) {
        console.warn(`⚠️ ${label}: NeonDB data transfer quota exceeded. Please upgrade your plan or wait for quota reset.`);
    } else {
        console.error(`${label}:`, error.message || error);
    }
}

export function dbErrorResponse(res, label, error, fallbackMessage = 'Something went wrong. Please try again.') {
    if (isQuotaError(error)) {
        console.warn(`⚠️ ${label}: NeonDB data transfer quota exceeded.`);
        return res.status(503).json({ error: 'Service temporarily unavailable. Please try again later.' });
    }
    console.error(`${label}:`, error.message || error);
    return res.status(500).json({ error: fallbackMessage });
}
