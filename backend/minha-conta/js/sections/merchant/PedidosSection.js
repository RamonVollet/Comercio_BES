// =====================================================
// PedidosSection.js — Gerenciamento de pedidos (comerciante)
// =====================================================

let _cleanup = [];
let _currentPage = 1;

export function mount(container, ctx) {
    _cleanup = [];
    _currentPage = 1;

    container.innerHTML = `
    <section class="pedidos-section">
      <div class="section-header-row">
        <div>
          <h2 class="section-title">🧾 Pedidos Recebidos</h2>
          <p class="section-subtitle">Gerencie os pedidos da loja ativa</p>
        </div>
      </div>

      <div id="no-store-banner" class="hidden section-error">
        <p>Você precisa selecionar uma loja no topo para gerenciar os pedidos.</p>
      </div>

      <div class="filters-bar" id="pedidos-filters">
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

      <div id="pedidos-list">
        <div class="content-loading"><div class="spinner"></div></div>
      </div>

      <div id="paginacao" class="paginacao hidden"></div>
    </section>

    <style>
      .pedidos-section { max-width: 860px; }
      .section-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }
      .filters-bar { margin-bottom: 16px; }
      .filter-select { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 12px; font-size: .875rem; background: var(--surface); outline: none; }
      
      .pedidos-list { display: flex; flex-direction: column; gap: 12px; }
      .pedido-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; display: flex; flex-direction: column; }
      .pedido-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); background: #fdfdfd; }
      .pedido-header-left { display: flex; flex-direction: column; gap: 4px; }
      .pedido-codigo { font-family: var(--font-display); font-weight: 700; font-size: .95rem; }
      .pedido-cliente { font-size: .85rem; color: var(--text-muted); }
      .pedido-status { font-size: .75rem; font-weight: 600; padding: 4px 10px; border-radius: 999px; }
      .status-pendente      { background: #FEF3C7; color: #92400E; }
      .status-confirmado    { background: #DBEAFE; color: #1E40AF; }
      .status-preparando    { background: #EDE9FE; color: #5B21B6; }
      .status-saiu_entrega  { background: #CFFAFE; color: #0E7490; }
      .status-entregue      { background: var(--accent-bg); color: var(--accent); }
      .status-cancelado     { background: #FEE2E2; color: var(--danger); }

      .pedido-body { padding: 14px 16px; flex: 1; }
      .pedido-itens { font-size: .85rem; color: var(--text); margin-bottom: 12px; line-height: 1.5; }
      .pedido-endereco { font-size: .8rem; color: var(--text-muted); margin-bottom: 12px; }
      
      .pedido-footer { padding: 12px 16px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #fafafa; }
      .pedido-total { font-weight: 700; font-size: 1rem; color: var(--text); }
      .acoes-status { display: flex; gap: 8px; flex-wrap: wrap; }
      .btn-status { font-size: .75rem; font-weight: 600; border: 1px solid var(--border); background: var(--surface); border-radius: var(--radius-sm); padding: 5px 10px; cursor: pointer; transition: all .15s; }
      .btn-status:hover { border-color: var(--accent); color: var(--accent); }
      .btn-status.danger { color: var(--danger); border-color: #fecaca; }
      .btn-status.danger:hover { background: #fef2f2; }

      .paginacao { display: flex; gap: 8px; justify-content: center; margin-top: 20px; }
      .btn-pag { border: 1px solid var(--border); background: var(--surface); border-radius: var(--radius-sm); padding: 6px 14px; font-size: .875rem; cursor: pointer; }
      .btn-pag.active { background: var(--accent); color: #fff; border-color: var(--accent); }
    </style>
  `;

    if (!ctx.activeStoreId) {
        container.querySelector('#no-store-banner').classList.remove('hidden');
        container.querySelector('#pedidos-filters').classList.add('hidden');
        container.querySelector('#pedidos-list').classList.add('hidden');
        return;
    }

    carregarPedidos(container, ctx, 1);

    const filtro = container.querySelector('#filtro-status');
    filtro.addEventListener('change', () => carregarPedidos(container, ctx, 1));
    _cleanup.push(() => filtro.removeEventListener('change', () => { }));
}

