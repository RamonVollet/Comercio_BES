// ===== DADOS DOS COMÉRCIOS =====
const comercios = [
  {
    id: 1, nome: "Pizzaria Bella Massa", categoria: "restaurante",
    tags: ["pizza", "restaurante", "delivery", "comida"],
    emoji: "🍕", rating: 4.8, visitas: 1240, recomendados: 98,
    aberto: true, endereco: "Rua XV de Novembro, 45",
    tel: "16991112222", whatsapp: "5516991112222",
    horario: "Ter-Dom · 18h às 23h",
    fotos: ["🍕","🍝","🥗"],
    promo: { ativo: true, desc: "Pizza Grande + 2 Refrigerantes", preco: "R$52", original: "R$72" }
  },
  {
    id: 2, nome: "Pizzaria Central", categoria: "restaurante",
    tags: ["pizza", "restaurante", "delivery"],
    emoji: "🍕", rating: 4.5, visitas: 980, recomendados: 85,
    aberto: true, endereco: "Av. Saudade, 210",
    tel: "16993334444", whatsapp: "5516993334444",
    horario: "Qua-Dom · 18h às 22h30",
    fotos: ["🍕","🥤","🧀"],
    promo: null
  },
  {
    id: 3, nome: "Farmácia Boa Esperança", categoria: "farmácia",
    tags: ["farmácia", "remédio", "medicamento", "saúde"],
    emoji: "💊", rating: 4.9, visitas: 2100, recomendados: 195,
    aberto: true, endereco: "Praça Cel. Marcondes, 8",
    tel: "16994445555", whatsapp: "5516994445555",
    horario: "Seg-Sab · 7h às 20h · Dom 8h às 13h",
    fotos: ["💊","🩺","🧴"],
    promo: null
  },
  {
    id: 4, nome: "Farmácia Popular BES", categoria: "farmácia",
    tags: ["farmácia", "remédio", "genérico", "saúde"],
    emoji: "💉", rating: 4.6, visitas: 1650, recomendados: 140,
    aberto: false, endereco: "Rua Floriano Peixoto, 77",
    tel: "16996667777", whatsapp: "5516996667777",
    horario: "Seg-Sex · 8h às 19h · Sab 8h às 14h",
    fotos: ["💉","💊","🏥"],
    promo: null
  },
  {
    id: 5, nome: "Pet Shop Mundo Animal", categoria: "pet",
    tags: ["pet", "cachorro", "gato", "ração", "banho", "tosa", "veterinário"],
    emoji: "🐾", rating: 4.9, visitas: 1890, recomendados: 178,
    aberto: true, endereco: "Rua das Flores, 120",
    tel: "16997778888", whatsapp: "5516997778888",
    horario: "Seg-Sab · 8h às 18h",
    fotos: ["🐾","🐕","🐈"],
    promo: { ativo: true, desc: "Banho e Tosa com 20% de desconto", preco: "R$40", original: "R$50" }
  },
  {
    id: 6, nome: "Mecânica do Zé", categoria: "mecânica",
    tags: ["mecânico", "carro", "conserto", "auto", "mecânica", "revisão"],
    emoji: "🔧", rating: 4.7, visitas: 780, recomendados: 92,
    aberto: true, endereco: "Rod. SP-255, km 3",
    tel: "16998889999", whatsapp: "5516998889999",
    horario: "Seg-Sex · 7h às 18h · Sab 7h às 12h",
    fotos: ["🔧","🚗","⚙️"],
    promo: null
  },
  {
    id: 7, nome: "Barbearia Estilo", categoria: "barbearia",
    tags: ["barbearia", "cabelo", "barba", "corte", "barbearia"],
    emoji: "💈", rating: 4.8, visitas: 1100, recomendados: 115,
    aberto: true, endereco: "Rua Tiradentes, 33",
    tel: "16992223333", whatsapp: "5516992223333",
    horario: "Ter-Sab · 8h às 19h",
    fotos: ["💈","✂️","🪒"],
    promo: { ativo: true, desc: "Corte + Barba", preco: "R$25", original: "R$35" }
  },
  {
    id: 8, nome: "Barbearia do Marcos", categoria: "barbearia",
    tags: ["barbearia", "cabelo", "barba", "corte"],
    emoji: "✂️", rating: 4.5, visitas: 720, recomendados: 68,
    aberto: false, endereco: "Av. Brasil, 55",
    tel: "16993332211", whatsapp: "5516993332211",
    horario: "Seg-Sab · 8h às 18h",
    fotos: ["✂️","💈","🪒"],
    promo: null
  },
  {
    id: 9, nome: "Supermercado Central", categoria: "supermercado",
    tags: ["supermercado", "mercado", "feira", "compras", "alimento"],
    emoji: "🛒", rating: 4.4, visitas: 3200, recomendados: 210,
    aberto: true, endereco: "Praça da República, 1",
    tel: "16994441234", whatsapp: "5516994441234",
    horario: "Seg-Sab · 7h às 21h · Dom 7h às 14h",
    fotos: ["🛒","🥩","🥦"],
    promo: null
  },
  {
    id: 10, nome: "Loja Moda & Estilo", categoria: "roupa",
    tags: ["roupa", "roupas", "moda", "vestuário", "blusa", "calça"],
    emoji: "👗", rating: 4.6, visitas: 640, recomendados: 72,
    aberto: true, endereco: "Rua XV de Novembro, 102",
    tel: "16991234567", whatsapp: "5516991234567",
    horario: "Seg-Sex · 9h às 18h · Sab 9h às 15h",
    fotos: ["👗","👕","👠"],
    promo: { ativo: true, desc: "50% OFF em toda linha inverno", preco: "a partir de R$29", original: "R$59" }
  },
  {
    id: 11, nome: "Hamburgueria Central", categoria: "restaurante",
    tags: ["hamburguer", "lanche", "burger", "restaurante", "delivery"],
    emoji: "🍔", rating: 4.7, visitas: 1560, recomendados: 145,
    aberto: true, endereco: "Av. Saudade, 85",
    tel: "16997654321", whatsapp: "5516997654321",
    horario: "Seg-Dom · 11h às 23h",
    fotos: ["🍔","🍟","🥤"],
    promo: { ativo: true, desc: "X-Burger + Batata Frita", preco: "R$18", original: "R$28" }
  },
  {
    id: 12, nome: "Salão Beleza Total", categoria: "salão",
    tags: ["salão", "cabelo", "manicure", "pedicure", "beleza", "corte"],
    emoji: "💅", rating: 4.9, visitas: 920, recomendados: 130,
    aberto: true, endereco: "Rua das Palmeiras, 14",
    tel: "16993219876", whatsapp: "5516993219876",
    horario: "Ter-Sab · 8h30 às 18h",
    fotos: ["💅","💆","✨"],
    promo: null
  },
  {
    id: 13, nome: "Padaria Pão Quente", categoria: "padaria",
    tags: ["padaria", "pão", "café", "salgado", "lanche", "bolo"],
    emoji: "🍞", rating: 4.8, visitas: 1780, recomendados: 188,
    aberto: true, endereco: "Rua Sete de Setembro, 23",
    tel: "16992341234", whatsapp: "5516992341234",
    horario: "Seg-Dom · 5h30 às 12h",
    fotos: ["🍞","☕","🥐"],
    promo: null
  },
  {
    id: 14, nome: "Distribuidora de Gás BES", categoria: "gás",
    tags: ["gás", "botijão", "glp", "entrega"],
    emoji: "🔥", rating: 4.5, visitas: 890, recomendados: 95,
    aberto: true, endereco: "Rua Independência, 67",
    tel: "16991122334", whatsapp: "5516991122334",
    horario: "Seg-Sab · 7h às 19h",
    fotos: ["🔥","🏠","🚚"],
    promo: null
  },
  {
    id: 15, nome: "Material de Construção BES", categoria: "material",
    tags: ["material", "construção", "tinta", "cimento", "ferragem", "obra"],
    emoji: "🏗️", rating: 4.3, visitas: 560, recomendados: 62,
    aberto: true, endereco: "Av. João Paulo II, 300",
    tel: "16994433221", whatsapp: "5516994433221",
    horario: "Seg-Sex · 7h às 17h · Sab 7h às 12h",
    fotos: ["🏗️","🪣","🔨"],
    promo: null
  },
];

