// ===== COMÉRCIO BES — CONFIGURAÇÃO GLOBAL =====
// Carregado antes de qualquer outro script.
// Não importa nem depende de nada.

// ===== API =====
const API_BASE = window.location.port === '3000'
  ? window.location.origin + '/api'
  : 'http://localhost:3000/api';

// Detectado em runtime por carregarDados()
let API_DISPONIVEL = false;

// ===== STORAGE KEYS =====
const KEYS = {
  SESSION:   'bes_sessao',
  CART:      'bes_carrinho',
  ORDERS:    'bes_pedidos',
  FAVORITES: 'bes_favoritos',
  MERCHANTS: 'bes_merchants',
  API_TOKEN: 'bes_api_token'
};

// ===== PAGINAÇÃO =====
const ITEMS_POR_PAGINA = 8;
