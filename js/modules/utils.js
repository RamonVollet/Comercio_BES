// ===== COMÉRCIO BES — UTILITÁRIOS =====
// Funções puras: sem DOM, sem estado, sem fetch.
// Depende apenas de: config.js (KEYS)

// ===== SEGURANÇA: Escape HTML para prevenir XSS =====
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ===== STORAGE =====
function storageGet(key) {
  try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
}

function storageSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ===== STRINGS =====
function gerarSlug(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ===== FORMATAÇÃO =====

/**
 * Formata valor numérico como moeda brasileira.
 * Ex: 1234.5 → "1.234,50"
 */
function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===== UI HELPERS =====

/**
 * Gera HTML de estrelas para um rating (0–5).
 * Retorna string HTML — não manipula DOM.
 */
function gerarStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= Math.round(rating)
      ? '<span class="star">★</span>'
      : '<span class="star-empty">★</span>';
  }
  return html;
}
