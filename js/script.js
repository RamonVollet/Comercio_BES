// ===== COMÉRCIO BES — SCRIPT PRINCIPAL =====
// Arquitetura híbrida: API REST (backend) com fallback localStorage

// ===== CONFIG =====
const API_BASE = window.location.port === '3000'
  ? window.location.origin + '/api'
  : 'http://localhost:3000/api'; // Backend local

let API_DISPONIVEL = false; // detectado automaticamente

// ===== API HELPER =====
function registrarEstatistica(comercioId, tipo) {
  if (!API_DISPONIVEL || !comercioId) return;
  fetch(API_BASE + '/estatisticas/registrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comercioId, tipo })
  }).catch(err => console.warn('[Stats] Falha ao registrar ' + tipo + ':', err.message));
}

// ===== STORAGE KEYS =====
const KEYS = {
  SESSION: 'bes_sessao',
  CART: 'bes_carrinho',
  ORDERS: 'bes_pedidos',
  FAVORITES: 'bes_favoritos',
  API_TOKEN: 'bes_api_token'
};

// ===== STATE =====
let comercios = [];
let categoriaAtiva = 'todos';
let comercioAtual = null;
let avaliacao = 0;
let carrinhoModal = {}; // carrinho temporário do modal (qtds por idx)
let mapa = null;
let paginaAtual = 1;
const ITEMS_POR_PAGINA = 8;
let deferredPrompt = null;

// ===== STORAGE HELPERS =====
function storageGet(key) {
  try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
}
function storageSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ===== SEGURANCA: Escape HTML para prevenir XSS =====
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ===== AUTH MODULE =====
const Auth = {
  getSession() { return storageGet(KEYS.SESSION); },

  getToken() { return storageGet(KEYS.API_TOKEN); },

  isLoggedIn() { return !!this.getSession(); },

  getUser() {
    const session = this.getSession();
    if (!session) return null;
    return session;
  },

  async register(nome, email, tel, senha, tipo, dadosLoja) {
    // Tentar via API primeiro
    if (API_DISPONIVEL) {
      try {
        const body = { nome, email, senha, telefone: tel || undefined };
        // Mapear tipo: 'lojista' -> 'comerciante', 'usuario' -> 'cliente'
        body.tipo = tipo === 'lojista' ? 'comerciante' : 'cliente';

        const res = await fetch(API_BASE + '/auth/registro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, msg: data.error || 'Erro ao criar conta.' };

        // Salvar token e sessão
        storageSet(KEYS.API_TOKEN, data.token);
        storageSet(KEYS.SESSION, {
          userId: data.user.id,
          nome: data.user.nome,
          email: data.user.email,
          tipo: data.user.tipo,
          fromApi: true
        });
        return { ok: true, user: data.user };
      } catch (err) {
        console.warn('[Auth] API register falhou:', err.message);
      }
    }

    return { ok: false, msg: 'Serviço indisponível. Verifique sua conexão e tente novamente.' };
  },

  async login(email, senha) {
    // Tentar via API primeiro
    if (API_DISPONIVEL) {
      try {
        const res = await fetch(API_BASE + '/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha })
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, msg: data.error || 'E-mail ou senha incorretos.' };

        // Salvar token e sessão
        storageSet(KEYS.API_TOKEN, data.token);
        storageSet(KEYS.SESSION, {
          userId: data.user.id,
          nome: data.user.nome,
          email: data.user.email,
          tipo: data.user.tipo,
          fromApi: true
        });
        return { ok: true, user: data.user };
      } catch (err) {
        console.warn('[Auth] API login falhou:', err.message);
      }
    }

    return { ok: false, msg: 'Serviço indisponível. Verifique sua conexão e tente novamente.' };
  },

  logout() {
    localStorage.removeItem(KEYS.SESSION);
    localStorage.removeItem(KEYS.API_TOKEN);
  }
};

// ===== CART MODULE (persistent) =====
const Cart = {
  get() { return storageGet(KEYS.CART) || []; },

  save(cart) { storageSet(KEYS.CART, cart); },

  add(lojaId, lojaNome, lojaWhatsapp, produto, qtd) {
    const cart = this.get();
    const existing = cart.find(i => i.lojaId === lojaId && i.produto.nome_produto === produto.nome_produto);
    if (existing) {
      existing.qtd += qtd;
    } else {
      cart.push({ lojaId, lojaNome, lojaWhatsapp, produto, qtd });
    }
    this.save(cart);
    this.updateBadge();
  },

  remove(index) {
    const cart = this.get();
    cart.splice(index, 1);
    this.save(cart);
    this.updateBadge();
  },

  updateQtd(index, delta) {
    const cart = this.get();
    if (!cart[index]) return;
    cart[index].qtd = Math.max(1, cart[index].qtd + delta);
    this.save(cart);
    this.updateBadge();
  },

  clear() {
    localStorage.removeItem(KEYS.CART);
    this.updateBadge();
  },

  total() {
    return this.get().reduce((sum, i) => sum + (i.produto.preco * i.qtd), 0);
  },

  count() {
    return this.get().reduce((sum, i) => sum + i.qtd, 0);
  },

  updateBadge() {
    const badge = document.getElementById('cart-badge');
    const count = this.count();
    if (badge) {
      badge.textContent = count > 0 ? count : '';
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
    // Floating cart widget
    const fab = document.getElementById('fab-cart');
    const fabBadge = document.getElementById('fab-cart-badge');
    if (fab) {
      fab.style.display = count > 0 ? 'flex' : 'none';
    }
    if (fabBadge) {
      fabBadge.textContent = count;
    }
  }
};

// ===== FAVORITES MODULE =====
const Favorites = {
  get() { return storageGet(KEYS.FAVORITES) || []; },

  toggle(lojaId) {
    let favs = this.get();
    const idx = favs.indexOf(lojaId);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push(lojaId);
    }
    storageSet(KEYS.FAVORITES, favs);
    return idx < 0; // true = added, false = removed
  },

  isFav(lojaId) {
    return this.get().includes(lojaId);
  }
};

// ===== ORDERS MODULE =====
const Orders = {
  get() { return storageGet(KEYS.ORDERS) || []; },

  create(orderData) {
    const orders = this.get();
    const order = {
      id: 'PED-' + Date.now().toString(36).toUpperCase(),
      ...orderData,
      status: 'pendente',
      criadoEm: new Date().toISOString()
    };
    orders.unshift(order);
    storageSet(KEYS.ORDERS, orders);
    return order;
  }
};

// ===== MERCHANTS MODULE =====
const Merchants = {
  get() { return storageGet(KEYS.MERCHANTS) || []; },

  register(data) {
    const merchants = this.get();
    const loja = {
      id: 100 + merchants.length + 1,
      slug: gerarSlug(data.nome),
      nome: data.nome,
      categoria: data.categoria,
      tags: [data.categoria],
      emoji: data.emoji || '🏪',
      rating: 5.0,
      visitas: 0,
      recomendados: 0,
      aberto: true,
      endereco: data.endereco,
      lat: -21.9930 + (Math.random() - 0.5) * 0.005,
      lng: -48.3910 + (Math.random() - 0.5) * 0.005,
      tel: data.tel,
      whatsapp: data.whatsapp,
      horario: data.horario || 'A combinar',
      fotos: [data.emoji || '🏪'],
      promo: null,
      catalogo: null,
      _local: true // flag: cadastrada localmente
    };
    merchants.push(loja);
    storageSet(KEYS.MERCHANTS, merchants);
    return loja;
  }
};

// ===== INICIALIZAÇÃO =====

async function carregarDados() {
  // Show skeleton loading
  mostrarSkeleton();

  // Tentar API REST primeiro, fallback para data.json
  try {
    const apiRes = await fetch(API_BASE + '/comercios?limit=100');
    if (!apiRes.ok) throw new Error('API HTTP ' + apiRes.status);
    const apiData = await apiRes.json();
    comercios = apiData.comercios || [];
    API_DISPONIVEL = true;
    console.log('[ComércioBES] API conectada — ' + comercios.length + ' comércios carregados');
  } catch (apiErr) {
    console.warn('[ComércioBES] API indisponível, usando data.json:', apiErr.message);
    API_DISPONIVEL = false;
    try {
      const response = await fetch('data/data.json');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      comercios = data.comercios;
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      mostrarToast('⚠️ Erro ao carregar comércios. Tente recarregar a página.');
      return;
    }
  }

  // Merge com lojas cadastradas localmente (fallback local)
  const locais = Merchants.get();
  locais.forEach(l => {
    if (!comercios.find(c => c.id === l.id)) {
      comercios.push(l);
    }
  });
}

async function inicializar() {
  aplicarTema();
  await carregarDados();
  atualizarAnoRodape();
  Cart.updateBadge();
  atualizarNavUser();
  verificarDeepLink();
  renderTudo();
  renderFavoritos();
  configurarPWAInstall();
  observarLazyImages();
}

// ===== DEEP LINKING =====

function verificarDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const lojaSlug = params.get('loja');
  if (!lojaSlug) return;
  const loja = comercios.find(c => c.slug === lojaSlug);
  if (loja) {
    abrirModal(loja.id);
  }
}