let categoriaAtiva = 'todos';
let comercioAtual = null;
let avaliacao = 0;

// ===== WELCOME =====
function entrarNoSite() {
  document.getElementById('welcome-screen').classList.add('hidden');
  const main = document.getElementById('main-site');
  main.classList.add('visible');
  renderTudo();
}

// ===== RENDER =====
function renderTudo() {
  renderMain(comercios);
  renderPromos();
  renderRanking('rating');
}

function criarCard(c) {
  const stars = gerarStars(c.rating);
  const openBadge = c.aberto 
    ? '<span class="store-open">✓ Aberto</span>' 
    : '<span class="store-open store-closed">✗ Fechado</span>';
  
  return `
    <div class="store-card" onclick="abrirModal(${c.id})">
      <div class="store-img">
        <span>${c.emoji}</span>
        ${openBadge}
      </div>
      <div class="store-body">
        <div class="store-cat">${c.categoria.toUpperCase()}</div>
        <div class="store-name">${c.nome}</div>
        <div class="store-addr">📍 ${c.endereco}</div>
        <div class="store-stars">
          ${stars}
          <span class="store-rating-num">${c.rating}</span>
          <span class="store-reviews">(${c.visitas} visitas)</span>
        </div>
        <div class="store-actions">
          <a class="btn-whats" href="https://wa.me/${c.whatsapp}?text=Olá!%20Encontrei%20seu%20comércio%20no%20Comércio%20BES.%20Gostaria%20de%20mais%20informações!"
             target="_blank" onclick="event.stopPropagation()">
            💬 WhatsApp
          </a>
          <button class="btn-perfil" onclick="event.stopPropagation(); abrirModal(${c.id})">👁️</button>
        </div>
      </div>
    </div>
  `;
}

