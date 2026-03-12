// ===========================================
// Painel Comerciante/Cliente - Comercio BES
// ===========================================
const API_URL = window.location.origin + '/api';

// --- Estado global ---
let token = localStorage.getItem('bes_painel_token');
let user = JSON.parse(localStorage.getItem('bes_painel_user') || 'null');
let lojas = [];
let categorias = [];
let lojaAtualSlug = null;
let secaoAtual = 'visao-geral';

// ===========================================
// HELPERS
// ===========================================
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function headers(includeAuth = true) {
  const h = { 'Content-Type': 'application/json' };
  if (includeAuth && token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function api(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: headers(options.auth !== false),
      ...options
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        logout();
        throw new Error('Sessao expirada. Faca login novamente.');
      }
      throw new Error(data.error || 'Erro na requisicao');
    }
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Servidor indisponivel. Tente novamente.');
    }
    throw err;
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatMoney(val) {
  return 'R$ ' + (val || 0).toFixed(2).replace('.', ',');
}

function stars(nota) {
  let s = '';
  for (let i = 1; i <= 5; i++) s += i <= nota ? '\u2605' : '\u2606';
  return s;
}

function statusLabel(status) {
  const labels = {
    pendente: 'Pendente',
    confirmado: 'Confirmado',
    preparando: 'Preparando',
    saiu_entrega: 'Saiu p/ Entrega',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
    aprovado: 'Aprovado',
    recusado: 'Recusado',
    em_analise: 'Em Analise',
    devolvido: 'Devolvido'
  };
  return labels[status] || status;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===========================================
// TOAST
// ===========================================
function toast(msg, type = 'success') {
  const container = $('#toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ===========================================
// MODAL
// ===========================================
function openModal(title, bodyHtml, footerHtml) {
  // Remove modal existente
  const old = $('.modal-overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${escapeHtml(title)}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    </div>
  `;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.body.appendChild(overlay);
  return overlay;
}

function closeModal() {
  const overlay = $('.modal-overlay');
  if (overlay) overlay.remove();
}

// ===========================================
// AUTH
// ===========================================
function checkAuth() {
  if (token && user) {
    showDashboard();
  } else {
    showAuth();
  }
}

function showAuth() {
  $('#auth-page').classList.add('active');
  $('#dashboard-page').classList.remove('active');
}

function showDashboard() {
  $('#auth-page').classList.remove('active');
  $('#dashboard-page').classList.add('active');
  $('#sidebar-user-name').textContent = user.nome;
  $('#sidebar-user-type').textContent = user.tipo;
  $('#sidebar-user-type').className = `badge badge-${user.tipo}`;
  $('#topbar-nome').textContent = user.nomeFantasia || user.nome;
  buildSidebar();
  navigateTo('visao-geral');
}

function logout() {
  token = null;
  user = null;
  lojas = [];
  localStorage.removeItem('bes_painel_token');
  localStorage.removeItem('bes_painel_user');
  showAuth();
}

// --- Auth Tabs ---
$$('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    if (target === 'login') {
      $('#login-form').style.display = 'block';
      $('#registro-form').style.display = 'none';
    } else {
      $('#login-form').style.display = 'none';
      $('#registro-form').style.display = 'block';
    }
    $('#auth-error').style.display = 'none';
  });
});

// --- Account Type Toggle ---
$$('.account-type-card').forEach(card => {
  card.addEventListener('click', () => {
    $$('.account-type-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    card.querySelector('input').checked = true;
    const tipo = card.dataset.tipo;
    if (tipo === 'comerciante') {
      $('#campos-comerciante').style.display = 'block';
      $('#campos-cliente').style.display = 'none';
    } else {
      $('#campos-comerciante').style.display = 'none';
      $('#campos-cliente').style.display = 'block';
    }
  });
});

// --- Login Form ---
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#auth-error');
  errEl.style.display = 'none';

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: $('#login-email').value,
        senha: $('#login-senha').value
      }),
      auth: false
    });

    token = data.token;
    user = data.user;
    localStorage.setItem('bes_painel_token', token);
    localStorage.setItem('bes_painel_user', JSON.stringify(user));
    showDashboard();
    toast('Bem-vindo, ' + user.nome + '!');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  }
});

// --- Registro Form ---
$('#registro-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#auth-error');
  errEl.style.display = 'none';

  const tipo = document.querySelector('input[name="tipo"]:checked').value;
  const body = {
    nome: $('#reg-nome').value,
    email: $('#reg-email').value,
    senha: $('#reg-senha').value,
    telefone: $('#reg-telefone').value || null,
    tipo
  };

  if (tipo === 'comerciante') {
    body.nomeFantasia = $('#reg-nome-fantasia').value;
    body.cpfCnpj = $('#reg-cpf-cnpj').value;
    body.enderecoComercial = $('#reg-endereco-comercial').value || null;
    body.telefoneComercial = $('#reg-telefone-comercial').value || null;
  } else {
    body.cpf = $('#reg-cpf').value || null;
  }

  try {
    const data = await api('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: false
    });

    token = data.token;
    user = data.user;
    localStorage.setItem('bes_painel_token', token);
    localStorage.setItem('bes_painel_user', JSON.stringify(user));
    showDashboard();
    toast('Conta criada com sucesso!');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  }
});

// Logout
$('#btn-logout').addEventListener('click', logout);

// ===========================================
// SIDEBAR + NAVIGATION
// ===========================================
function buildSidebar() {
  const nav = $('#sidebar-nav');
  let html = '';

  if (user.tipo === 'comerciante' || user.tipo === 'admin') {
    html += `
      <div class="nav-section-title">Comercio</div>
      <button class="nav-item active" data-section="visao-geral">
        <span class="nav-icon">&#x1F4CA;</span> Visao Geral
      </button>
      <button class="nav-item" data-section="lojas">
        <span class="nav-icon">&#x1F3EA;</span> Minhas Lojas
      </button>
      <button class="nav-item" data-section="produtos">
        <span class="nav-icon">&#x1F4E6;</span> Produtos
      </button>
      <button class="nav-item" data-section="pedidos">
        <span class="nav-icon">&#x1F4CB;</span> Pedidos Recebidos
      </button>
      <button class="nav-item" data-section="avaliacoes">
        <span class="nav-icon">&#x2B50;</span> Avaliacoes
      </button>
      <button class="nav-item" data-section="estatisticas">
        <span class="nav-icon">&#x1F4C8;</span> Estatisticas
      </button>
    `;
  } else {
    // Cliente
    html += `
      <div class="nav-section-title">Minha Conta</div>
      <button class="nav-item active" data-section="visao-geral">
        <span class="nav-icon">&#x1F4CA;</span> Visao Geral
      </button>
      <button class="nav-item" data-section="meus-pedidos">
        <span class="nav-icon">&#x1F4CB;</span> Meus Pedidos
      </button>
      <button class="nav-item" data-section="enderecos">
        <span class="nav-icon">&#x1F4CD;</span> Meus Enderecos
      </button>
    `;
  }

  html += `
    <div class="nav-section-title">Conta</div>
    <button class="nav-item" data-section="perfil">
      <span class="nav-icon">&#x1F464;</span> Meu Perfil
    </button>
  `;

  nav.innerHTML = html;

  // Bind clicks
  nav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      nav.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      navigateTo(item.dataset.section);
      // Fechar sidebar mobile
      $('#sidebar').classList.remove('open');
    });
  });
}

// Menu toggle mobile
$('#btn-menu').addEventListener('click', () => {
  $('#sidebar').classList.toggle('open');
});

function navigateTo(section) {
  secaoAtual = section;
  const titleMap = {
    'visao-geral': 'Visao Geral',
    'lojas': 'Minhas Lojas',
    'produtos': 'Produtos',
    'pedidos': 'Pedidos Recebidos',
    'avaliacoes': 'Avaliacoes',
    'estatisticas': 'Estatisticas',
    'meus-pedidos': 'Meus Pedidos',
    'enderecos': 'Meus Enderecos',
    'perfil': 'Meu Perfil'
  };
  $('#page-title').textContent = titleMap[section] || section;

  const area = $('#content-area');
  area.innerHTML = '<div class="loading"><div class="spinner"></div><p>Carregando...</p></div>';

  switch (section) {
    case 'visao-geral':
      if (user.tipo === 'comerciante' || user.tipo === 'admin') loadVisaoGeralComerciante();
      else loadVisaoGeralCliente();
      break;
    case 'lojas': loadLojas(); break;
    case 'produtos': loadProdutosPage(); break;
    case 'pedidos': loadPedidosComerciante(); break;
    case 'avaliacoes': loadAvaliacoes(); break;
    case 'estatisticas': loadEstatisticas(); break;
    case 'meus-pedidos': loadMeusPedidos(); break;
    case 'enderecos': loadEnderecos(); break;
    case 'perfil': loadPerfil(); break;
  }
}

// ===========================================
// COMERCIANTE - VISAO GERAL
// ===========================================
async function loadVisaoGeralComerciante() {
  const area = $('#content-area');
  try {
    const [resumo, perfil] = await Promise.all([
      api('/pedidos/resumo'),
      api('/auth/perfil')
    ]);

    lojas = perfil.comercios || [];

    area.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">&#x23F3;</div>
          <div class="stat-value">${resumo.pendentes}</div>
          <div class="stat-label">Pedidos Pendentes</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">&#x1F4B0;</div>
          <div class="stat-value">${formatMoney(resumo.faturamento)}</div>
          <div class="stat-label">Faturamento (entregues)</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">&#x1F4CB;</div>
          <div class="stat-value">${resumo.total}</div>
          <div class="stat-label">Total de Pedidos</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">&#x1F3EA;</div>
          <div class="stat-value">${lojas.length}</div>
          <div class="stat-label">Minhas Lojas</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h4>Pedidos Recentes</h4>
        </div>
        <div class="card-body" id="pedidos-recentes-list">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </div>
    `;

    // Carregar pedidos recentes
    const pedidosData = await api('/pedidos?limit=5');
    const container = $('#pedidos-recentes-list');
    if (pedidosData.pedidos.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#x1F4CB;</div><h4>Nenhum pedido ainda</h4><p>Quando receber pedidos, eles aparecerao aqui</p></div>';
    } else {
      container.innerHTML = pedidosData.pedidos.map(p => renderOrderCard(p, 'comerciante')).join('');
    }
  } catch (err) {
    area.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

// ===========================================
// COMERCIANTE - MINHAS LOJAS
// ===========================================
async function loadLojas() {
  const area = $('#content-area');
  try {
    // Carregar categorias e perfil
    const [cats, perfil] = await Promise.all([
      api('/categorias', { auth: false }),
      api('/auth/perfil')
    ]);
    categorias = cats;
    lojas = perfil.comercios || [];

    area.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <p>${lojas.length} loja(s) cadastrada(s)</p>
        <button class="btn btn-primary" id="btn-nova-loja">+ Nova Loja</button>
      </div>
      <div class="stores-grid" id="lojas-grid"></div>
    `;

    const grid = $('#lojas-grid');
    if (lojas.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">&#x1F3EA;</div><h4>Nenhuma loja cadastrada</h4><p>Clique em "+ Nova Loja" para comecar a vender!</p></div>';
    } else {
      // Carregar dados completos das lojas
      const lojasCompletas = await api('/comercios?limit=100', { auth: false });
      const minhasLojas = lojasCompletas.comercios.filter(l => lojas.some(ml => ml.slug === l.slug));

      grid.innerHTML = minhasLojas.map(l => `
        <div class="store-card">
          <div class="store-card-header">
            <span class="store-card-emoji">${l.emoji}</span>
            <div>
              <div class="store-card-name">${escapeHtml(l.nome)}</div>
              <div class="store-card-status ${l.aberto ? 'open' : 'closed'}">${l.aberto ? 'Aberto' : 'Fechado'}</div>
            </div>
          </div>
          <div style="font-size:0.85rem; color:var(--cinza-texto); margin-bottom:8px;">
            ${escapeHtml(l.categoria)} &bull; ${stars(Math.round(l.rating))} ${l.rating} &bull; ${l.catalogo?.length || 0} produtos
          </div>
          <div class="store-card-actions">
            <button class="btn btn-primary btn-sm" onclick="Painel.editarLoja('${l.slug}')">Editar</button>
            <button class="btn btn-outline btn-sm" onclick="Painel.verProdutos('${l.slug}')">Produtos</button>
            <button class="btn btn-danger btn-sm" onclick="Painel.excluirLoja('${l.slug}')">Excluir</button>
          </div>
        </div>
      `).join('');
    }

    $('#btn-nova-loja').addEventListener('click', () => abrirModalLoja());
  } catch (err) {
    area.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

function abrirModalLoja(lojaData = null) {
  const isEdit = !!lojaData;
  const catOptions = categorias.map(c =>
    `<option value="${c.id}" ${lojaData && lojaData.categoriaId === c.id ? 'selected' : ''}>${c.emoji} ${c.nome}</option>`
  ).join('');

  const bodyHtml = `
    <form id="form-loja">
      <div class="form-group">
        <label>Nome da Loja *</label>
        <input type="text" id="loja-nome" required value="${escapeHtml(lojaData?.nome || '')}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Categoria *</label>
          <select id="loja-categoria" required>${catOptions}</select>
        </div>
        <div class="form-group">
          <label>Emoji *</label>
          <input type="text" id="loja-emoji" required value="${lojaData?.emoji || '&#x1F3EA;'}" maxlength="4">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>WhatsApp *</label>
          <input type="tel" id="loja-whatsapp" required value="${escapeHtml(lojaData?.whatsapp || '')}" placeholder="(16) 99999-9999">
        </div>
        <div class="form-group">
          <label>Telefone</label>
          <input type="tel" id="loja-tel" value="${escapeHtml(lojaData?.tel || '')}" placeholder="(16) 3344-5566">
        </div>
      </div>
      <div class="form-group">
        <label>Endereco *</label>
        <input type="text" id="loja-endereco" required value="${escapeHtml(lojaData?.endereco || '')}" placeholder="Rua, numero - Bairro">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Latitude *</label>
          <input type="number" id="loja-lat" step="any" required value="${lojaData?.lat || '-22.163'}">
        </div>
        <div class="form-group">
          <label>Longitude *</label>
          <input type="number" id="loja-lng" step="any" required value="${lojaData?.lng || '-48.568'}">
        </div>
      </div>
      <div class="form-group">
        <label>Horario de Funcionamento *</label>
        <input type="text" id="loja-horario" required value="${escapeHtml(lojaData?.horario || '')}" placeholder="Seg-Sex 8h-18h">
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="loja-aberto">
          <option value="true" ${lojaData?.aberto !== false ? 'selected' : ''}>Aberto</option>
          <option value="false" ${lojaData?.aberto === false ? 'selected' : ''}>Fechado</option>
        </select>
      </div>
      <div class="form-group">
        <label>Tags (separadas por virgula)</label>
        <input type="text" id="loja-tags" value="${escapeHtml((lojaData?.tags || []).join(', '))}" placeholder="pizza, delivery, italiano">
      </div>
      <div class="form-group">
        <label>Descricao</label>
        <textarea id="loja-descricao" placeholder="Descricao da loja...">${escapeHtml(lojaData?.descricao || '')}</textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" id="btn-salvar-loja">${isEdit ? 'Salvar Alteracoes' : 'Criar Loja'}</button>
  `;

  openModal(isEdit ? 'Editar Loja' : 'Nova Loja', bodyHtml, footerHtml);

  // Bind submit
  $('#btn-salvar-loja').addEventListener('click', async () => {
    const form = $('#form-loja');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const tags = $('#loja-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const body = {
      nome: $('#loja-nome').value,
      categoriaId: parseInt($('#loja-categoria').value),
      whatsapp: $('#loja-whatsapp').value,
      tel: $('#loja-tel').value || null,
      endereco: $('#loja-endereco').value,
      lat: parseFloat($('#loja-lat').value),
      lng: parseFloat($('#loja-lng').value),
      horario: $('#loja-horario').value,
      emoji: $('#loja-emoji').value,
      aberto: $('#loja-aberto').value === 'true',
      tags,
      descricao: $('#loja-descricao').value || null
    };

    try {
      if (isEdit) {
        await api(`/comercios/${lojaData.slug}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        toast('Loja atualizada!');
      } else {
        await api('/comercios', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        toast('Loja criada com sucesso!');
      }
      closeModal();
      loadLojas();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

// Editar loja - buscar dados completos
window.Painel = window.Painel || {};
Painel.editarLoja = async function(slug) {
  try {
    const loja = await api(`/comercios/${slug}`, { auth: false });
    const cat = categorias.find(c => c.slug === loja.categoriaSlug);
    loja.categoriaId = cat ? cat.id : null;
    abrirModalLoja(loja);
  } catch (err) {
    toast(err.message, 'error');
  }
};

Painel.excluirLoja = async function(slug) {
  if (!confirm('Tem certeza que deseja excluir esta loja? Esta acao nao pode ser desfeita.')) return;
  try {
    await api(`/comercios/${slug}`, { method: 'DELETE' });
    toast('Loja excluida!');
    loadLojas();
  } catch (err) {
    toast(err.message, 'error');
  }
};

Painel.verProdutos = function(slug) {
  // Navegar para produtos e selecionar esta loja
  const navItems = $$('#sidebar-nav .nav-item');
  navItems.forEach(n => n.classList.remove('active'));
  const prodBtn = Array.from(navItems).find(n => n.dataset.section === 'produtos');
  if (prodBtn) prodBtn.classList.add('active');
  navigateTo('produtos');
  // Selecionar a loja apos a pagina carregar
  setTimeout(() => {
    const select = $('#produto-loja-select');
    if (select) {
      select.value = slug;
      select.dispatchEvent(new Event('change'));
    }
  }, 500);
};

// ===========================================
// COMERCIANTE - PRODUTOS
// ===========================================
async function loadProdutosPage() {
  const area = $('#content-area');
  try {
    const [cats, perfil] = await Promise.all([
      api('/categorias', { auth: false }),
      api('/auth/perfil')
    ]);
    categorias = cats;
    lojas = perfil.comercios || [];

    const lojaOptions = lojas.map(l =>
      `<option value="${l.slug}">${l.emoji} ${l.nome}</option>`
    ).join('');

    area.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h4>Selecione uma loja</h4>
        </div>
        <div class="card-body">
          <div class="form-group">
            <select id="produto-loja-select">
              <option value="">-- Selecione --</option>
              ${lojaOptions}
            </select>
          </div>
        </div>
      </div>
      <div id="produtos-container" style="display:none">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h4 id="produtos-loja-nome"></h4>
          <button class="btn btn-primary btn-sm" id="btn-novo-produto">+ Novo Produto</button>
        </div>
        <div class="card">
          <div class="card-body table-responsive" id="produtos-lista"></div>
        </div>
        <div class="card" style="margin-top:16px">
          <div class="card-header">
            <h4>Promocao</h4>
          </div>
          <div class="card-body">
            <form id="form-promo">
              <div class="form-group">
                <label>Descricao da promocao</label>
                <input type="text" id="promo-desc" placeholder="Ex: Combo familia por apenas..." required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Preco promocional</label>
                  <input type="text" id="promo-preco" placeholder="R$ 39,90" required>
                </div>
                <div class="form-group">
                  <label>Preco original</label>
                  <input type="text" id="promo-original" placeholder="R$ 59,90" required>
                </div>
              </div>
              <div style="display:flex; gap:8px;">
                <button type="submit" class="btn btn-primary btn-sm">Salvar Promocao</button>
                <button type="button" class="btn btn-danger btn-sm" id="btn-remover-promo">Remover</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Bind select
    $('#produto-loja-select').addEventListener('change', async (e) => {
      const slug = e.target.value;
      if (!slug) {
        $('#produtos-container').style.display = 'none';
        return;
      }
      lojaAtualSlug = slug;
      await carregarProdutosDaLoja(slug);
    });

    // Bind novo produto
    $('#btn-novo-produto').addEventListener('click', () => abrirModalProduto());

    // Bind promo form
    $('#form-promo').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!lojaAtualSlug) return;
      try {
        await api(`/comercios/${lojaAtualSlug}/promocao`, {
          method: 'PUT',
          body: JSON.stringify({
            descricao: $('#promo-desc').value,
            preco: $('#promo-preco').value,
            original: $('#promo-original').value,
            ativo: true
          })
        });
        toast('Promocao salva!');
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    $('#btn-remover-promo').addEventListener('click', async () => {
      if (!lojaAtualSlug) return;
      try {
        await api(`/comercios/${lojaAtualSlug}/promocao`, { method: 'DELETE' });
        toast('Promocao removida!');
        $('#form-promo').reset();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  } catch (err) {
    area.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

async function carregarProdutosDaLoja(slug) {
  try {
    const loja = await api(`/comercios/${slug}`, { auth: false });
    $('#produtos-loja-nome').textContent = `${loja.emoji} ${loja.nome}`;
    $('#produtos-container').style.display = 'block';

    const container = $('#produtos-lista');
    if (!loja.catalogo || loja.catalogo.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#x1F4E6;</div><h4>Nenhum produto</h4><p>Adicione produtos ao catalogo da loja</p></div>';
    } else {
      container.innerHTML = `<table>
        <thead><tr><th>Produto</th><th>Descricao</th><th>Preco</th><th>Status</th><th>Acoes</th></tr></thead>
        <tbody>${loja.catalogo.map(p => `<tr>
          <td><strong>${escapeHtml(p.nome_produto)}</strong></td>
          <td style="color:var(--cinza-texto); font-size:0.85rem;">${escapeHtml(p.descricao || '-')}</td>
          <td>${formatMoney(p.preco)}</td>
          <td><span class="badge ${p.disponivel ? 'badge-confirmado' : 'badge-cancelado'}">${p.disponivel ? 'Ativo' : 'Inativo'}</span></td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="Painel.editarProduto(${p.id})">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="Painel.excluirProduto(${p.id})">X</button>
          </td>
        </tr>`).join('')}</tbody></table>`;
    }

    // Preencher promo
    if (loja.promo) {
      $('#promo-desc').value = loja.promo.desc || '';
      $('#promo-preco').value = loja.promo.preco || '';
      $('#promo-original').value = loja.promo.original || '';
    } else {
      $('#form-promo').reset();
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

function abrirModalProduto(prodData = null) {
  const isEdit = !!prodData;
  const bodyHtml = `
    <form id="form-produto">
      <div class="form-group">
        <label>Nome do Produto *</label>
        <input type="text" id="prod-nome" required value="${escapeHtml(prodData?.nome_produto || prodData?.nome || '')}">
      </div>
      <div class="form-group">
        <label>Descricao</label>
        <textarea id="prod-descricao">${escapeHtml(prodData?.descricao || '')}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Preco (R$) *</label>
          <input type="number" id="prod-preco" step="0.01" min="0.01" required value="${prodData?.preco || ''}">
        </div>
        <div class="form-group">
          <label>Disponivel</label>
          <select id="prod-disponivel">
            <option value="true" ${prodData?.disponivel !== false ? 'selected' : ''}>Sim</option>
            <option value="false" ${prodData?.disponivel === false ? 'selected' : ''}>Nao</option>
          </select>
        </div>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" id="btn-salvar-produto">${isEdit ? 'Salvar' : 'Adicionar'}</button>
  `;

  openModal(isEdit ? 'Editar Produto' : 'Novo Produto', bodyHtml, footerHtml);

  $('#btn-salvar-produto').addEventListener('click', async () => {
    const form = $('#form-produto');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const body = {
      nome: $('#prod-nome').value,
      descricao: $('#prod-descricao').value || '',
      preco: parseFloat($('#prod-preco').value),
      disponivel: $('#prod-disponivel').value === 'true'
    };

    try {
      if (isEdit && prodData.id) {
        await api(`/comercios/${lojaAtualSlug}/produtos/${prodData.id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        toast('Produto atualizado!');
      } else {
        await api(`/comercios/${lojaAtualSlug}/produtos`, {
          method: 'POST',
          body: JSON.stringify(body)
        });
        toast('Produto adicionado!');
      }
      closeModal();
      carregarProdutosDaLoja(lojaAtualSlug);
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

Painel.editarProduto = async function(id) {
  if (!lojaAtualSlug) return;
  try {
    const loja = await api(`/comercios/${lojaAtualSlug}`, { auth: false });
    const prod = (loja.catalogo || []).find(p => p.id === id);
    if (prod) abrirModalProduto(prod);
    else toast('Produto nao encontrado', 'error');
  } catch (err) {
    toast(err.message, 'error');
  }
};

Painel.excluirProduto = async function(id) {
  if (!lojaAtualSlug) return;
  if (!confirm('Excluir este produto?')) return;
  try {
    await api(`/comercios/${lojaAtualSlug}/produtos/${id}`, { method: 'DELETE' });
    toast('Produto excluido!');
    carregarProdutosDaLoja(lojaAtualSlug);
  } catch (err) {
    toast(err.message, 'error');
  }
};

// ===========================================
// COMERCIANTE - PEDIDOS RECEBIDOS
// ===========================================
async function loadPedidosComerciante() {
  const area = $('#content-area');
  try {
    area.innerHTML = `
      <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">
        <button class="btn btn-sm btn-primary pedido-filter active" data-status="">Todos</button>
        <button class="btn btn-sm btn-outline pedido-filter" data-status="pendente">Pendentes</button>
        <button class="btn btn-sm btn-outline pedido-filter" data-status="confirmado">Confirmados</button>
        <button class="btn btn-sm btn-outline pedido-filter" data-status="preparando">Preparando</button>
        <button class="btn btn-sm btn-outline pedido-filter" data-status="saiu_entrega">Em Entrega</button>
        <button class="btn btn-sm btn-outline pedido-filter" data-status="entregue">Entregues</button>
        <button class="btn btn-sm btn-outline pedido-filter" data-status="cancelado">Cancelados</button>
      </div>
      <div id="pedidos-list"><div class="loading"><div class="spinner"></div></div></div>
      <div id="pedidos-paginacao" style="display:flex; gap:8px; justify-content:center; margin-top:16px;"></div>
    `;

    let filtroStatus = '';
    let paginaAtual = 1;

    async function carregarPedidos() {
      const container = $('#pedidos-list');
      container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

      const query = `?limit=10&page=${paginaAtual}${filtroStatus ? '&status=' + filtroStatus : ''}`;
      const data = await api('/pedidos' + query);

      if (data.pedidos.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#x1F4CB;</div><h4>Nenhum pedido encontrado</h4></div>';
        $('#pedidos-paginacao').innerHTML = '';
        return;
      }

      container.innerHTML = data.pedidos.map(p => renderOrderCard(p, 'comerciante')).join('');

      // Paginacao
      const pag = data.paginacao;
      let pagHtml = '';
      if (pag.totalPaginas > 1) {
        for (let i = 1; i <= pag.totalPaginas; i++) {
          pagHtml += `<button class="btn btn-sm ${i === pag.pagina ? 'btn-primary' : 'btn-outline'}" onclick="Painel.pedidoPagina(${i})">${i}</button>`;
        }
      }
      $('#pedidos-paginacao').innerHTML = pagHtml;
    }

    // Filtros
    area.querySelectorAll('.pedido-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        area.querySelectorAll('.pedido-filter').forEach(b => {
          b.classList.remove('active', 'btn-primary');
          b.classList.add('btn-outline');
        });
        btn.classList.add('active', 'btn-primary');
        btn.classList.remove('btn-outline');
        filtroStatus = btn.dataset.status;
        paginaAtual = 1;
        carregarPedidos();
      });
    });

    Painel.pedidoPagina = function(page) {
      paginaAtual = page;
      carregarPedidos();
    };

    await carregarPedidos();
  } catch (err) {
    area.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

function renderOrderCard(p, viewAs) {
  const itensText = (p.itens || []).map(i => `${i.quantidade}x ${escapeHtml(i.nome)}`).join(', ');
  const pagStatus = p.pagamento ? p.pagamento.status : 'sem pagamento';
  const pagMetodo = p.pagamento ? p.pagamento.metodo : '-';

  let actionsHtml = '';
  if (viewAs === 'comerciante') {
    // Comerciante pode alterar status
    if (!['entregue', 'cancelado'].includes(p.status)) {
      const nextStatus = {
        pendente: { label: 'Confirmar', status: 'confirmado' },
        confirmado: { label: 'Preparando', status: 'preparando' },
        preparando: { label: 'Saiu p/ Entrega', status: 'saiu_entrega' },
        saiu_entrega: { label: 'Entregue', status: 'entregue' }
      };
      const next = nextStatus[p.status];
      if (next) {
        actionsHtml += `<button class="btn btn-sm btn-primary" onclick="Painel.atualizarStatus('${p.codigo}', '${next.status}')">${next.label}</button>`;
      }
      actionsHtml += `<button class="btn btn-sm btn-danger" onclick="Painel.cancelarPedido('${p.codigo}')">Cancelar</button>`;
    }
  } else {
    // Cliente pode cancelar se nao entregue/cancelado
    if (!['entregue', 'cancelado'].includes(p.status)) {
      actionsHtml += `<button class="btn btn-sm btn-danger" onclick="Painel.cancelarPedido('${p.codigo}')">Cancelar</button>`;
    }
  }

  actionsHtml += `<button class="btn btn-sm btn-outline" onclick="Painel.verPedido('${p.codigo}')">Detalhes</button>`;

  return `
    <div class="order-card">
      <div class="order-header">
        <div>
          <span class="order-code">${p.codigo}</span>
          ${viewAs === 'comerciante' && p.cliente ? `<span style="color:var(--cinza-texto); font-size:0.85rem; margin-left:8px;">${escapeHtml(p.cliente.nome)}</span>` : ''}
          ${viewAs !== 'comerciante' && p.comercio ? `<span style="color:var(--cinza-texto); font-size:0.85rem; margin-left:8px;">${p.comercio.emoji} ${escapeHtml(p.comercio.nome)}</span>` : ''}
        </div>
        <span class="badge badge-${p.status}">${statusLabel(p.status)}</span>
      </div>
      <div class="order-items">${itensText || 'Sem itens'}</div>
      <div class="order-footer">
        <div>
          <span class="order-total">${formatMoney(p.total)}</span>
          <span style="font-size:0.75rem; color:var(--cinza-texto); margin-left:8px;">${p.tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada'} &bull; ${pagMetodo}</span>
        </div>
        <span class="order-date">${formatDateTime(p.createdAt)}</span>
      </div>
      ${actionsHtml ? `<div class="order-actions">${actionsHtml}</div>` : ''}
    </div>
  `;
}

Painel.atualizarStatus = async function(codigo, status) {
  try {
    await api(`/pedidos/${codigo}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    toast(`Pedido ${codigo} atualizado para ${statusLabel(status)}`);
    // Recarregar a secao atual
    if (secaoAtual === 'pedidos') loadPedidosComerciante();
    else if (secaoAtual === 'visao-geral') loadVisaoGeralComerciante();
    else if (secaoAtual === 'meus-pedidos') loadMeusPedidos();
  } catch (err) {
    toast(err.message, 'error');
  }
};

Painel.cancelarPedido = function(codigo) {
  const bodyHtml = `
    <form id="form-cancelar">
      <div class="form-group">
        <label>Motivo do cancelamento *</label>
        <textarea id="cancel-motivo" required placeholder="Informe o motivo do cancelamento..."></textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-outline" onclick="closeModal()">Voltar</button>
    <button class="btn btn-danger" id="btn-confirmar-cancel">Confirmar Cancelamento</button>
  `;

  openModal('Cancelar Pedido ' + codigo, bodyHtml, footerHtml);

  $('#btn-confirmar-cancel').addEventListener('click', async () => {
    const motivo = $('#cancel-motivo').value;
    if (!motivo.trim()) {
      toast('Informe o motivo do cancelamento', 'error');
      return;
    }
    try {
      await api(`/pedidos/${codigo}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelado', motivoCancelamento: motivo })
      });
      toast('Pedido cancelado');
      closeModal();
      if (secaoAtual === 'pedidos') loadPedidosComerciante();
      else if (secaoAtual === 'meus-pedidos') loadMeusPedidos();
      else if (secaoAtual === 'visao-geral') {
        if (user.tipo === 'comerciante' || user.tipo === 'admin') loadVisaoGeralComerciante();
        else loadVisaoGeralCliente();
      }
    } catch (err) {
      toast(err.message, 'error');
    }
  });
};

Painel.verPedido = async function(codigo) {
  try {
    const pedido = await api(`/pedidos/${codigo}`);

    const itensHtml = (pedido.itens || []).map(i => `
      <tr>
        <td>${escapeHtml(i.nome)}</td>
        <td style="text-align:center">${i.quantidade}</td>
        <td style="text-align:right">${formatMoney(i.preco)}</td>
        <td style="text-align:right">${formatMoney(i.preco * i.quantidade)}</td>
      </tr>
    `).join('');

    const enderecoText = pedido.endereco
      ? `${pedido.endereco.rua}, ${pedido.endereco.numero}${pedido.endereco.complemento ? ' - ' + pedido.endereco.complemento : ''}, ${pedido.endereco.bairro} (${pedido.endereco.apelido})`
      : 'Retirada no local';

    const bodyHtml = `
      <div style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4>${pedido.codigo}</h4>
          <span class="badge badge-${pedido.status}">${statusLabel(pedido.status)}</span>
        </div>
        <p style="font-size:0.85rem; color:var(--cinza-texto);">
          ${pedido.comercio.emoji} ${escapeHtml(pedido.comercio.nome)} &bull; ${formatDateTime(pedido.createdAt)}
        </p>
        ${pedido.cliente ? `<p style="font-size:0.85rem; color:var(--cinza-texto);">Cliente: ${escapeHtml(pedido.cliente.nome)} (${escapeHtml(pedido.cliente.email)})</p>` : ''}
      </div>

      <div class="table-responsive">
        <table>
          <thead><tr><th>Produto</th><th style="text-align:center">Qtd</th><th style="text-align:right">Preco</th><th style="text-align:right">Subtotal</th></tr></thead>
          <tbody>${itensHtml}</tbody>
        </table>
      </div>

      <div style="margin-top:16px; font-size:0.9rem;">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span>Subtotal</span><span>${formatMoney(pedido.subtotal)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span>Taxa de entrega</span><span>${formatMoney(pedido.taxaEntrega)}</span>
        </div>
        ${pedido.desconto > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:4px; color:var(--verde);">
          <span>Desconto</span><span>-${formatMoney(pedido.desconto)}</span>
        </div>` : ''}
        <div style="display:flex; justify-content:space-between; font-weight:700; font-size:1.1rem; border-top:1px solid var(--cinza-borda); padding-top:8px; margin-top:8px;">
          <span>Total</span><span>${formatMoney(pedido.total)}</span>
        </div>
      </div>

      <div style="margin-top:16px; font-size:0.85rem; color:var(--cinza-texto);">
        <p><strong>Entrega:</strong> ${pedido.tipoEntrega === 'entrega' ? 'Delivery' : 'Retirada'}</p>
        <p><strong>Endereco:</strong> ${escapeHtml(enderecoText)}</p>
        ${pedido.observacao ? `<p><strong>Observacao:</strong> ${escapeHtml(pedido.observacao)}</p>` : ''}
        ${pedido.motivoCancelamento ? `<p style="color:var(--perigo);"><strong>Motivo cancelamento:</strong> ${escapeHtml(pedido.motivoCancelamento)}</p>` : ''}
        ${pedido.pagamento ? `<p><strong>Pagamento:</strong> ${statusLabel(pedido.pagamento.status)} (${pedido.pagamento.metodo || 'N/A'})</p>` : ''}
      </div>
    `;

    openModal('Detalhes do Pedido', bodyHtml, `<button class="btn btn-outline" onclick="closeModal()">Fechar</button>`);
  } catch (err) {
    toast(err.message, 'error');
  }
};

// ===========================================
// COMERCIANTE - AVALIACOES
// ===========================================
async function loadAvaliacoes() {
  const area = $('#content-area');
  try {
    const perfil = await api('/auth/perfil');
    lojas = perfil.comercios || [];

    if (lojas.length === 0) {
      area.innerHTML = '<div class="empty-state"><div class="empty-icon">&#x2B50;</div><h4>Nenhuma loja cadastrada</h4><p>Cadastre uma loja para receber avaliacoes</p></div>';
      return;
    }

    area.innerHTML = '<div class="loading"><div class="spinner"></div><p>Carregando avaliacoes...</p></div>';

    let html = '';
    for (const loja of lojas) {
      try {
        const data = await api(`/avaliacoes/${loja.slug}`, { auth: false });
        if (data.avaliacoes.length === 0) continue;

        html += `
          <div class="card">
            <div class="card-header">
              <h4>${loja.emoji} ${escapeHtml(loja.nome)}</h4>
              <span>${stars(Math.round(data.media))} ${data.media} (${data.total})</span>
            </div>
            <div class="card-body">
              ${data.avaliacoes.map(a => `
                <div style="border-bottom:1px solid var(--cinza-100); padding:12px 0;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <strong>${escapeHtml(a.usuario)}</strong>
                      <span style="color:var(--amarelo); margin-left:8px;">${stars(a.nota)}</span>
                    </div>
                    <span style="font-size:0.8rem; color:var(--cinza-texto);">${formatDate(a.createdAt)}</span>
                  </div>
                  ${a.comentario ? `<p style="font-size:0.9rem; color:var(--cinza-texto); margin-top:4px;">${escapeHtml(a.comentario)}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } catch (e) {
        // Ignorar erro de uma loja especifica
      }
    }

    area.innerHTML = html || '<div class="empty-state"><div class="empty-icon">&#x2B50;</div><h4>Nenhuma avaliacao ainda</h4><p>Quando clientes avaliarem suas lojas, os comentarios aparecerao aqui</p></div>';
  } catch (err) {
    area.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

// ===========================================
// COMERCIANTE - ESTATISTICAS
// ===========================================
async function loadEstatisticas() {
  const area = $('#content-area');
  try {
    const perfil = await api('/auth/perfil');
    lojas = perfil.comercios || [];

    const lojaOptions = lojas.map(l =>
      `<option value="${l.slug}">${l.emoji} ${l.nome}</option>`
    ).join('');

    area.innerHTML = `
      <div class="card">
        <div class="card-header"><h4>Selecione uma loja</h4></div>
        <div class="card-body">
          <div class="form-group">
            <select id="stats-loja-select">
              <option value="">-- Selecione --</option>
              ${lojaOptions}
            </select>
          </div>
        </div>
      </div>
      <div id="stats-container" style="display:none">
        <div class="stats-grid" id="stats-cards"></div>
        <div class="card">
          <div class="card-header"><h4>Detalhes por Dia</h4></div>
          <div class="card-body table-responsive" id="stats-por-dia"></div>
        </div>
      </div>
    `;

    $('#stats-loja-select').addEventListener('change', async (e) => {
      const slug = e.target.value;
      if (!slug) { $('#stats-container').style.display = 'none'; return; }

      try {
        const data = await api(`/estatisticas/${slug}`);
        $('#stats-container').style.display = 'block';

        $('#stats-cards').innerHTML = `
          <div class="stat-card">
            <div class="stat-icon">&#x1F441;</div>
            <div class="stat-value">${data.resumo.visitas}</div>
            <div class="stat-label">Visitas</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">&#x1F4F1;</div>
            <div class="stat-value">${data.resumo.whatsapp_clicks}</div>
            <div class="stat-label">Cliques WhatsApp</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">&#x260E;</div>
            <div class="stat-value">${data.resumo.telefone_clicks}</div>
            <div class="stat-label">Cliques Telefone</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">&#x1F517;</div>
            <div class="stat-value">${data.resumo.compartilhamentos}</div>
            <div class="stat-label">Compartilhamentos</div>
          </div>
        `;

        const dias = Object.entries(data.porDia).sort((a, b) => b[0].localeCompare(a[0]));
        if (dias.length === 0) {
          $('#stats-por-dia').innerHTML = '<p style="color:var(--cinza-texto);">Nenhum dado no periodo</p>';
        } else {
          $('#stats-por-dia').innerHTML = `<table>
            <thead><tr><th>Data</th><th>Visitas</th><th>WhatsApp</th><th>Telefone</th></tr></thead>
            <tbody>${dias.map(([dia, d]) => `<tr>
              <td>${new Date(dia).toLocaleDateString('pt-BR')}</td>
              <td>${d.visitas}</td>
              <td>${d.whatsapp}</td>
              <td>${d.telefone}</td>
            </tr>`).join('')}</tbody></table>`;
        }
      } catch (err) {
        toast(err.message, 'error');
        $('#stats-container').style.display = 'none';
      }
    });
  } catch (err) {
    area.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

// ===========================================
// CLIENTE - VISAO GERAL
// ===========================================
async function loadVisaoGeralCliente() {
  const area = $('#content-area');
  try {
    const perfil = await api('/auth/perfil');
    const pedidos = perfil.pedidos || [];
    const enderecos = perfil.enderecos || [];

    const totalPedidos = pedidos.length;
    const pedidosPendentes = pedidos.filter(p => !['entregue', 'cancelado'].includes(p.status)).length;
    const totalEntregues = pedidos.filter(p => p.status === 'entregue').length;

    area.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">&#x1F4CB;</div>
          <div class="stat-value">${totalPedidos}</div>
          <div class="stat-label">Total de Pedidos</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">&#x23F3;</div>
          <div class="stat-value">${pedidosPendentes}</div>
          <div class="stat-label">Em Andamento</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">&#x2705;</div>
          <div class="stat-value">${totalEntregues}</div>
          <div class="stat-label">Entregues</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">&#x1F4CD;</div>
          <div class="stat-value">${enderecos.length}</div>
          <div class="stat-label">Enderecos Salvos</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h4>Pedidos Recentes</h4>
          <button class="btn btn-sm btn-outline" onclick="Painel.irParaPedidos()">Ver Todos</button>
        </div>
        <div class="card-body">
          ${pedidos.length === 0
            ? '<div class="empty-state"><div class="empty-icon">&#x1F6D2;</div><h4>Nenhum pedido ainda</h4><p>Quando voce fizer pedidos, eles aparecerao aqui</p></div>'
            : pedidos.slice(0, 5).map(p => `
              <div class="order-card" style="cursor:pointer" onclick="Painel.verPedido('${p.codigo}')">
                <div class="order-header">
                  <div>
                    <span class="order-code">${p.codigo}</span>
                    <span style="color:var(--cinza-texto); font-size:0.85rem; margin-left:8px;">${p.comercio.emoji} ${escapeHtml(p.comercio.nome)}</span>
                  </div>
                  <span class="badge badge-${p.status}">${statusLabel(p.status)}</span>
                </div>
                <div class="order-footer">
                  <span class="order-total">${formatMoney(p.total)}</span>
                  <span class="order-date">${formatDateTime(p.createdAt)}</span>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  } catch (err) {
    area.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

Painel.irParaPedidos = function() {
  const navItems = $$('#sidebar-nav .nav-item');
  navItems.forEach(n => n.classList.remove('active'));
  const pedidosBtn = Array.from(navItems).find(n => n.dataset.section === 'meus-pedidos');
  if (pedidosBtn) pedidosBtn.classList.add('active');
  navigateTo('meus-pedidos');
};

// ===========================================
// CLIENTE - MEUS PEDIDOS
// ===========================================
async function loadMeusPedidos() {
  const area = $('#content-area');
  try {
    area.innerHTML = `
      <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">
        <button class="btn btn-sm btn-primary pedido-filter active" data-status="">Todos</button>
        <button class="btn btn-sm btn-outline pedido-filter" data-status="pendente">Pendentes</button>
        <button class="btn btn-sm btn-outline pedido-filter" data-status="confirmado">Confirmados</button>
        <button class="btn btn-sm btn-outline pedido-filter" data-status="preparando">Preparando</button>
        <button class="btn btn-sm btn-outline pedido-filter" data-status="saiu_entrega">Em Entrega</button>
        <button class="btn btn-sm btn-outline pedido-filter" data-status="entregue">Entregues</button>
        <button class="btn btn-sm btn-outline pedido-filter" data-status="cancelado">Cancelados</button>
      </div>
      <div id="meus-pedidos-list"><div class="loading"><div class="spinner"></div></div></div>
      <div id="meus-pedidos-paginacao" style="display:flex; gap:8px; justify-content:center; margin-top:16px;"></div>
    `;

    let filtroStatus = '';
    let paginaAtual = 1;

    async function carregarPedidos() {
      const container = $('#meus-pedidos-list');
      container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

      const query = `?limit=10&page=${paginaAtual}${filtroStatus ? '&status=' + filtroStatus : ''}`;
      const data = await api('/pedidos' + query);

      if (data.pedidos.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#x1F6D2;</div><h4>Nenhum pedido encontrado</h4></div>';
        $('#meus-pedidos-paginacao').innerHTML = '';
        return;
      }

      container.innerHTML = data.pedidos.map(p => renderOrderCard(p, 'cliente')).join('');

      const pag = data.paginacao;
      let pagHtml = '';
      if (pag.totalPaginas > 1) {
        for (let i = 1; i <= pag.totalPaginas; i++) {
          pagHtml += `<button class="btn btn-sm ${i === pag.pagina ? 'btn-primary' : 'btn-outline'}" onclick="Painel.meusPedidosPagina(${i})">${i}</button>`;
        }
      }
      $('#meus-pedidos-paginacao').innerHTML = pagHtml;
    }

    area.querySelectorAll('.pedido-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        area.querySelectorAll('.pedido-filter').forEach(b => {
          b.classList.remove('active', 'btn-primary');
          b.classList.add('btn-outline');
        });
        btn.classList.add('active', 'btn-primary');
        btn.classList.remove('btn-outline');
        filtroStatus = btn.dataset.status;
        paginaAtual = 1;
        carregarPedidos();
      });
    });

    Painel.meusPedidosPagina = function(page) {
      paginaAtual = page;
      carregarPedidos();
    };

    await carregarPedidos();
  } catch (err) {
    area.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

// ===========================================
// CLIENTE - MEUS ENDERECOS
// ===========================================
async function loadEnderecos() {
  const area = $('#content-area');
  try {
    const enderecos = await api('/auth/enderecos');

    area.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <p>${enderecos.length} endereco(s) cadastrado(s)</p>
        <button class="btn btn-primary" id="btn-novo-endereco">+ Novo Endereco</button>
      </div>
      <div id="enderecos-list"></div>
    `;

    const container = $('#enderecos-list');
    if (enderecos.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#x1F4CD;</div><h4>Nenhum endereco cadastrado</h4><p>Adicione enderecos para facilitar seus pedidos</p></div>';
    } else {
      container.innerHTML = enderecos.map(e => `
        <div class="card" style="margin-bottom:12px;">
          <div class="card-body" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <strong>${escapeHtml(e.apelido)}</strong>
                ${e.principal ? '<span class="badge badge-confirmado">Principal</span>' : ''}
              </div>
              <p style="font-size:0.9rem; color:var(--cinza-texto);">
                ${escapeHtml(e.rua)}, ${escapeHtml(e.numero)}${e.complemento ? ' - ' + escapeHtml(e.complemento) : ''}<br>
                ${escapeHtml(e.bairro)} - ${escapeHtml(e.cidade || 'Boa Esperanca do Sul')}/${escapeHtml(e.estado || 'SP')}<br>
                CEP: ${e.cep}
              </p>
            </div>
            <div style="display:flex; gap:8px; flex-shrink:0;">
              ${!e.principal ? `<button class="btn btn-sm btn-outline" onclick="Painel.definirPrincipal(${e.id})">Tornar Principal</button>` : ''}
              <button class="btn btn-sm btn-outline" onclick="Painel.editarEndereco(${e.id})">Editar</button>
              <button class="btn btn-sm btn-danger" onclick="Painel.excluirEndereco(${e.id})">X</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    $('#btn-novo-endereco').addEventListener('click', () => abrirModalEndereco());
  } catch (err) {
    area.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

function abrirModalEndereco(endData = null) {
  const isEdit = !!endData;
  const bodyHtml = `
    <form id="form-endereco">
      <div class="form-row">
        <div class="form-group">
          <label>Apelido</label>
          <input type="text" id="end-apelido" value="${escapeHtml(endData?.apelido || 'Casa')}" placeholder="Casa, Trabalho...">
        </div>
        <div class="form-group">
          <label>CEP *</label>
          <input type="text" id="end-cep" required value="${escapeHtml(endData?.cep || '')}" placeholder="14770-000" maxlength="9">
        </div>
      </div>
      <div class="form-group">
        <label>Rua *</label>
        <input type="text" id="end-rua" required value="${escapeHtml(endData?.rua || '')}" placeholder="Rua, Avenida...">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Numero *</label>
          <input type="text" id="end-numero" required value="${escapeHtml(endData?.numero || '')}" placeholder="123">
        </div>
        <div class="form-group">
          <label>Complemento</label>
          <input type="text" id="end-complemento" value="${escapeHtml(endData?.complemento || '')}" placeholder="Apto, Bloco...">
        </div>
      </div>
      <div class="form-group">
        <label>Bairro *</label>
        <input type="text" id="end-bairro" required value="${escapeHtml(endData?.bairro || '')}" placeholder="Bairro">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Cidade</label>
          <input type="text" id="end-cidade" value="${escapeHtml(endData?.cidade || 'Boa Esperanca do Sul')}">
        </div>
        <div class="form-group">
          <label>Estado</label>
          <input type="text" id="end-estado" value="${escapeHtml(endData?.estado || 'SP')}" maxlength="2">
        </div>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="end-principal" ${endData?.principal ? 'checked' : ''}>
          Endereco principal
        </label>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" id="btn-salvar-endereco">${isEdit ? 'Salvar' : 'Adicionar'}</button>
  `;

  openModal(isEdit ? 'Editar Endereco' : 'Novo Endereco', bodyHtml, footerHtml);

  $('#btn-salvar-endereco').addEventListener('click', async () => {
    const form = $('#form-endereco');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const body = {
      apelido: $('#end-apelido').value || 'Casa',
      cep: $('#end-cep').value,
      rua: $('#end-rua').value,
      numero: $('#end-numero').value,
      complemento: $('#end-complemento').value || null,
      bairro: $('#end-bairro').value,
      cidade: $('#end-cidade').value || 'Boa Esperanca do Sul',
      estado: $('#end-estado').value || 'SP',
      principal: $('#end-principal').checked
    };

    try {
      if (isEdit && endData.id) {
        await api(`/auth/enderecos/${endData.id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        toast('Endereco atualizado!');
      } else {
        await api('/auth/enderecos', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        toast('Endereco adicionado!');
      }
      closeModal();
      loadEnderecos();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

Painel.editarEndereco = async function(id) {
  try {
    const enderecos = await api('/auth/enderecos');
    const end = enderecos.find(e => e.id === id);
    if (end) abrirModalEndereco(end);
    else toast('Endereco nao encontrado', 'error');
  } catch (err) {
    toast(err.message, 'error');
  }
};

Painel.definirPrincipal = async function(id) {
  try {
    await api(`/auth/enderecos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ principal: true })
    });
    toast('Endereco principal atualizado!');
    loadEnderecos();
  } catch (err) {
    toast(err.message, 'error');
  }
};

Painel.excluirEndereco = async function(id) {
  if (!confirm('Excluir este endereco?')) return;
  try {
    await api(`/auth/enderecos/${id}`, { method: 'DELETE' });
    toast('Endereco excluido!');
    loadEnderecos();
  } catch (err) {
    toast(err.message, 'error');
  }
};

// ===========================================
// MEU PERFIL (ambos os tipos)
// ===========================================
async function loadPerfil() {
  const area = $('#content-area');
  try {
    const perfil = await api('/auth/perfil');

    let camposEspecificos = '';
    if (perfil.tipo === 'comerciante' || perfil.tipo === 'admin') {
      camposEspecificos = `
        <div class="form-divider"><span>Dados do Negocio</span></div>
        <div class="form-group">
          <label>Nome Fantasia</label>
          <input type="text" id="perfil-nome-fantasia" value="${escapeHtml(perfil.nomeFantasia || '')}">
        </div>
        <div class="form-group">
          <label>CPF/CNPJ</label>
          <input type="text" id="perfil-cpf-cnpj" value="${escapeHtml(perfil.cpfCnpj || '')}" placeholder="Somente numeros">
        </div>
        <div class="form-group">
          <label>Endereco Comercial</label>
          <input type="text" id="perfil-endereco-comercial" value="${escapeHtml(perfil.enderecoComercial || '')}">
        </div>
        <div class="form-group">
          <label>WhatsApp Comercial</label>
          <input type="tel" id="perfil-telefone-comercial" value="${escapeHtml(perfil.telefoneComercial || '')}">
        </div>
      `;
    } else {
      camposEspecificos = `
        <div class="form-group">
          <label>CPF</label>
          <input type="text" id="perfil-cpf" value="${escapeHtml(perfil.cpf || '')}" placeholder="000.000.000-00" maxlength="14">
        </div>
      `;
    }

    area.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h4>Informacoes Pessoais</h4>
          <span class="badge badge-${perfil.tipo}">${perfil.tipo}</span>
        </div>
        <div class="card-body">
          <form id="form-perfil">
            <div class="form-group">
              <label>Nome *</label>
              <input type="text" id="perfil-nome" required value="${escapeHtml(perfil.nome)}">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="perfil-email" value="${escapeHtml(perfil.email)}" disabled>
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input type="tel" id="perfil-telefone" value="${escapeHtml(perfil.telefone || '')}" placeholder="(16) 99999-9999">
            </div>
            ${camposEspecificos}
            <button type="submit" class="btn btn-primary">Salvar Alteracoes</button>
          </form>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <div class="card-header"><h4>Alterar Senha</h4></div>
        <div class="card-body">
          <form id="form-senha">
            <div class="form-group">
              <label>Senha Atual *</label>
              <input type="password" id="perfil-senha-atual" required minlength="6">
            </div>
            <div class="form-group">
              <label>Nova Senha *</label>
              <input type="password" id="perfil-nova-senha" required minlength="6" placeholder="Minimo 6 caracteres">
            </div>
            <button type="submit" class="btn btn-primary">Alterar Senha</button>
          </form>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <div class="card-body" style="text-align:center; padding:16px;">
          <p style="font-size:0.85rem; color:var(--cinza-texto);">
            Conta criada em ${formatDate(perfil.createdAt)} &bull; ID: ${perfil.id}
          </p>
        </div>
      </div>
    `;

    // Salvar perfil
    $('#form-perfil').addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        nome: $('#perfil-nome').value,
        telefone: $('#perfil-telefone').value || null
      };

      if (perfil.tipo === 'comerciante' || perfil.tipo === 'admin') {
        body.nomeFantasia = $('#perfil-nome-fantasia').value || null;
        body.cpfCnpj = $('#perfil-cpf-cnpj').value || null;
        body.enderecoComercial = $('#perfil-endereco-comercial').value || null;
        body.telefoneComercial = $('#perfil-telefone-comercial').value || null;
      } else {
        body.cpf = $('#perfil-cpf').value || null;
      }

      try {
        const data = await api('/auth/perfil', {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        user.nome = data.user.nome;
        if (data.user.nomeFantasia) user.nomeFantasia = data.user.nomeFantasia;
        localStorage.setItem('bes_painel_user', JSON.stringify(user));
        $('#sidebar-user-name').textContent = user.nome;
        $('#topbar-nome').textContent = user.nomeFantasia || user.nome;
        toast('Perfil atualizado!');
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    // Alterar senha
    $('#form-senha').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api('/auth/perfil', {
          method: 'PUT',
          body: JSON.stringify({
            senhaAtual: $('#perfil-senha-atual').value,
            novaSenha: $('#perfil-nova-senha').value
          })
        });
        toast('Senha alterada com sucesso!');
        $('#form-senha').reset();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  } catch (err) {
    area.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

// ===========================================
// INIT
// ===========================================
checkAuth();
