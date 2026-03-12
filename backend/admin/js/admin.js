// ===========================================
// Painel Admin - Comercio BES
// ===========================================
const API_URL = window.location.origin + '/api';

// --- Estado ---
let token = localStorage.getItem('bes_admin_token');
let user = JSON.parse(localStorage.getItem('bes_admin_user') || 'null');
let lojas = [];
let categorias = [];
let lojaAtualSlug = null; // para produtos/promo

// --- Helpers ---
function headers(includeAuth = true) {
  const h = { 'Content-Type': 'application/json' };
  if (includeAuth && token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function api(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: headers(options.auth !== false),
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisicao');
  return data;
}

function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

function toast(msg, type = 'success') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = `toast toast-${type}`;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function stars(nota) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += i <= nota ? '\u2605' : '\u2606';
  }
  return s;
}

// --- Auth ---
function checkAuth() {
  if (token && user) {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  $('#login-page').classList.add('active');
  $('#dashboard-page').classList.remove('active');
}

function showDashboard() {
  $('#login-page').classList.remove('active');
  $('#dashboard-page').classList.add('active');
  $('#user-name').textContent = user.nome;
  $('#user-badge').textContent = user.tipo;
  loadDashboard();
}

function logout() {
  token = null;
  user = null;
  localStorage.removeItem('bes_admin_token');
  localStorage.removeItem('bes_admin_user');
  showLogin();
}

// Login form
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#login-email').value;
  const senha = $('#login-senha').value;
  const errEl = $('#login-error');

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
      auth: false
    });

    token = data.token;
    user = data.user;
    localStorage.setItem('bes_admin_token', token);
    localStorage.setItem('bes_admin_user', JSON.stringify(user));
    errEl.style.display = 'none';
    showDashboard();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  }
});

// Registro form
$('#registro-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#login-error');

  try {
    const data = await api('/auth/registro', {
      method: 'POST',
      body: JSON.stringify({
        nome: $('#reg-nome').value,
        email: $('#reg-email').value,
        senha: $('#reg-senha').value,
        telefone: $('#reg-telefone').value || null,
        tipo: 'comerciante'
      }),
      auth: false
    });

    token = data.token;
    user = data.user;
    localStorage.setItem('bes_admin_token', token);
    localStorage.setItem('bes_admin_user', JSON.stringify(user));
    errEl.style.display = 'none';
    showDashboard();
    toast('Conta criada com sucesso!');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  }
});

// Toggle login/registro
$('#show-registro').addEventListener('click', (e) => {
  e.preventDefault();
  $('#login-form').style.display = 'none';
  $('#registro-form').style.display = 'block';
  $('#login-error').style.display = 'none';
});

$('#show-login').addEventListener('click', (e) => {
  e.preventDefault();
  $('#registro-form').style.display = 'none';
  $('#login-form').style.display = 'block';
  $('#login-error').style.display = 'none';
});

$('#btn-logout').addEventListener('click', logout);

// --- Navegacao ---
$$('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    $$('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    $$('.section').forEach(s => s.classList.remove('active'));
    $(`#section-${section}`).classList.add('active');

    // Carregar dados da secao
    if (section === 'avaliacoes') loadAvaliacoes();
    if (section === 'perfil') loadPerfil();

    // Fechar sidebar mobile
    $('#sidebar').classList.remove('open');
  });
});

// Menu toggle mobile
$('#menu-toggle').addEventListener('click', () => {
  $('#sidebar').classList.toggle('open');
});

// --- Dashboard ---
async function loadDashboard() {
  try {
    // Carregar categorias
    categorias = await api('/categorias', { auth: false });

    // Carregar lojas
    const data = await api('/comercios?limit=100', { auth: false });
    
    // Filtrar lojas do usuario (ou todas se admin)
    if (user.tipo === 'admin') {
      lojas = data.comercios;
    } else {
      lojas = data.comercios.filter(l => l.ownerId === user.id);
      // Se nao tiver ownerId visivel, carregar todas e assumir que sao do usuario
      // (o backend filtra por permissao)
      if (lojas.length === 0) {
        lojas = data.comercios;
      }
    }

    // Stats
    let totalProdutos = 0;
    let totalAvaliacoes = 0;
    let totalVisitas = 0;
    lojas.forEach(l => {
      totalProdutos += l.catalogo?.length || 0;
      totalAvaliacoes += l.totalAvaliacoes || 0;
      totalVisitas += l.visitas || 0;
    });

    $('#stat-lojas').textContent = lojas.length;
    $('#stat-produtos').textContent = totalProdutos;
    $('#stat-avaliacoes').textContent = totalAvaliacoes;
    $('#stat-visitas').textContent = totalVisitas.toLocaleString('pt-BR');

    // Lojas recentes (overview)
    renderLojasRecentes();

    // Lojas lista
    renderLojas();

    // Preencher selects de loja
    populateLojaSelects();

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
    if (err.message.includes('Token')) logout();
  }
}

