// ===== COMÉRCIO BES — CONFIGURAÇÃO GLOBAL =====
// Primeiro módulo carregado. Sem dependências.

// ===== API =====
export const API_BASE = window.location.port === '3000'
  ? window.location.origin + '/api'
  : 'http://localhost:3000/api';

// ===== STORAGE KEYS =====
export const KEYS = {
  SESSION:   'bes_sessao',
  CART:      'bes_carrinho',
  ORDERS:    'bes_pedidos',
  FAVORITES: 'bes_favoritos',
  MERCHANTS: 'bes_merchants',
  API_TOKEN: 'bes_api_token'
};

// ===== PAGINAÇÃO =====
export const ITEMS_POR_PAGINA = 8;

// ===== GOOGLE MAPS =====
// Obtenha sua chave em: https://console.cloud.google.com → APIs → Maps Embed API
// Restrinja a chave pelo domínio do site nas configurações da API.
// Deixe vazio para usar OpenStreetMap (gratuito, sem chave).
export const GOOGLE_MAPS_KEY = '';
