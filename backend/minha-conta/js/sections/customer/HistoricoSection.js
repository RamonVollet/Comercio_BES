// =====================================================
// HistoricoSection.js — Histórico de pedidos (cliente)
// =====================================================

let _cleanup = [];
let _currentPage = 1;

export function mount(container, ctx) {
    _cleanup = [];
    _currentPage = 1;

    container.innerHTML = `
    <section class="historico-section">
      <div class="section-header">
        <h2 class="section-title">🛍️ Meus Pedidos</h2>
        <p class="section-subtitle">Acompanhe seus pedidos e histórico de compras</p>
      </div>

      <div class="filters-bar">
        <label for="filtro-status" class="sr-only">Filtrar por status</label>
        <select id="filtro-status" class="filter-select">
          <option value="">Todos os status</option>
          <option value="pendente">⏳ Pendente</option>
          <option value="confirmado">✅ Confirmado</option>
          <option value="preparando">👨‍🍳 Preparando</option>
          <option value="saiu_entrega">🚚 Saiu para entrega</option>
          <option value="entregue">✔️ Entregue</option>
          <option value="cancelado">❌ Cancelado</option>
        </select>
      </div>

      <div id="pedidos-list" class="pedidos-list">
        <div class="content-loading"><div class="spinner"></div></div>
      </div>

      <div id="paginacao" class="paginacao hidden"></div>
    </section>

    <style>
      .historico-section { max-width: 760px; }
      .section-header { margin-bottom: 20px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }
      .filters-bar { margin-bottom: 16px; }
      .filter-select { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 12px; font-size: .875rem; background: var(--surface); font-family: var(--font-body); cursor: pointer; }
      .pedidos-list { display: flex; flex-direction: column; gap: 12px; }

      .pedido-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; transition: box-shadow .15s; }
      .pedido-card:hover { box-shadow: var(--shadow-md); }
      .pedido-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 8px; }
      .pedido-codigo { font-family: var(--font-display); font-weight: 700; font-size: .95rem; }
      .pedido-comercio { font-size: .82rem; color: var(--text-muted); }
      .pedido-status { font-size: .75rem; font-weight: 600; padding: 4px 10px; border-radius: 999px; }
      .status-pendente      { background: #FEF3C7; color: #92400E; }
      .status-confirmado    { background: #DBEAFE; color: #1E40AF; }
      .status-preparando    { background: #EDE9FE; color: #5B21B6; }
      .status-saiu_entrega  { background: #CFFAFE; color: #0E7490; }
      .status-entregue      { background: var(--accent-bg); color: var(--accent); }
      .status-cancelado     { background: #FEE2E2; color: var(--danger); }

      .pedido-body { padding: 14px 16px; }
      .pedido-itens { font-size: .85rem; color: var(--text-muted); margin-bottom: 10px; }
      .pedido-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
      .pedido-total { font-weight: 700; font-size: 1rem; color: var(--text); }
      .pedido-data  { font-size: .78rem; color: var(--text-muted); }
      .btn-cancelar { font-size: .78rem; color: var(--danger); background: none; border: 1px solid #fecaca; border-radius: var(--radius-sm); padding: 4px 10px; cursor: pointer; transition: background .15s; }
      .btn-cancelar:hover { background: #fef2f2; }

      .paginacao { display: flex; gap: 8px; justify-content: center; margin-top: 20px; }
      .paginacao.hidden { display: none; }
      .btn-pag { border: 1px solid var(--border); background: var(--surface); border-radius: var(--radius-sm); padding: 6px 14px; font-size: .875rem; cursor: pointer; transition: border-color .15s; }
      .btn-pag:hover { border-color: var(--accent); color: var(--accent); }
      .btn-pag.active { background: var(--accent); color: #fff; border-color: var(--accent); }
      .btn-pag:disabled { opacity: .4; cursor: not-allowed; }
    </style>
  `;

    carregarPedidos(container, ctx, 1);

    const filtro = container.querySelector('#filtro-status');
    const onFiltro = () => carregarPedidos(container, ctx, 1);
    filtro.addEventListener('change', onFiltro);
    _cleanup.push(() => filtro.removeEventListener('change', onFiltro));
}

