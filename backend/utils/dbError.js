/**
 * Utility to handle Database errors cleanly.
 * Returns a clean message instead of dumping the full stack trace to console.
 */

export function isQuotaError(error) {
    // Left for backwards compatibility, but practically unused now since Neon is removed.
    return false;
}

export function logDbError(label, error) {
    console.error(`${label}:`, error.message || error);
}

export function dbErrorResponse(res, label, error, fallbackMessage = 'Database error. Please try again.') {
    console.error(`${label}:`, error.message || error);
    return res.status(500).json({ error: fallbackMessage });
}
