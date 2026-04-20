// ===========================================
// utils.js — Utilitários compartilhados das Sections
// ===========================================

/**
 * Escapa caracteres HTML perigosos para prevenir XSS.
 * Usar sempre que interpolar dados da API via innerHTML.
 * @param {*} s - Valor a escapar (qualquer tipo)
 * @returns {string}
 */
export const esc = s =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