function renderLojasRecentes() {
  const container = $('#lojas-recentes');
  if (lojas.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#x1F3EA;</div><p>Nenhuma loja cadastrada ainda</p></div>';
    return;
  }

  const recentes = lojas.slice(0, 5);
  container.innerHTML = `<table><thead><tr>
    <th>Loja</th><th>Categoria</th><th>Rating</th><th>Visitas</th><th>Status</th>
  </tr></thead><tbody>${recentes.map(l => `<tr>
    <td><strong>${l.emoji} ${l.nome}</strong></td>
    <td>${l.categoria}</td>
    <td>${stars(Math.round(l.rating))} ${l.rating}</td>
    <td>${l.visitas.toLocaleString('pt-BR')}</td>
    <td><span class="loja-card-status ${l.aberto ? 'status-aberto' : 'status-fechado'}">${l.aberto ? 'Aberto' : 'Fechado'}</span></td>
  </tr>`).join('')}</tbody></table>`;
}

function renderLojas() {
  const container = $('#lojas-lista');
  if (lojas.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#x1F3EA;</div><p>Crie sua primeira loja!</p></div>';
    return;
  }

  container.innerHTML = lojas.map(l => `
    <div class="loja-card">
      <div class="loja-card-header">
        <div class="loja-card-emoji">${l.emoji}</div>
        <div class="loja-card-info">
          <h4>${l.nome}</h4>
          <span class="loja-categoria">${l.categoria}</span>
        </div>
        <span class="loja-card-status ${l.aberto ? 'status-aberto' : 'status-fechado'}">${l.aberto ? 'Aberto' : 'Fechado'}</span>
      </div>
      <div class="loja-card-stats">
        <span>${stars(Math.round(l.rating))} ${l.rating}</span>
        <span>${l.visitas.toLocaleString('pt-BR')} visitas</span>
        <span>${l.catalogo?.length || 0} produtos</span>
      </div>
      <div class="loja-card-actions">
        <button class="btn btn-primary btn-sm" onclick="editarLoja('${l.slug}')">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="excluirLoja('${l.slug}')">Excluir</button>
      </div>
    </div>
  `).join('');
}

function populateLojaSelects() {
  const prodSelect = $('#produto-loja-select');
  const statsSelect = $('#stats-loja-select');

  const options = '<option value="">-- Selecione uma loja --</option>' +
    lojas.map(l => `<option value="${l.slug}">${l.emoji} ${l.nome}</option>`).join('');

  prodSelect.innerHTML = options;
  statsSelect.innerHTML = options;
}

// --- Lojas CRUD ---
$('#btn-nova-loja').addEventListener('click', () => {
  $('#modal-loja-titulo').textContent = 'Nova Loja';
  $('#form-loja').reset();
  $('#loja-slug-edit').value = '';
  populateCategoriaSelect();
  $('#modal-loja').style.display = 'flex';
});

$('#modal-loja-close').addEventListener('click', () => {
  $('#modal-loja').style.display = 'none';
});

$('#btn-cancelar-loja').addEventListener('click', () => {
  $('#modal-loja').style.display = 'none';
});

function populateCategoriaSelect(selectedId) {
  const select = $('#loja-categoria');
  select.innerHTML = categorias.map(c =>
    `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.emoji} ${c.nome}</option>`
  ).join('');
}

