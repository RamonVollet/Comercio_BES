// ===========================================
// Helper - Cookies de Auth
// ===========================================
const crypto = require('crypto');

const IS_PROD = process.env.NODE_ENV === 'production';

// TTLs
const ACCESS_TOKEN_MS = 15 * 60 * 1000;          // 15 min
const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

/**
 * Gera um token CSRF opaco (32 bytes hex).
 */
function generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Gera um refresh token opaco (48 bytes hex).
 */
function generateRefreshToken() {
    return crypto.randomBytes(48).toString('hex');
}

/**
 * Define os três cookies de auth na resposta.
 * @param {import('express').Response} res
 * @param {string} accessToken  - JWT curto (15min)
 * @param {string} refreshToken - Token opaco (7d)
 * @param {string} csrfToken    - Token CSRF (não-httpOnly)
 */
function setAuthCookies(res, accessToken, refreshToken, csrfToken) {
    const base = { sameSite: 'Lax', secure: IS_PROD };

    res.cookie('access_token', accessToken, {
        ...base,
        httpOnly: true,
        maxAge: ACCESS_TOKEN_MS,
        path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
        ...base,
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: REFRESH_TOKEN_MS,
        path: '/api/auth/refresh',
    });

    // csrf_token NÃO é httpOnly — precisa ser lido pelo JS do cliente
    res.cookie('csrf_token', csrfToken, {
        ...base,
        httpOnly: false,
        maxAge: ACCESS_TOKEN_MS,
        path: '/',
    });
}

/**
 * Limpa todos os cookies de auth.
 * @param {import('express').Response} res
 */
function clearAuthCookies(res) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    res.clearCookie('csrf_token', { path: '/' });
}

module.exports = {
    generateCsrfToken,
    generateRefreshToken,
    setAuthCookies,
    clearAuthCookies,
    ACCESS_TOKEN_MS,
    REFRESH_TOKEN_MS,
};