function gerarStars(r) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= Math.round(r) ? '<span class="star">★</span>' : '<span class="star-empty">★</span>';
  }
  return html;
}

function renderMain(lista) {
  document.getElementById('main-grid').innerHTML = lista.map(criarCard).join('');
}

function renderPromos() {
  const promos = comercios.filter(c => c.promo && c.promo.ativo);
  document.getElementById('promos-grid').innerHTML = promos.map(c => `
    <div class="promo-card" onclick="abrirModal(${c.id})">
      <div class="promo-badge">🔥 Promoção</div>
      <div class="promo-store">${c.emoji} ${c.nome}</div>
      <div class="promo-desc">${c.promo.desc}</div>
      <div>
        <span class="promo-price">${c.promo.preco}</span>
        <span class="promo-original">${c.promo.original}</span>
      </div>
    </div>
  `).join('');
}

function renderRanking(tipo) {
  let ordenados = [...comercios];
  if (tipo === 'rating') ordenados.sort((a,b) => b.rating - a.rating);
  if (tipo === 'visitas') ordenados.sort((a,b) => b.visitas - a.visitas);
  if (tipo === 'recomendados') ordenados.sort((a,b) => b.recomendados - a.recomendados);
  
  ordenados = ordenados.slice(0, 8);
  
  document.getElementById('ranking-list').innerHTML = ordenados.map((c, i) => {
    const cls = i===0?'top1':i===1?'top2':i===2?'top3':'';
    const val = tipo === 'rating' ? `${c.rating} ⭐` : tipo === 'visitas' ? `${c.visitas} visitas` : `${c.recomendados} ❤️`;
    return `
      <div class="ranking-item" onclick="abrirModal(${c.id})">
        <div class="rank-num ${cls}">${i+1}°</div>
        <div class="rank-emoji">${c.emoji}</div>
        <div class="rank-info">
          <div class="rank-name">${c.nome}</div>
          <div class="rank-cat">${c.categoria.charAt(0).toUpperCase()+c.categoria.slice(1)}</div>
        </div>
        <div class="rank-score">
          <strong>${val}</strong>
          <span>ranking</span>
        </div>
      </div>
    `;
  }).join('');
}