function gerarSlug(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function copiarLinkLoja(slug) {
  const url = window.location.origin + window.location.pathname + '?loja=' + slug;
  // Registrar compartilhamento
  const c = comercios.find(x => x.slug === slug);
  if (c) registrarEstatistica(c.id, 'compartilhamento');
  navigator.clipboard.writeText(url).then(() => {
    mostrarToast('🔗 Link copiado! Compartilhe com quem quiser.');
  }).catch(() => {
    mostrarToast('🔗 Link: ' + url);
  });
}

// ===== RENDER =====

function renderTudo() {
  paginaAtual = 1;
  renderizarCards(comercios);
  renderPromos();
  renderRanking('rating');
  renderMapa();
}

// ===== MAPA INTERATIVO (Leaflet) =====

function renderMapa() {
  const mapEl = document.getElementById('leaflet-map');
  if (!mapEl || comercios.length === 0) return;
  if (mapa) { mapa.remove(); mapa = null; }

  mapa = L.map('leaflet-map').setView([-21.9932, -48.3910], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(mapa);

  comercios.forEach(c => {
    if (!c.lat || !c.lng) return;

    let cor = '#aaa';
    if (c.aberto && c.promo && c.promo.ativo) {
      cor = '#FF6D00';
    } else if (c.aberto) {
      cor = '#00C853';
    }

    const icon = L.divIcon({
      className: 'mapa-marker',
      html: '<div class="marker-pin" style="background:' + cor + '"><span>' + escapeHTML(c.emoji) + '</span></div>',
      iconSize: [40, 48],
      iconAnchor: [20, 48],
      popupAnchor: [0, -48]
    });

    const statusBadge = c.aberto
      ? '<span style="color:#00C853;font-weight:700;">✓ Aberto</span>'
      : '<span style="color:#ff4444;font-weight:700;">✗ Fechado</span>';

    const promoLine = (c.promo && c.promo.ativo)
      ? '<div style="margin-top:6px;font-size:12px;color:#FF6D00;">🔥 ' + escapeHTML(c.promo.desc) + ' — ' + escapeHTML(c.promo.preco) + '</div>'
      : '';

    const popup = '<div class="map-popup">' +
      '<div style="font-size:24px;text-align:center;margin-bottom:6px;">' + escapeHTML(c.emoji) + '</div>' +
      '<div style="font-family:\'Syne\',sans-serif;font-weight:700;font-size:15px;text-align:center;">' + escapeHTML(c.nome) + '</div>' +
      '<div style="font-size:12px;color:#888;text-align:center;margin:4px 0;">' + escapeHTML(c.categoria).toUpperCase() + ' · ⭐ ' + escapeHTML(String(c.rating)) + '</div>' +
      '<div style="font-size:13px;text-align:center;margin:4px 0;">📍 ' + escapeHTML(c.endereco) + '</div>' +
      '<div style="font-size:13px;text-align:center;">' + statusBadge + '</div>' +
      promoLine +
      '<div style="display:flex;gap:6px;margin-top:10px;">' +
        '<button onclick="abrirModal(' + parseInt(c.id) + ')" style="flex:1;background:#0A0A0A;color:#fff;border:none;padding:8px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">Ver perfil</button>' +
        '<a href="https://wa.me/' + encodeURIComponent(c.whatsapp) + '" target="_blank" rel="noopener noreferrer" onclick="registrarEstatistica(' + parseInt(c.id) + ', \'whatsapp_click\')" style="flex:1;background:#25D366;color:#fff;border:none;padding:8px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;text-decoration:none;text-align:center;">💬 WhatsApp</a>' +
      '</div></div>';

    L.marker([c.lat, c.lng], { icon }).addTo(mapa).bindPopup(popup);
  });
}

// ===== CARDS =====

function criarCard(c) {
  const stars = gerarStars(c.rating);
  const openBadge = c.aberto
    ? '<span class="store-open">✓ Aberto</span>'
    : '<span class="store-open store-closed">✗ Fechado</span>';
  const temCatalogo = c.catalogo && c.catalogo.length > 0;
  const isFav = Favorites.isFav(c.id);

  return '<div class="store-card" onclick="abrirModal(' + parseInt(c.id) + ')">' +
    '<div class="store-img">' +
      '<span>' + escapeHTML(c.emoji) + '</span>' +
      openBadge +
      '<button class="card-fav ' + (isFav ? 'active' : '') + '" onclick="event.stopPropagation(); toggleFavoritoCard(' + parseInt(c.id) + ', this)">' + (isFav ? '♥' : '♡') + '</button>' +
    '</div>' +
    '<div class="store-body">' +
      '<div class="store-cat">' + escapeHTML(c.categoria).toUpperCase() + '</div>' +
      '<div class="store-name">' + escapeHTML(c.nome) + '</div>' +
      '<div class="store-addr">📍 ' + escapeHTML(c.endereco) + '</div>' +
      '<div class="store-stars">' + stars +
        '<span class="store-rating-num">' + escapeHTML(String(c.rating)) + '</span>' +
        '<span class="store-reviews">(' + parseInt(c.visitas) + ' visitas)</span>' +
      '</div>' +
      '<div class="store-actions">' +
        '<a class="btn-whats" href="https://wa.me/' + encodeURIComponent(c.whatsapp) + '?text=' + encodeURIComponent('Olá! Encontrei seu comércio no Comércio BES. Gostaria de mais informações!') + '" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation(); registrarEstatistica(' + parseInt(c.id) + ', \'whatsapp_click\')">💬 WhatsApp</a>' +
        (temCatalogo ? '<button class="btn-catalogo" onclick="event.stopPropagation(); abrirModal(' + parseInt(c.id) + ')">📋 Cardápio</button>' : '') +
        '<button class="btn-perfil" onclick="event.stopPropagation(); abrirModal(' + parseInt(c.id) + ')">👁️</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function gerarStars(r) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= Math.round(r) ? '<span class="star">★</span>' : '<span class="star-empty">★</span>';
  }
  return html;
}

function renderizarCards(lista) {
  const totalPaginas = Math.ceil(lista.length / ITEMS_POR_PAGINA);
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas || 1;
  const inicio = (paginaAtual - 1) * ITEMS_POR_PAGINA;
  const paginados = lista.slice(inicio, inicio + ITEMS_POR_PAGINA);
  const grid = document.getElementById('main-grid');
  grid.innerHTML = paginados.map(criarCard).join('');
  grid.classList.add('fade-in');
  setTimeout(() => grid.classList.remove('fade-in'), 400);
  renderPaginacao(lista.length, totalPaginas);
  observarLazyImages();
}

function renderPaginacao(totalItems, totalPaginas) {
  const container = document.getElementById('pagination');
  if (!container || totalPaginas <= 1) {
    if (container) container.innerHTML = '';
    return;
  }
  let html = '';
  html += '<button class="page-btn" ' + (paginaAtual <= 1 ? 'disabled' : '') + ' onclick="irPagina(' + (paginaAtual - 1) + ')">← Anterior</button>';
  for (let i = 1; i <= totalPaginas; i++) {
    html += '<button class="page-num ' + (i === paginaAtual ? 'active' : '') + '" onclick="irPagina(' + i + ')">' + i + '</button>';
  }
  html += '<button class="page-btn" ' + (paginaAtual >= totalPaginas ? 'disabled' : '') + ' onclick="irPagina(' + (paginaAtual + 1) + ')">Próxima →</button>';
  container.innerHTML = html;
}

function irPagina(n) {
  paginaAtual = n;
  const lista = filtrarPorCategoria(categoriaAtiva);
  renderizarCards(lista);
  document.querySelector('.listings-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filtrarPorCategoria(cat) {
  if (cat === 'todos') return comercios;
  return comercios.filter(c => c.categoria === cat || c.tags.includes(cat));
}

function buscarPorTermo(termo) {
  const q = termo.toLowerCase().trim();
  if (!q) return [];
  return comercios.filter(c =>
    c.nome.toLowerCase().includes(q) ||
    c.categoria.toLowerCase().includes(q) ||
    c.tags.some(t => t.toLowerCase().includes(q))
  );
}

function renderPromos() {
  const promos = comercios.filter(c => c.promo && c.promo.ativo);
  document.getElementById('promos-grid').innerHTML = promos.map(c =>
    '<div class="promo-card" onclick="abrirModal(' + parseInt(c.id) + ')">' +
      '<div class="promo-badge">🔥 Promoção</div>' +
      '<div class="promo-store">' + escapeHTML(c.emoji) + ' ' + escapeHTML(c.nome) + '</div>' +
      '<div class="promo-desc">' + escapeHTML(c.promo.desc) + '</div>' +
      '<div><span class="promo-price">' + escapeHTML(c.promo.preco) + '</span>' +
      '<span class="promo-original">' + escapeHTML(c.promo.original) + '</span></div>' +
    '</div>'
  ).join('');
}

function renderRanking(tipo) {
  let ordenados = [...comercios];
  if (tipo === 'rating') ordenados.sort((a, b) => b.rating - a.rating);
  if (tipo === 'visitas') ordenados.sort((a, b) => b.visitas - a.visitas);
  if (tipo === 'recomendados') ordenados.sort((a, b) => b.recomendados - a.recomendados);
  ordenados = ordenados.slice(0, 8);

  document.getElementById('ranking-list').innerHTML = ordenados.map((c, i) => {
    const cls = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
    const val = tipo === 'rating' ? escapeHTML(String(c.rating)) + ' ⭐'
      : tipo === 'visitas' ? parseInt(c.visitas) + ' visitas'
      : parseInt(c.recomendados) + ' ❤️';
    return '<div class="ranking-item" onclick="abrirModal(' + parseInt(c.id) + ')">' +
      '<div class="rank-num ' + cls + '">' + (i + 1) + '°</div>' +
      '<div class="rank-emoji">' + escapeHTML(c.emoji) + '</div>' +
      '<div class="rank-info"><div class="rank-name">' + escapeHTML(c.nome) + '</div>' +
      '<div class="rank-cat">' + escapeHTML(c.categoria.charAt(0).toUpperCase() + c.categoria.slice(1)) + '</div></div>' +
      '<div class="rank-score"><strong>' + val + '</strong><span>ranking</span></div></div>';
  }).join('');
}

// ===== BUSCA =====

function filtrarBusca(q) {
  const resultsSection = document.getElementById('search-results');
  const noResults = document.getElementById('no-results');
  const grid = document.getElementById('results-grid');

  q = q.trim();
  if (!q) { resultsSection.style.display = 'none'; return; }

  resultsSection.style.display = 'block';
  document.getElementById('search-term').textContent = q.toUpperCase();
  document.getElementById('results-header').style.display = 'block';

  const encontrados = buscarPorTermo(q);
  if (encontrados.length === 0) {
    grid.innerHTML = '';
    noResults.style.display = 'block';
    document.getElementById('no-results-term').textContent = q;
  } else {
    noResults.style.display = 'none';
    grid.innerHTML = encontrados.map(criarCard).join('');
  }
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setSearch(val) {
  document.getElementById('search-input').value = val;
  filtrarBusca(val);
}

// ===== CATEGORIA =====

function filtrarCategoria(cat, el) {
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  categoriaAtiva = cat;
  paginaAtual = 1;
  renderizarCards(filtrarPorCategoria(cat));
  const titulo = cat === 'todos' ? '🏪 Todos os Comércios'
    : 'Categoria: ' + cat.charAt(0).toUpperCase() + cat.slice(1);
  document.getElementById('listings-title').textContent = titulo;
  document.querySelector('.listings-section').scrollIntoView({ behavior: 'smooth' });
}

// ===== ORDENAR =====

function ordenar(tipo) {
  let lista = filtrarPorCategoria(categoriaAtiva);
  if (tipo === 'rating') lista.sort((a, b) => b.rating - a.rating);
  if (tipo === 'nome') lista.sort((a, b) => a.nome.localeCompare(b.nome));
  if (tipo === 'visitas') lista.sort((a, b) => b.visitas - a.visitas);
  paginaAtual = 1;
  renderizarCards(lista);
}

function mostrarRanking(tipo, el) {
  document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderRanking(tipo);
}

// ===== MODAL PERFIL =====

function abrirModal(id) {
  const c = comercios.find(x => x.id === id);
  if (!c) return;
  comercioAtual = c;
  avaliacao = 0;
  carrinhoModal = {};
  resetStars();

  // Registrar visita na API
  registrarEstatistica(c.id, 'visita');

  document.getElementById('modal-emoji').textContent = c.emoji;
  document.getElementById('modal-cat').textContent = c.categoria.toUpperCase();
  document.getElementById('modal-name').textContent = c.nome;

  // Favorito
  const favBtn = document.getElementById('modal-fav');
  if (favBtn) {
    const isFav = Favorites.isFav(c.id);
    favBtn.textContent = isFav ? '♥' : '♡';
    favBtn.classList.toggle('active', isFav);
  }

  document.getElementById('modal-info').innerHTML =
    '<div class="modal-info-row"><span class="modal-info-icon">📍</span> ' + escapeHTML(c.endereco) + '</div>' +
    '<div class="modal-info-row"><span class="modal-info-icon">🕐</span> ' + escapeHTML(c.horario) + '</div>' +
    '<div class="modal-info-row"><span class="modal-info-icon">📞</span> ' + escapeHTML(c.tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')) + '</div>' +
    '<div class="modal-info-row"><span class="modal-info-icon">' + (c.aberto ? '✅' : '❌') + '</span> ' + (c.aberto ? 'Aberto agora' : 'Fechado no momento') + '</div>' +
    (c.promo ? '<div class="modal-info-row"><span class="modal-info-icon">🔥</span> <strong>Promoção:</strong>&nbsp;' + escapeHTML(c.promo.desc) + ' — ' + escapeHTML(c.promo.preco) + '</div>' : '');

  document.getElementById('modal-stars-big').innerHTML =
    gerarStars(c.rating) +
    '<span class="modal-rating-big">' + escapeHTML(String(c.rating)) + '</span>' +
    '<span style="font-size:14px;color:#aaa;margin-left:8px;">(' + parseInt(c.visitas) + ' avaliações)</span>';

  document.getElementById('modal-fotos').innerHTML = c.fotos.map(f =>
    '<div class="foto-thumb">' + escapeHTML(f) + '</div>'
  ).join('');

  // Catálogo
  const catalogoContainer = document.getElementById('modal-catalogo');
  if (c.catalogo && c.catalogo.length > 0) {
    catalogoContainer.style.display = 'block';
    catalogoContainer.innerHTML =
      '<hr class="modal-divider">' +
      '<p style="font-family:\'Syne\',sans-serif;font-weight:700;font-size:17px;margin-bottom:16px;">📋 Cardápio / Produtos</p>' +
      '<div class="catalogo-lista">' +
        c.catalogo.map((prod, idx) =>
          '<div class="catalogo-item">' +
            '<div class="catalogo-info">' +
              '<div class="catalogo-nome">' + escapeHTML(prod.nome_produto) + '</div>' +
              '<div class="catalogo-desc">' + escapeHTML(prod.descricao) + '</div>' +
              '<div class="catalogo-preco">R$ ' + Number(prod.preco).toFixed(2).replace('.', ',') + '</div>' +
            '</div>' +
            '<div class="catalogo-qtd">' +
              '<button class="qtd-btn" onclick="alterarQtdModal(' + idx + ', -1)">−</button>' +
              '<span class="qtd-valor" id="qtd-' + idx + '">0</span>' +
              '<button class="qtd-btn" onclick="alterarQtdModal(' + idx + ', 1)">+</button>' +
            '</div>' +
          '</div>'
        ).join('') +
      '</div>' +
      '<div class="carrinho-resumo" id="carrinho-resumo" style="display:none;">' +
        '<div class="carrinho-total" id="carrinho-total"></div>' +
        '<div class="carrinho-actions">' +
          '<button class="btn-add-cart" onclick="adicionarAoCarrinho()">🛒 Adicionar ao Carrinho</button>' +
          '<button class="btn-enviar-pedido" onclick="enviarPedidoWhatsApp()">💬 Enviar via WhatsApp</button>' +
        '</div>' +
      '</div>';
  } else {
    catalogoContainer.style.display = 'none';
    catalogoContainer.innerHTML = '';
  }

  // Ações
  document.getElementById('modal-actions').innerHTML =
    '<a class="btn-whats-big" href="https://wa.me/' + encodeURIComponent(c.whatsapp) + '?text=' + encodeURIComponent('Olá! Encontrei seu comércio no Comércio BES. Gostaria de mais informações!') + '" target="_blank" rel="noopener noreferrer" onclick="registrarEstatistica(' + parseInt(c.id) + ', \'whatsapp_click\')">💬 Falar no WhatsApp</a>' +
    '<a class="btn-maps" href="https://www.openstreetmap.org/?mlat=' + encodeURIComponent(c.lat) + '&mlon=' + encodeURIComponent(c.lng) + '&zoom=17" target="_blank" rel="noopener noreferrer">🗺️ Ver no Mapa</a>' +
    '<button class="btn-compartilhar" onclick="copiarLinkLoja(\'' + escapeHTML(c.slug) + '\')">🔗 Compartilhar Loja</button>';

  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    fecharModal();
    fecharCarrinhoDrawer();
    fecharAuth();
    fecharCadastroLoja();
    fecharCheckout();
    fecharPedidos();
  }
});

// ===== CARRINHO MODAL (quantidades no modal da loja) =====

function alterarQtdModal(idx, delta) {
  const atual = carrinhoModal[idx] || 0;
  const novo = Math.max(0, atual + delta);
  carrinhoModal[idx] = novo;
  const el = document.getElementById('qtd-' + idx);
  if (el) el.textContent = novo;
  atualizarResumoModal();
}

function atualizarResumoModal() {
  if (!comercioAtual || !comercioAtual.catalogo) return;
  const itens = Object.entries(carrinhoModal)
    .filter(([, qtd]) => qtd > 0)
    .map(([idx, qtd]) => ({ produto: comercioAtual.catalogo[parseInt(idx)], qtd }));

  const resumoEl = document.getElementById('carrinho-resumo');
  const totalEl = document.getElementById('carrinho-total');
  if (itens.length === 0) { resumoEl.style.display = 'none'; return; }

  const total = itens.reduce((sum, i) => sum + (i.produto.preco * i.qtd), 0);
  resumoEl.style.display = 'block';
  totalEl.innerHTML = '<strong>' + itens.length + ' ' + (itens.length === 1 ? 'item' : 'itens') + '</strong> · Total: <strong>R$ ' + total.toFixed(2).replace('.', ',') + '</strong>';
}

function adicionarAoCarrinho() {
  if (!comercioAtual || !comercioAtual.catalogo) return;
  const itens = Object.entries(carrinhoModal)
    .filter(([, qtd]) => qtd > 0)
    .map(([idx, qtd]) => ({ produto: comercioAtual.catalogo[parseInt(idx)], qtd }));

  if (itens.length === 0) {
    mostrarToast('🛒 Selecione pelo menos um item!');
    return;
  }

  itens.forEach(i => {
    Cart.add(comercioAtual.id, comercioAtual.nome, comercioAtual.whatsapp, i.produto, i.qtd);
  });

  mostrarToast('✅ ' + itens.length + ' item(ns) adicionado(s) ao carrinho!');
  carrinhoModal = {};
  comercioAtual.catalogo.forEach((_, idx) => {
    const el = document.getElementById('qtd-' + idx);
    if (el) el.textContent = '0';
  });
  atualizarResumoModal();
}

// ===== WHATSAPP PEDIDO (do modal) =====

function enviarPedidoWhatsApp() {
  if (!comercioAtual || !comercioAtual.catalogo) return;
  const produtosSelecionados = Object.entries(carrinhoModal)
    .filter(([, qtd]) => qtd > 0)
    .map(([idx, qtd]) => ({ produto: comercioAtual.catalogo[parseInt(idx)], qtd }));

  if (produtosSelecionados.length === 0) {
    mostrarToast('🛒 Selecione pelo menos um item para enviar o pedido!');
    return;
  }

  // Add items to cart and go through checkout for address data
  produtosSelecionados.forEach(i => {
    Cart.add(comercioAtual.id, comercioAtual.nome, comercioAtual.whatsapp, i.produto, i.qtd);
  });
  carrinhoModal = {};
  comercioAtual.catalogo.forEach((_, idx) => {
    const el = document.getElementById('qtd-' + idx);
    if (el) el.textContent = '0';
  });
  atualizarResumoModal();
  fecharModal();
  abrirCheckout();
  mostrarToast('📋 Preencha seus dados e clique em "Enviar via WhatsApp".');
}

function gerarLinkWhatsApp(loja, produtosSelecionados, cliente) {
  const nome = cliente && cliente.nome ? cliente.nome : (Auth.getUser()?.nome || 'Cliente');
  let texto = 'Olá meu nome é ' + nome + ' vim pelo ComércioBes! e gostaria de fazer um pedido:\n';
  texto += '======================\n';
  let total = 0;
  produtosSelecionados.forEach(item => {
    const subtotal = item.produto.preco * item.qtd;
    total += subtotal;
    texto += '- ' + item.qtd + 'x ' + item.produto.nome_produto + '\n';
  });
  texto += '======================\n';

  if (cliente && cliente.rua) {
    texto += cliente.rua + '\n';
    texto += (cliente.bairro || '') + '\n';
    const compNum = ((cliente.complemento || '') + ' ' + (cliente.numero || '')).trim();
    if (compNum) texto += compNum + '\n';
    if (cliente.referencia) texto += cliente.referencia + '\n';
  }

  texto += '=========================\n';
  texto += 'Total: R$' + total.toFixed(2).replace('.', ',');
  return 'https://wa.me/' + encodeURIComponent(loja.whatsapp) + '?text=' + encodeURIComponent(texto);
}

// ===== FAVORITOS =====

function toggleFavoritoModal() {
  if (!comercioAtual) return;
  const added = Favorites.toggle(comercioAtual.id);
  const btn = document.getElementById('modal-fav');
  if (btn) {
    btn.textContent = added ? '♥' : '♡';
    btn.classList.toggle('active', added);
  }
  mostrarToast(added ? '❤️ Adicionado aos favoritos!' : '💔 Removido dos favoritos.');
  renderizarCards(filtrarPorCategoria(categoriaAtiva));
  renderFavoritos();
}

function toggleFavoritoCard(lojaId, btn) {
  const added = Favorites.toggle(lojaId);
  btn.textContent = added ? '♥' : '♡';
  btn.classList.toggle('active', added);
  mostrarToast(added ? '❤️ Adicionado aos favoritos!' : '💔 Removido dos favoritos.');
  renderFavoritos();
}

// ===== CART DRAWER =====

function toggleCarrinhoDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const isOpen = drawer.classList.contains('open');
  if (isOpen) {
    fecharCarrinhoDrawer();
  } else {
    renderCarrinhoDrawer();
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function fecharCarrinhoDrawer() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
  if (!document.querySelector('.modal-overlay.open, .auth-overlay.open, .checkout-overlay.open')) {
    document.body.style.overflow = '';
  }
}

function renderCarrinhoDrawer() {
  const cart = Cart.get();
  const body = document.getElementById('drawer-body');
  const footer = document.getElementById('drawer-footer');

  if (cart.length === 0) {
    body.innerHTML = '<div class="drawer-empty"><p style="font-size:48px;margin-bottom:16px;">🛒</p><p>Seu carrinho está vazio</p><p style="font-size:13px;color:#aaa;margin-top:8px;">Adicione itens do cardápio das lojas</p></div>';
    footer.style.display = 'none';
    return;
  }

  // Group by store
  const byStore = {};
  cart.forEach((item, idx) => {
    if (!byStore[item.lojaId]) {
      byStore[item.lojaId] = { nome: item.lojaNome, whatsapp: item.lojaWhatsapp, items: [] };
    }
    byStore[item.lojaId].items.push({ ...item, globalIdx: idx });
  });

  let html = '';
  Object.entries(byStore).forEach(([lojaId, store]) => {
    html += '<div class="drawer-store">';
    html += '<div class="drawer-store-name">' + escapeHTML(store.nome) + '</div>';
    store.items.forEach(item => {
      const subtotal = item.produto.preco * item.qtd;
      html += '<div class="drawer-item">' +
        '<div class="drawer-item-info">' +
          '<div class="drawer-item-name">' + escapeHTML(item.produto.nome_produto) + '</div>' +
          '<div class="drawer-item-price">R$ ' + Number(subtotal).toFixed(2).replace('.', ',') + '</div>' +
        '</div>' +
        '<div class="drawer-item-controls">' +
          '<button class="qtd-btn-sm" onclick="cartUpdateQtd(' + parseInt(item.globalIdx) + ', -1)">−</button>' +
          '<span>' + parseInt(item.qtd) + '</span>' +
          '<button class="qtd-btn-sm" onclick="cartUpdateQtd(' + parseInt(item.globalIdx) + ', 1)">+</button>' +
          '<button class="drawer-remove" onclick="cartRemove(' + parseInt(item.globalIdx) + ')">🗑️</button>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
  });

  body.innerHTML = html;
  footer.style.display = 'block';
  document.getElementById('drawer-total').innerHTML = '<strong>Total: R$ ' + Cart.total().toFixed(2).replace('.', ',') + '</strong>';
}

function cartUpdateQtd(idx, delta) {
  Cart.updateQtd(idx, delta);
  renderCarrinhoDrawer();
}

function cartRemove(idx) {
  Cart.remove(idx);
  renderCarrinhoDrawer();
}

// ===== ENVIAR TUDO VIA WHATSAPP (do drawer) =====

function enviarTudoWhatsApp() {
  const cart = Cart.get();
  if (cart.length === 0) { mostrarToast('🛒 Carrinho vazio!'); return; }

  // Go through checkout to collect address data
  abrirCheckout();
  mostrarToast('📋 Preencha seus dados e clique em "Enviar via WhatsApp".');
}

// ===== CHECKOUT =====

function abrirCheckout() {
  if (!Auth.isLoggedIn()) {
    mostrarToast('👤 Faça login para finalizar o pedido.');
    abrirAuth();
    return;
  }

  const cart = Cart.get();
  if (cart.length === 0) { mostrarToast('🛒 Carrinho vazio!'); return; }

  fecharCarrinhoDrawer();

  // Fill checkout form with user data
  const user = Auth.getUser();
  if (user) {
    document.getElementById('checkout-nome').value = user.nome || '';
    document.getElementById('checkout-tel').value = user.tel || '';
    document.getElementById('checkout-rua').value = '';
    document.getElementById('checkout-numero').value = '';
    document.getElementById('checkout-bairro').value = '';
    document.getElementById('checkout-complemento').value = '';
    document.getElementById('checkout-referencia').value = '';
  }

  // Render items
  let html = '';
  cart.forEach(item => {
    html += '<div class="checkout-item">' +
      '<span>' + parseInt(item.qtd) + 'x ' + escapeHTML(item.produto.nome_produto) + '</span>' +
      '<span>R$ ' + Number(item.produto.preco * item.qtd).toFixed(2).replace('.', ',') + '</span>' +
    '</div>';
  });
  document.getElementById('checkout-items').innerHTML = html;
  document.getElementById('checkout-total').innerHTML = '<strong>Total: R$ ' + Cart.total().toFixed(2).replace('.', ',') + '</strong>';

  document.getElementById('checkout-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharCheckout(e) {
  if (e && e.target !== document.getElementById('checkout-overlay')) return;
  document.getElementById('checkout-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function getCheckoutCliente() {
  const nome = document.getElementById('checkout-nome').value.trim();
  const rua = document.getElementById('checkout-rua').value.trim();
  const numero = document.getElementById('checkout-numero').value.trim();
  const bairro = document.getElementById('checkout-bairro').value.trim();
  const complemento = document.getElementById('checkout-complemento').value.trim();
  const referencia = document.getElementById('checkout-referencia').value.trim();
  const tel = document.getElementById('checkout-tel').value.trim();
  const pagamento = document.getElementById('checkout-pagamento').value;
  const obs = document.getElementById('checkout-obs').value.trim();

  if (!nome || !rua || !numero || !bairro || !tel) {
    mostrarToast('⚠️ Preencha todos os campos obrigatórios.');
    return null;
  }

  return { nome, rua, numero, bairro, complemento, referencia, tel, pagamento, obs };
}

function confirmarPedido(e) {
  if (e) e.preventDefault();
  const cliente = getCheckoutCliente();
  if (!cliente) return false;

  const cart = Cart.get();
  const endereco = cliente.rua + ', ' + cliente.numero + ' - ' + cliente.bairro +
    (cliente.complemento ? ' (' + cliente.complemento + ')' : '') +
    (cliente.referencia ? ' · Ref: ' + cliente.referencia : '');

  const order = Orders.create({
    items: cart,
    total: Cart.total(),
    cliente: { nome: cliente.nome, endereco, tel: cliente.tel },
    pagamento: cliente.pagamento,
    obs: cliente.obs,
    userId: Auth.getSession()?.userId
  });

  Cart.clear();
  fecharCheckout();
  renderCarrinhoDrawer();
  mostrarToast('✅ Pedido ' + order.id + ' confirmado com sucesso!');
  return false;
}

function confirmarPedidoWhatsApp() {
  const cliente = getCheckoutCliente();
  if (!cliente) return;

  const cart = Cart.get();

  // Group by store and send separate WhatsApp messages
  const byStore = {};
  cart.forEach(item => {
    if (!byStore[item.lojaId]) {
      byStore[item.lojaId] = { nome: item.lojaNome, whatsapp: item.lojaWhatsapp, items: [] };
    }
    byStore[item.lojaId].items.push(item);
  });

  Object.values(byStore).forEach(store => {
    const link = gerarLinkWhatsApp(
      { whatsapp: store.whatsapp },
      store.items.map(i => ({ produto: i.produto, qtd: i.qtd })),
      cliente
    );
    window.open(link, '_blank', 'noopener,noreferrer');
  });

  // Also save order
  const endereco = cliente.rua + ', ' + cliente.numero + ' - ' + cliente.bairro;
  Orders.create({
    items: cart,
    total: Cart.total(),
    cliente: { nome: cliente.nome, endereco, tel: cliente.tel },
    pagamento: cliente.pagamento,
    obs: cliente.obs,
    userId: Auth.getSession()?.userId
  });

  Cart.clear();
  fecharCheckout();
  renderCarrinhoDrawer();
  mostrarToast('✅ Pedido enviado via WhatsApp!');
}

// ===== AUTH UI =====

function abrirAuth() {
  document.getElementById('auth-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharAuth(e) {
  if (e && e.target !== document.getElementById('auth-overlay')) return;
  document.getElementById('auth-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function trocarAuthTab(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('auth-form-login').style.display = tab === 'login' ? 'flex' : 'none';
  document.getElementById('auth-form-cadastro').style.display = tab === 'cadastro' ? 'flex' : 'none';
  document.getElementById('auth-title').textContent = tab === 'login' ? '👤 Entrar' : '✨ Criar Conta';
}

async function fazerLogin(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;

  if (!email || !senha) { mostrarToast('⚠️ Preencha e-mail e senha.'); return false; }

  const result = await Auth.login(email, senha);
  if (!result.ok) {
    mostrarToast('❌ ' + result.msg);
    return false;
  }

  mostrarToast('✅ Bem-vindo(a), ' + result.user.nome + '!');
  fecharAuth();
  atualizarNavUser();
  document.getElementById('login-email').value = '';
  document.getElementById('login-senha').value = '';
  return false;
}

let tipoContaRegistro = 'usuario';

function trocarTipoConta(tipo) {
  tipoContaRegistro = tipo === 'lojista' ? 'lojista' : 'usuario';
  document.getElementById('tipo-cliente-btn').classList.toggle('active', tipo !== 'lojista');
  document.getElementById('tipo-lojista-btn').classList.toggle('active', tipo === 'lojista');
  document.getElementById('campos-lojista').style.display = tipo === 'lojista' ? 'block' : 'none';
  document.getElementById('reg-submit-btn').textContent = tipo === 'lojista' ? 'Criar Conta Lojista' : 'Criar Conta';
}

async function fazerCadastro(e) {
  if (e) e.preventDefault();
  const nome = document.getElementById('reg-nome').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const tel = document.getElementById('reg-tel').value.trim();
  const senha = document.getElementById('reg-senha').value;

  if (!nome || !email || !senha) { mostrarToast('⚠️ Preencha todos os campos obrigatórios.'); return false; }
  if (senha.length < 6) { mostrarToast('⚠️ A senha deve ter pelo menos 6 caracteres.'); return false; }

  let dadosLoja = null;
  if (tipoContaRegistro === 'lojista') {
    dadosLoja = {
      nome: document.getElementById('reg-loja-nome').value.trim(),
      whatsapp: document.getElementById('reg-loja-whatsapp').value.trim()
    };
  }

  const result = await Auth.register(nome, email, tel, senha, tipoContaRegistro, dadosLoja);
  if (!result.ok) {
    mostrarToast('❌ ' + result.msg);
    return false;
  }

  const saudacao = tipoContaRegistro === 'lojista' ? '✅ Conta lojista criada! Bem-vindo(a), ' + nome + '!' : '✅ Conta criada! Bem-vindo(a), ' + nome + '!';
  mostrarToast(saudacao);
  fecharAuth();
  atualizarNavUser();
  document.getElementById('reg-nome').value = '';
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-tel').value = '';
  document.getElementById('reg-senha').value = '';
  if (tipoContaRegistro === 'lojista') {
    document.getElementById('reg-loja-nome').value = '';
    document.getElementById('reg-loja-whatsapp').value = '';
  }
  tipoContaRegistro = 'usuario';
  trocarTipoConta('cliente');
  return false;
}

function fazerLogout() {
  Auth.logout();
  atualizarNavUser();
  fecharUserMenu();
  mostrarToast('👋 Você saiu da sua conta.');
}

// ===== NAVBAR USER MENU =====

function atualizarNavUser() {
  const btn = document.getElementById('nav-user-btn');
  const menu = document.getElementById('nav-user-menu');
  if (!btn || !menu) return;

  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    const nome = user ? user.nome.split(' ')[0] : 'Usuário';
    btn.textContent = '👤';
    btn.title = nome;
    menu.innerHTML =
      '<div class="user-menu-header">Olá, <strong>' + escapeHTML(nome) + '</strong></div>' +
      '<a class="user-menu-item" onclick="abrirPedidos()">📋 Meus Pedidos</a>' +
      '<a class="user-menu-item" onclick="abrirFavoritos()">❤️ Favoritos</a>' +
      '<a class="user-menu-item" onclick="abrirCadastroLoja()">➕ Cadastrar Loja</a>' +
      '<hr style="border:none;border-top:1px solid #eee;margin:8px 0;">' +
      '<a class="user-menu-item" onclick="fazerLogout()">🚪 Sair</a>';
  } else {
    btn.textContent = '👤';
    btn.title = 'Login';
    menu.innerHTML =
      '<a class="user-menu-item" onclick="abrirAuth()">👤 Entrar / Criar Conta</a>' +
      '<a class="user-menu-item" onclick="abrirCadastroLoja()">➕ Cadastrar Loja</a>';
  }
}

function toggleUserMenu() {
  const menu = document.getElementById('nav-user-menu');
  menu.classList.toggle('open');

  // Close on outside click
  if (menu.classList.contains('open')) {
    setTimeout(() => {
      document.addEventListener('click', fecharUserMenuOutside, { once: true });
    }, 0);
  }
}

function fecharUserMenu() {
  document.getElementById('nav-user-menu').classList.remove('open');
}

function fecharUserMenuOutside(e) {
  const wrapper = document.querySelector('.nav-user-wrapper');
  if (!wrapper.contains(e.target)) {
    fecharUserMenu();
  }
}

// ===== MOBILE MENU =====

function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

function fecharMobileMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
}

// ===== MERCHANT REGISTRATION =====

function abrirCadastroLoja(e) {
  if (e) e.preventDefault();
  if (!Auth.isLoggedIn()) {
    mostrarToast('👤 Faça login para cadastrar sua loja.');
    abrirAuth();
    return;
  }
  document.getElementById('merchant-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharCadastroLoja(e) {
  if (e && e.target !== document.getElementById('merchant-overlay')) return;
  document.getElementById('merchant-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function salvarCadastroLoja(e) {
  if (e) e.preventDefault();

  const nome = document.getElementById('loja-nome').value.trim();
  const categoria = document.getElementById('loja-categoria').value;
  const endereco = document.getElementById('loja-endereco').value.trim();
  const tel = document.getElementById('loja-tel').value.trim();
  const whatsapp = document.getElementById('loja-whatsapp').value.trim();
  const horario = document.getElementById('loja-horario').value.trim();
  const emoji = document.getElementById('loja-emoji').value.trim();

  if (!nome || !categoria || !endereco || !tel || !whatsapp) {
    mostrarToast('⚠️ Preencha todos os campos obrigatórios.');
    return false;
  }

  const loja = Merchants.register({ nome, categoria, endereco, tel, whatsapp, horario, emoji });
  comercios.push(loja);
  renderTudo();

  fecharCadastroLoja();
  mostrarToast('✅ Loja "' + nome + '" cadastrada com sucesso!');

  // Clear form
  document.getElementById('merchant-form').reset();
  return false;
}

// ===== ORDERS UI =====

function abrirPedidos() {
  fecharUserMenu();
  if (!Auth.isLoggedIn()) { abrirAuth(); return; }

  const orders = Orders.get();
  const container = document.getElementById('orders-list');

  if (orders.length === 0) {
    container.innerHTML = '<div class="drawer-empty"><p style="font-size:48px;margin-bottom:16px;">📋</p><p>Nenhum pedido ainda</p></div>';
  } else {
    container.innerHTML = orders.map(o => {
      const data = new Date(o.criadoEm);
      const dataStr = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
      const statusCor = o.status === 'pendente' ? '#FF6D00' : o.status === 'confirmado' ? '#00C853' : '#aaa';
      return '<div class="order-card">' +
        '<div class="order-header">' +
          '<strong>' + escapeHTML(o.id) + '</strong>' +
          '<span class="order-status" style="color:' + statusCor + '">' + escapeHTML(o.status).toUpperCase() + '</span>' +
        '</div>' +
        '<div class="order-date">' + escapeHTML(dataStr) + '</div>' +
        '<div class="order-items">' +
          o.items.map(i => '<div>' + parseInt(i.qtd) + 'x ' + escapeHTML(i.produto.nome_produto) + ' <span style="color:#aaa">(' + escapeHTML(i.lojaNome) + ')</span></div>').join('') +
        '</div>' +
        '<div class="order-total">Total: R$ ' + Number(o.total).toFixed(2).replace('.', ',') + '</div>' +
        '<div class="order-payment">Pagamento: ' + escapeHTML(o.pagamento) + '</div>' +
      '</div>';
    }).join('');
  }

  document.getElementById('orders-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharPedidos(e) {
  if (e && e.target !== document.getElementById('orders-overlay')) return;
  document.getElementById('orders-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ===== FAVORITOS UI =====

function abrirFavoritos() {
  fecharUserMenu();
  const section = document.getElementById('favoritos');
  if (!section) return;
  renderFavoritos();
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderFavoritos() {
  const section = document.getElementById('favoritos');
  if (!section) return;
  const favIds = Favorites.get();
  const favComercios = comercios.filter(c => favIds.includes(c.id));
  const grid = document.getElementById('favoritos-grid');
  const empty = document.getElementById('favoritos-empty');
  const count = document.getElementById('favoritos-count');

  if (favComercios.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    section.style.display = favIds.length > 0 || section.style.display === 'block' ? 'block' : 'none';
  } else {
    empty.style.display = 'none';
    grid.innerHTML = favComercios.map(criarCard).join('');
    section.style.display = 'block';
  }
  if (count) count.textContent = favComercios.length + (favComercios.length === 1 ? ' loja' : ' lojas');
}

// ===== AVALIAÇÃO =====

function avaliar(val) {
  avaliacao = val;
  document.querySelectorAll('.review-star').forEach((s, i) => {
    s.classList.toggle('active', i < val);
  });
}

function resetStars() {
  document.querySelectorAll('.review-star').forEach(s => s.classList.remove('active'));
}

async function enviarAvaliacao() {
  if (avaliacao === 0) {
    mostrarToast('⭐ Selecione uma nota antes de enviar!');
    return;
  }

  const comentario = document.querySelector('.review-input').value.trim();

  if (API_DISPONIVEL && comercioAtual.slug) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = storageGet(KEYS.API_TOKEN);
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const res = await fetch(API_BASE + '/avaliacoes/' + comercioAtual.slug, {
        method: 'POST',
        headers,
        body: JSON.stringify({ nota: avaliacao, comentario: comentario || undefined })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar');

      // Atualizar rating local com a media retornada pela API
      comercioAtual.rating = data.mediaAtual;
      comercioAtual.totalAvaliacoes = data.totalAvaliacoes;

      // Atualizar exibição das estrelas no modal
      document.getElementById('modal-stars-big').innerHTML =
        gerarStars(data.mediaAtual) +
        '<span class="modal-rating-big">' + escapeHTML(String(data.mediaAtual)) + '</span>' +
        '<span style="font-size:14px;color:#aaa;margin-left:8px;">(' + parseInt(data.totalAvaliacoes) + ' avaliações)</span>';

      mostrarToast('✅ Avaliação de ' + avaliacao + '★ enviada para ' + comercioAtual.nome + '!');
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err);
      mostrarToast('❌ Erro ao enviar avaliação: ' + err.message);
      return;
    }
  } else {
    // Fallback localStorage (sem API)
    mostrarToast('✅ Avaliação de ' + avaliacao + '★ enviada para ' + comercioAtual.nome + '!');
  }

  resetStars();
  avaliacao = 0;
  document.querySelector('.review-input').value = '';
}

// ===== TOAST =====

function mostrarToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== UTILIDADES =====

function atualizarAnoRodape() {
  const el = document.getElementById('current-year');
  if (el) el.textContent = String(new Date().getFullYear());
}

// ===== SKELETON LOADING =====

function mostrarSkeleton() {
  const grid = document.getElementById('main-grid');
  if (!grid) return;
  let skeletonHTML = '';
  for (let i = 0; i < 4; i++) {
    skeletonHTML += '<div class="store-card skeleton-card">' +
      '<div class="skeleton-img skeleton-pulse"></div>' +
      '<div class="store-body">' +
        '<div class="skeleton-line skeleton-pulse" style="width:40%;height:12px;margin-bottom:10px;"></div>' +
        '<div class="skeleton-line skeleton-pulse" style="width:80%;height:18px;margin-bottom:12px;"></div>' +
        '<div class="skeleton-line skeleton-pulse" style="width:60%;height:14px;margin-bottom:16px;"></div>' +
        '<div class="skeleton-line skeleton-pulse" style="width:50%;height:14px;margin-bottom:16px;"></div>' +
        '<div style="display:flex;gap:8px;">' +
          '<div class="skeleton-line skeleton-pulse" style="flex:1;height:40px;border-radius:12px;"></div>' +
          '<div class="skeleton-line skeleton-pulse" style="width:48px;height:40px;border-radius:12px;"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  grid.innerHTML = skeletonHTML;

  // Also skeleton for promos
  const promosGrid = document.getElementById('promos-grid');
  if (promosGrid) {
    let promoSkeleton = '';
    for (let i = 0; i < 3; i++) {
      promoSkeleton += '<div class="promo-card skeleton-card">' +
        '<div class="skeleton-line skeleton-pulse-dark" style="width:100px;height:20px;border-radius:100px;margin-bottom:14px;"></div>' +
        '<div class="skeleton-line skeleton-pulse-dark" style="width:70%;height:18px;margin-bottom:8px;"></div>' +
        '<div class="skeleton-line skeleton-pulse-dark" style="width:90%;height:14px;margin-bottom:16px;"></div>' +
        '<div class="skeleton-line skeleton-pulse-dark" style="width:40%;height:24px;"></div>' +
      '</div>';
    }
    promosGrid.innerHTML = promoSkeleton;
  }
}

// ===== DARK MODE =====

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('bes_dark_mode', isDark ? '1' : '0');
  const btn = document.getElementById('btn-dark-mode');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  // Update theme-color meta
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = isDark ? '#0A0A0A' : '#00C853';
}

function aplicarTema() {
  const dark = localStorage.getItem('bes_dark_mode') === '1';
  if (dark) {
    document.body.classList.add('dark-mode');
    const btn = document.getElementById('btn-dark-mode');
    if (btn) btn.textContent = '☀️';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = '#0A0A0A';
  }
}

// ===== PWA INSTALL =====

function configurarPWAInstall() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById('pwa-install-banner');
    if (banner && !localStorage.getItem('bes_pwa_dismissed')) {
      banner.style.display = 'block';
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    fecharBannerPWA();
    mostrarToast('✅ App instalado com sucesso!');
  });
}

function instalarPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choice => {
    if (choice.outcome === 'accepted') {
      mostrarToast('✅ Instalando o ComércioBES...');
    }
    deferredPrompt = null;
    fecharBannerPWA();
  });
}

function fecharBannerPWA() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.style.display = 'none';
  localStorage.setItem('bes_pwa_dismissed', '1');
}

// ===== LAZY LOADING IMAGES =====

function observarLazyImages() {
  const images = document.querySelectorAll('img[data-src]');
  if (!images.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('lazy-loaded');
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    images.forEach(img => observer.observe(img));
  } else {
    // Fallback
    images.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
}

// ===== BOOT =====
inicializar();