async function carregarPedidos(container, ctx, page) {
    _currentPage = page;
    const listaEl = container.querySelector('#pedidos-list');
    const pagEl = container.querySelector('#paginacao');
    const status = container.querySelector('#filtro-status').value;

    listaEl.innerHTML = '<div class="content-loading"><div class="spinner"></div></div>';
    pagEl.classList.add('hidden');

    try {
        const params = new URLSearchParams({ page, limit: 8 });
        if (status) params.set('status', status);

        const res = await fetch(`/api/pedidos?${params}`, { credentials: 'include' });
        if (!res.ok) throw new Error(res.status);

        const { pedidos, paginacao } = await res.json();

        if (!pedidos.length) {
            listaEl.innerHTML = `
        <div class="section-empty">
          <h2>Nenhum pedido encontrado</h2>
          <p>${status ? 'Tente remover o filtro de status.' : 'Você ainda não fez nenhum pedido.'}</p>
        </div>`;
            return;
        }

        listaEl.innerHTML = pedidos.map(p => renderPedidoCard(p)).join('');

        // Paginação
        if (paginacao.totalPaginas > 1) {
            pagEl.classList.remove('hidden');
            pagEl.innerHTML = renderPaginacao(paginacao);
            pagEl.querySelectorAll('.btn-pag[data-page]').forEach(btn => {
                btn.addEventListener('click', () => carregarPedidos(container, ctx, Number(btn.dataset.page)));
            });
        }

        // Botões cancelar
        listaEl.querySelectorAll('.btn-cancelar[data-codigo]').forEach(btn => {
            btn.addEventListener('click', () => cancelarPedido(btn.dataset.codigo, container, ctx));
        });

    } catch {
        listaEl.innerHTML = '<div class="section-error"><h2>Erro ao carregar pedidos</h2><p>Verifique sua conexão e tente novamente.</p></div>';
    }
}

function renderPedidoCard(p) {
    const itensTxt = p.itens.map(i => `${i.quantidade}x ${i.nome}`).join(', ');
    const data = new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    const total = p.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const statusLabel = {
        pendente: '⏳ Pendente', confirmado: '✅ Confirmado',
        preparando: '👨‍🍳 Preparando', saiu_entrega: '🚚 Em entrega',
        entregue: '✔️ Entregue', cancelado: '❌ Cancelado',
    }[p.status] || p.status;

    const podeCancelar = ['pendente', 'confirmado'].includes(p.status);

    return `
    <article class="pedido-card" aria-label="Pedido ${p.codigo}">
      <div class="pedido-header">
        <div>
          <p class="pedido-codigo">${p.codigo}</p>
          <p class="pedido-comercio">${p.comercio?.emoji || '🏪'} ${p.comercio?.nome || 'Loja'}</p>
        </div>
        <span class="pedido-status status-${p.status}">${statusLabel}</span>
      </div>
      <div class="pedido-body">
        <p class="pedido-itens">${itensTxt}</p>
        <div class="pedido-footer">
          <div>
            <p class="pedido-total">${total}</p>
            <p class="pedido-data">${data}</p>
          </div>
          ${podeCancelar ? `<button class="btn-cancelar" data-codigo="${p.codigo}">Cancelar</button>` : ''}
        </div>
      </div>
    </article>`;
}

function renderPaginacao(p) {
    let btns = `<button class="btn-pag" data-page="${p.pagina - 1}" ${p.pagina <= 1 ? 'disabled' : ''}>‹ Anterior</button>`;
    for (let i = 1; i <= p.totalPaginas; i++) {
        btns += `<button class="btn-pag ${i === p.pagina ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    btns += `<button class="btn-pag" data-page="${p.pagina + 1}" ${p.pagina >= p.totalPaginas ? 'disabled' : ''}>Próximo ›</button>`;
    return btns;
}

async function cancelarPedido(codigo, container, ctx) {
    const motivo = prompt(`Cancelar pedido ${codigo}?\nInforme o motivo:`);
    if (!motivo) return;

    try {
        const res = await fetch(`/api/pedidos/${codigo}/status`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': ctx.csrfToken,
            },
            body: JSON.stringify({ status: 'cancelado', motivoCancelamento: motivo }),
        });
        if (res.ok) {
            carregarPedidos(container, ctx, _currentPage);
        } else {
            const d = await res.json();
            alert(d.error || 'Erro ao cancelar pedido');
        }
    } catch {
        alert('Erro de rede. Tente novamente.');
    }
}

export function unmount() {
    _cleanup.forEach(fn => fn());
    _cleanup = [];
}