// ===== BUSCA =====
function filtrarBusca(q) {
  q = q.toLowerCase().trim();
  const resultsSection = document.getElementById('search-results');
  const noResults = document.getElementById('no-results');
  const grid = document.getElementById('results-grid');

  if (!q) {
    resultsSection.style.display = 'none';
    return;
  }

  resultsSection.style.display = 'block';
  document.getElementById('search-term').textContent = q.toUpperCase();
  document.getElementById('results-header').style.display = 'block';

  const encontrados = comercios.filter(c =>
    c.nome.toLowerCase().includes(q) ||
    c.tags.some(t => t.includes(q)) ||
    c.categoria.includes(q)
  );

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
  
  const filtrados = cat === 'todos' ? comercios : comercios.filter(c => c.categoria === cat || c.tags.includes(cat));
  renderMain(filtrados);
  
  const titulo = cat === 'todos' ? '🏪 Todos os Comércios' : `Categoria: ${cat.charAt(0).toUpperCase()+cat.slice(1)}`;
  document.getElementById('listings-title').textContent = titulo;
  
  document.querySelector('.listings-section').scrollIntoView({ behavior: 'smooth' });
}

// ===== ORDENAR =====
function ordenar(tipo) {
  let lista = categoriaAtiva === 'todos' ? [...comercios] : comercios.filter(c => c.categoria === categoriaAtiva || c.tags.includes(categoriaAtiva));
  if (tipo === 'rating') lista.sort((a,b) => b.rating - a.rating);
  if (tipo === 'nome') lista.sort((a,b) => a.nome.localeCompare(b.nome));
  if (tipo === 'visitas') lista.sort((a,b) => b.visitas - a.visitas);
  renderMain(lista);
}

// ===== RANKING =====
function mostrarRanking(tipo, el) {
  document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderRanking(tipo);
}

// ===== MODAL =====
function abrirModal(id) {
  const c = comercios.find(x => x.id === id);
  if (!c) return;
  comercioAtual = c;
  avaliacao = 0;
  resetStars();

  document.getElementById('modal-emoji').textContent = c.emoji;
  document.getElementById('modal-cat').textContent = c.categoria.toUpperCase();
  document.getElementById('modal-name').textContent = c.nome;

  document.getElementById('modal-info').innerHTML = `
    <div class="modal-info-row"><span class="modal-info-icon">📍</span> ${c.endereco}</div>
    <div class="modal-info-row"><span class="modal-info-icon">🕐</span> ${c.horario}</div>
    <div class="modal-info-row"><span class="modal-info-icon">📞</span> ${c.tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}</div>
    <div class="modal-info-row"><span class="modal-info-icon">${c.aberto ? '✅' : '❌'}</span> ${c.aberto ? 'Aberto agora' : 'Fechado no momento'}</div>
    ${c.promo ? `<div class="modal-info-row"><span class="modal-info-icon">🔥</span> <strong>Promoção:</strong>&nbsp;${c.promo.desc} — ${c.promo.preco}</div>` : ''}
  `;

  document.getElementById('modal-stars-big').innerHTML = `
    ${gerarStars(c.rating)}
    <span class="modal-rating-big">${c.rating}</span>
    <span style="font-size:14px;color:#aaa;margin-left:8px;">(${c.visitas} avaliações)</span>
  `;

  document.getElementById('modal-fotos').innerHTML = c.fotos.map(f => `
    <div class="foto-thumb">${f}</div>
  `).join('');

  document.getElementById('modal-actions').innerHTML = `
    <a class="btn-whats-big" 
       href="https://wa.me/${c.whatsapp}?text=Olá!%20Encontrei%20seu%20comércio%20no%20Comércio%20BES.%20Gostaria%20de%20mais%20informações!"
       target="_blank">
      💬 Falar no WhatsApp
    </a>
    <a class="btn-maps" 
       href="https://www.openstreetmap.org/?mlat=-21.805&mlon=-48.390&zoom=17"
       target="_blank">
      🗺️ Ver no Mapa
    </a>
  `;

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
    document.getElementById('modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }
});

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

function enviarAvaliacao() {
  if (avaliacao === 0) {
    mostrarToast('⭐ Selecione uma nota antes de enviar!');
    return;
  }
  mostrarToast(`✅ Avaliação de ${avaliacao}★ enviada para ${comercioAtual.nome}!`);
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

function atualizarAnoRodape() {
  const anoAtual = new Date().getFullYear();
  const anoEl = document.getElementById('current-year');
  if (anoEl) anoEl.textContent = String(anoAtual);
}

atualizarAnoRodape();
