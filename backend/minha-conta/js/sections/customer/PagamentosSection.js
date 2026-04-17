// =====================================================
// PagamentosSection.js — Pagamentos do cliente
// =====================================================
// Exibe histórico de pagamentos dos pedidos
// (não há endpoints de cartão salvo no MVP)

let _cleanup = [];

export function mount(container, ctx) {
    _cleanup = [];

    container.innerHTML = `
    <section class="pagamentos-section">
      <div class="section-header">
        <h2 class="section-title">💳 Pagamentos</h2>
        <p class="section-subtitle">Histórico de pagamentos dos seus pedidos</p>
      </div>

      <div id="pagamentos-list">
        <div class="content-loading"><div class="spinner"></div></div>
      </div>
    </section>

    <style>
      .pagamentos-section { max-width: 700px; }
      .section-header { margin-bottom: 20px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }

      .pagamento-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px 20px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
      .pagamento-info {}
      .pagamento-pedido { font-weight: 700; font-size: .9rem; margin: 0 0 4px; }
      .pagamento-meta { font-size: .8rem; color: var(--text-muted); margin: 0; }
      .pagamento-right { text-align: right; }
      .pagamento-valor { font-weight: 700; font-size: 1rem; margin: 0 0 4px; }
      .pagamento-status { font-size: .75rem; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
      .pag-aprovado  { background: var(--accent-bg); color: var(--accent); }
      .pag-pendente  { background: #FEF3C7; color: #92400E; }
      .pag-recusado  { background: #FEE2E2; color: var(--danger); }
      .pag-devolvido { background: #EDE9FE; color: #5B21B6; }
    </style>
  `;

    carregarPagamentos(container);
}

const METODO_LABEL = {
    pix: '🔷 PIX', cartao_credito: '💳 Cartão de Crédito',
    cartao_debito: '💳 Cartão de Débito', boleto: '📄 Boleto',
    na_entrega: '💵 Pagar na Entrega',
};

async function carregarPagamentos(container) {
    const el = container.querySelector('#pagamentos-list');
    try {
        const res = await fetch('/api/pedidos?limit=30', { credentials: 'include' });
        if (!res.ok) throw new Error();
        const { pedidos } = await res.json();

        const comPagamento = pedidos.filter(p => p.pagamento);
        if (!comPagamento.length) {
            el.innerHTML = `<div class="section-empty"><h2>Nenhum pagamento encontrado</h2><p>Seus pagamentos aparecerão aqui após realizar pedidos.</p></div>`;
            return;
        }

        el.innerHTML = comPagamento.map(p => {
            const pag = p.pagamento;
            const valor = p.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const data = new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
            const metodo = METODO_LABEL[pag.metodo] || pag.metodo || '—';
            const statusCls = { aprovado: 'pag-aprovado', pendente: 'pag-pendente', recusado: 'pag-recusado', devolvido: 'pag-devolvido' }[pag.status] || 'pag-pendente';
            const statusLabel = { aprovado: 'Aprovado', pendente: 'Pendente', recusado: 'Recusado', devolvido: 'Devolvido' }[pag.status] || pag.status;

            return `
        <div class="pagamento-card">
          <div class="pagamento-info">
            <p class="pagamento-pedido">${p.codigo} · ${p.comercio?.nome || 'Loja'}</p>
            <p class="pagamento-meta">${metodo} · ${data}</p>
          </div>
          <div class="pagamento-right">
            <p class="pagamento-valor">${valor}</p>
            <span class="pagamento-status ${statusCls}">${statusLabel}</span>
          </div>
        </div>`;
        }).join('');

    } catch {
        el.innerHTML = '<div class="section-error"><h2>Erro ao carregar pagamentos</h2></div>';
    }
}

export function unmount() {
    _cleanup.forEach(fn => fn());
    _cleanup = [];
}