async function carregarPedidos(container, ctx, page) {
    _currentPage = page;
    const listaEl = container.querySelector('#pedidos-list');
    const pagEl = container.querySelector('#paginacao');
    const status = container.querySelector('#filtro-status').value;

    listaEl.innerHTML = '<div class="content-loading"><div class="spinner"></div></div>';
    pagEl.classList.add('hidden');

    try {
        const params = new URLSearchParams({ page, limit: 10 });
        if (status) params.set('status', status);

        const res = await fetch(`/api/pedidos?${params}`, { credentials: 'include' });
        if (!res.ok) throw new Error();
        const { pedidos, paginacao } = await res.json();

        // Filtra no frontend apenas os da loja ativa atual, já que a API retorna todas as lojas do merchant
        const pedidosLoja = pedidos.filter(p => p.comercioId === ctx.activeStoreId);

        if (!pedidosLoja.length) {
            listaEl.innerHTML = `
        <div class="section-empty">
          <h2>Nenhum pedido</h2>
          <p>Não há pedidos para a loja selecionada com os filtros atuais.</p>
        </div>`;
            return;
        }

        listaEl.innerHTML = pedidosLoja.map(p => renderPedidoCard(p)).join('');

        // Eventos de alteração de status
        listaEl.querySelectorAll('.btn-status[data-status]').forEach(btn => {
            btn.addEventListener('click', () => atualizarStatus(btn.dataset.codigo, btn.dataset.status, container, ctx));
        });

    } catch {
        listaEl.innerHTML = '<div class="section-error"><h2>Erro ao carregar pedidos</h2></div>';
    }
}

function renderPedidoCard(p) {
    const itensTxt = p.itens.map(i => `<b>${i.quantidade}x</b> ${i.nome}`).join('<br>');
    const end = p.endereco ? `📍 ${p.endereco.rua}, ${p.endereco.numero} - ${p.endereco.bairro}` : '📍 Retirada no local';
    const total = p.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const statusLabel = {
        pendente: '⏳ Pendente', confirmado: '✅ Confirmado',
        preparando: '👨‍🍳 Preparando', saiu_entrega: '🚚 Em entrega',
        entregue: '✔️ Entregue', cancelado: '❌ Cancelado',
    }[p.status] || p.status;

    // Botões de ação baseados no status atual
    let acoes = '';
    if (p.status === 'pendente') {
        acoes = `
      <button class="btn-status" data-codigo="${p.codigo}" data-status="confirmado">Confirmar</button>
      <button class="btn-status danger" data-codigo="${p.codigo}" data-status="cancelado">Cancelar</button>
    `;
    } else if (p.status === 'confirmado') {
        acoes = `<button class="btn-status" data-codigo="${p.codigo}" data-status="preparando">Iniciar Preparo</button>`;
    } else if (p.status === 'preparando') {
        acoes = `<button class="btn-status" data-codigo="${p.codigo}" data-status="saiu_entrega">Despachar Entrega</button>`;
    } else if (p.status === 'saiu_entrega') {
        acoes = `<button class="btn-status" data-codigo="${p.codigo}" data-status="entregue">Marcar Entregue</button>`;
    }

    return `
    <article class="pedido-card">
      <div class="pedido-header">
        <div class="pedido-header-left">
          <span class="pedido-codigo">${p.codigo}</span>
          <span class="pedido-cliente">👤 ${p.cliente?.nome || 'Cliente'}</span>
        </div>
        <span class="pedido-status status-${p.status}">${statusLabel}</span>
      </div>
      <div class="pedido-body">
        <div class="pedido-itens">${itensTxt}</div>
        <div class="pedido-endereco">${end}</div>
      </div>
      <div class="pedido-footer">
        <span class="pedido-total">${total}</span>
        <div class="acoes-status">${acoes}</div>
      </div>
    </article>
  `;
}

async function atualizarStatus(codigo, status, container, ctx) {
    let body = { status };
    if (status === 'cancelado') {
        const motivo = prompt('Motivo do cancelamento:');
        if (!motivo) return;
        body.motivoCancelamento = motivo;
    }

    try {
        const res = await fetch(`/api/pedidos/${codigo}/status`, {
            method: 'PUT', credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': ctx.csrfToken },
            body: JSON.stringify(body)
        });
        if (res.ok) carregarPedidos(container, ctx, _currentPage);
        else alert('Erro ao atualizar pedido');
    } catch {
        alert('Erro de rede');
    }
}

export function unmount() {
    _cleanup.forEach(fn => fn());
    _cleanup = [];
}