window.editarLoja = async function(slug) {
  const loja = lojas.find(l => l.slug === slug);
  if (!loja) return;

  // Buscar dados completos
  try {
    const full = await api(`/comercios/${slug}`, { auth: false });
    
    $('#modal-loja-titulo').textContent = 'Editar Loja';
    $('#loja-slug-edit').value = slug;
    $('#loja-nome').value = full.nome;
    populateCategoriaSelect(categorias.find(c => c.slug === full.categoriaSlug)?.id);
    $('#loja-whatsapp').value = full.whatsapp;
    $('#loja-tel').value = full.tel || '';
    $('#loja-endereco').value = full.endereco;
    $('#loja-lat').value = full.lat;
    $('#loja-lng').value = full.lng;
    $('#loja-horario').value = full.horario;
    $('#loja-emoji').value = full.emoji;
    $('#loja-aberto').value = full.aberto.toString();
    $('#loja-tags').value = (full.tags || []).join(', ');
    $('#loja-descricao').value = full.descricao || '';

    $('#modal-loja').style.display = 'flex';
  } catch (err) {
    toast(err.message, 'error');
  }
};

$('#form-loja').addEventListener('submit', async (e) => {
  e.preventDefault();
  const slugEdit = $('#loja-slug-edit').value;
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
    if (slugEdit) {
      await api(`/comercios/${slugEdit}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      toast('Loja atualizada com sucesso!');
    } else {
      await api('/comercios', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      toast('Loja criada com sucesso!');
    }

    $('#modal-loja').style.display = 'none';
    loadDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
});

window.excluirLoja = async function(slug) {
  if (!confirm('Tem certeza que deseja excluir esta loja? Esta acao nao pode ser desfeita.')) return;

  try {
    await api(`/comercios/${slug}`, { method: 'DELETE' });
    toast('Loja excluida!');
    loadDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
};

// --- Produtos ---
$('#produto-loja-select').addEventListener('change', async (e) => {
  const slug = e.target.value;
  if (!slug) {
    $('#produtos-container').style.display = 'none';
    return;
  }

  lojaAtualSlug = slug;
  await loadProdutos(slug);
});

async function loadProdutos(slug) {
  try {
    const loja = await api(`/comercios/${slug}`, { auth: false });
    
    $('#produtos-loja-nome').textContent = `${loja.emoji} ${loja.nome}`;
    $('#produtos-container').style.display = 'block';

    // Tabela de produtos
    const container = $('#produtos-lista');
    if (!loja.catalogo || loja.catalogo.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Nenhum produto no catalogo</p></div>';
    } else {
      container.innerHTML = `<table>
        <thead><tr><th>Produto</th><th>Descricao</th><th>Preco</th><th>Status</th><th>Acoes</th></tr></thead>
        <tbody>${loja.catalogo.map(p => `<tr>
          <td><strong>${p.nome_produto}</strong></td>
          <td class="text-muted">${p.descricao || '-'}</td>
          <td>R$ ${p.preco.toFixed(2)}</td>
          <td><span class="loja-card-status ${p.disponivel ? 'status-aberto' : 'status-fechado'}">${p.disponivel ? 'Ativo' : 'Inativo'}</span></td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="editarProduto(${p.id}, '${p.nome_produto.replace(/'/g, "\\'")}', '${(p.descricao || '').replace(/'/g, "\\'")}', ${p.preco}, ${p.disponivel})">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="excluirProduto(${p.id})">X</button>
          </td>
        </tr>`).join('')}</tbody></table>`;
    }

    // Preencher promo
    if (loja.promo) {
      $('#promo-desc').value = loja.promo.desc;
      $('#promo-preco').value = loja.promo.preco;
      $('#promo-original').value = loja.promo.original;
    } else {
      $('#form-promo').reset();
    }

  } catch (err) {
    toast(err.message, 'error');
  }
}

// Novo Produto
$('#btn-novo-produto').addEventListener('click', () => {
  $('#modal-produto-titulo').textContent = 'Novo Produto';
  $('#form-produto').reset();
  $('#produto-id-edit').value = '';
  $('#modal-produto').style.display = 'flex';
});

$('#modal-produto-close').addEventListener('click', () => {
  $('#modal-produto').style.display = 'none';
});

$('#btn-cancelar-produto').addEventListener('click', () => {
  $('#modal-produto').style.display = 'none';
});

window.editarProduto = function(id, nome, descricao, preco, disponivel) {
  $('#modal-produto-titulo').textContent = 'Editar Produto';
  $('#produto-id-edit').value = id;
  $('#produto-nome').value = nome;
  $('#produto-descricao').value = descricao;
  $('#produto-preco').value = preco;
  $('#produto-disponivel').value = disponivel.toString();
  $('#modal-produto').style.display = 'flex';
};

$('#form-produto').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!lojaAtualSlug) return;

  const id = $('#produto-id-edit').value;
  const body = {
    nome: $('#produto-nome').value,
    descricao: $('#produto-descricao').value || '',
    preco: parseFloat($('#produto-preco').value),
    disponivel: $('#produto-disponivel').value === 'true'
  };

  try {
    if (id) {
      await api(`/comercios/${lojaAtualSlug}/produtos/${id}`, {
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

    $('#modal-produto').style.display = 'none';
    loadProdutos(lojaAtualSlug);
  } catch (err) {
    toast(err.message, 'error');
  }
});

window.excluirProduto = async function(id) {
  if (!confirm('Excluir este produto?')) return;
  try {
    await api(`/comercios/${lojaAtualSlug}/produtos/${id}`, { method: 'DELETE' });
    toast('Produto excluido!');
    loadProdutos(lojaAtualSlug);
  } catch (err) {
    toast(err.message, 'error');
  }
};

// Promo
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

// --- Avaliacoes ---
async function loadAvaliacoes() {
  const container = $('#avaliacoes-lista');
  container.innerHTML = '<p class="text-muted">Carregando...</p>';

  try {
    let html = '';
    for (const loja of lojas) {
      const data = await api(`/avaliacoes/${loja.slug}`, { auth: false });
      if (data.avaliacoes.length === 0) continue;

      html += `<div class="card mt-20">
        <h3>${loja.emoji} ${loja.nome} - Media: ${data.media} ${stars(Math.round(data.media))} (${data.total} avaliacoes)</h3>
        ${data.avaliacoes.map(a => `
          <div class="avaliacao-card">
            <div class="avaliacao-header">
              <div>
                <span class="avaliacao-user">${a.usuario}</span>
                <span class="avaliacao-stars">${stars(a.nota)}</span>
              </div>
              <span class="avaliacao-date">${formatDate(a.createdAt)}</span>
            </div>
            ${a.comentario ? `<p class="avaliacao-comment">${a.comentario}</p>` : ''}
          </div>
        `).join('')}
      </div>`;
    }

    container.innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">&#x2B50;</div><p>Nenhuma avaliacao ainda</p></div>';
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

// --- Estatisticas ---
$('#stats-loja-select').addEventListener('change', async (e) => {
  const slug = e.target.value;
  if (!slug) {
    $('#stats-container').style.display = 'none';
    return;
  }

  try {
    const data = await api(`/estatisticas/${slug}`);
    
    $('#stats-container').style.display = 'block';
    $('#stats-visitas').textContent = data.resumo.visitas;
    $('#stats-whatsapp').textContent = data.resumo.whatsapp_clicks;
    $('#stats-telefone').textContent = data.resumo.telefone_clicks;
    $('#stats-compartilhamento').textContent = data.resumo.compartilhamentos;

    // Tabela por dia
    const dias = Object.entries(data.porDia).sort((a, b) => b[0].localeCompare(a[0]));
    const container = $('#stats-por-dia');

    if (dias.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum dado no periodo</p>';
    } else {
      container.innerHTML = `<table>
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

// --- Perfil ---
async function loadPerfil() {
  try {
    const perfil = await api('/auth/perfil');
    $('#perfil-nome').value = perfil.nome;
    $('#perfil-email').value = perfil.email;
    $('#perfil-telefone').value = perfil.telefone || '';
  } catch (err) {
    toast(err.message, 'error');
  }
}

$('#form-perfil').addEventListener('submit', async (e) => {
  e.preventDefault();

  const body = {
    nome: $('#perfil-nome').value,
    telefone: $('#perfil-telefone').value || null
  };

  const senhaAtual = $('#perfil-senha-atual').value;
  const novaSenha = $('#perfil-nova-senha').value;

  if (novaSenha) {
    body.senhaAtual = senhaAtual;
    body.novaSenha = novaSenha;
  }

  try {
    const data = await api('/auth/perfil', {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    user.nome = data.user.nome;
    localStorage.setItem('bes_admin_user', JSON.stringify(user));
    $('#user-name').textContent = user.nome;
    $('#perfil-senha-atual').value = '';
    $('#perfil-nova-senha').value = '';
    toast('Perfil atualizado!');
  } catch (err) {
    toast(err.message, 'error');
  }
});

// --- Init ---
checkAuth();
