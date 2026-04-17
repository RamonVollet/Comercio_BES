// =====================================================
// RastreioSection.js — Rastreio de pedidos (cliente)
// =====================================================

let _cleanup = [];

export function mount(container, ctx) {
    _cleanup = [];

    container.innerHTML = `
    <section class="rastreio-section">
      <div class="section-header">
        <h2 class="section-title">📍 Rastreio de Entrega</h2>
        <p class="section-subtitle">Acompanhe o status dos seus pedidos em andamento</p>
      </div>

      <div id="rastreio-list">
        <div class="content-loading"><div class="spinner"></div></div>
      </div>
    </section>

    <style>
      .rastreio-section { max-width: 680px; }
      .section-header { margin-bottom: 20px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }

      .rastreio-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px; margin-bottom: 12px; }
      .rastreio-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 8px; }
      .rastreio-codigo { font-family: var(--font-display); font-weight: 700; }
      .rastreio-comercio { font-size: .82rem; color: var(--text-muted); }

      /* Timeline de status */
      .timeline { display: flex; flex-direction: column; gap: 0; }
      .timeline-step { display: flex; gap: 14px; position: relative; }
      .timeline-step:not(:last-child) { padding-bottom: 20px; }
      .timeline-step:not(:last-child)::before {
        content: ''; position: absolute; left: 11px; top: 24px;
        width: 2px; bottom: 0; background: var(--border);
      }
      .timeline-step.done::before { background: var(--accent); }

      .step-dot {
        width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
        border: 2px solid var(--border); background: var(--surface);
        display: flex; align-items: center; justify-content: center; font-size: .65rem;
      }
      .timeline-step.done .step-dot   { background: var(--accent); border-color: var(--accent); color: #fff; }
      .timeline-step.active .step-dot { border-color: var(--accent); background: var(--accent-bg); }

      .step-content { padding-top: 2px; }
      .step-label { font-size: .875rem; font-weight: 600; color: var(--text-muted); }
      .timeline-step.done   .step-label { color: var(--accent); }
      .timeline-step.active .step-label { color: var(--text); }
      .step-desc { font-size: .78rem; color: var(--text-muted); line-height: 1.5; }
    </style>
  `;

    carregarRastreio(container);
}

const STEPS = [
    { key: 'pendente', icon: '🕐', label: 'Pedido recebido', desc: 'Aguardando confirmação da loja.' },
    { key: 'confirmado', icon: '✅', label: 'Confirmado', desc: 'A loja confirmou seu pedido.' },
    { key: 'preparando', icon: '👨‍🍳', label: 'Em preparo', desc: 'Seu pedido está sendo preparado.' },
    { key: 'saiu_entrega', icon: '🚚', label: 'Saiu para entrega', desc: 'A entrega está a caminho.' },
    { key: 'entregue', icon: '✔️', label: 'Entregue', desc: 'Pedido entregue com sucesso!' },
];

async function carregarRastreio(container) {
    const el = container.querySelector('#rastreio-list');
    try {
        // Busca pedidos ativos (não cancelados, não entregues totalmente)
        const res = await fetch('/api/pedidos?limit=20', { credentials: 'include' });
        if (!res.ok) throw new Error();
        const { pedidos } = await res.json();

        // Filtra pedidos em andamento (excluindo cancelados e entregues antigos)
        const ativos = pedidos.filter(p => p.status !== 'cancelado' && p.status !== 'entregue');
        // Inclui entregues recentes (últimas 48h)
        const recentes = pedidos.filter(p => p.status === 'entregue' && isRecent(p.createdAt, 48));

        const mostrar = [...ativos, ...recentes];

        if (!mostrar.length) {
            el.innerHTML = `
        <div class="section-empty">
          <h2>Nenhum pedido em andamento</h2>
          <p>Faça um pedido e acompanhe a entrega aqui.</p>
        </div>`;
            return;
        }

        el.innerHTML = mostrar.map(p => renderTimeline(p)).join('');

    } catch {
        el.innerHTML = '<div class="section-error"><h2>Erro ao carregar rastreio</h2><p>Tente novamente.</p></div>';
    }
}

function renderTimeline(pedido) {
    const currentIdx = STEPS.findIndex(s => s.key === pedido.status);
    const stepsHtml = STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const cls = done ? 'done' : active ? 'active' : '';
        return `
      <div class="timeline-step ${cls}" role="listitem" aria-label="${step.label}${active ? ' (status atual)' : ''}">
        <div class="step-dot">${done ? '✓' : step.icon}</div>
        <div class="step-content">
          <p class="step-label">${step.label}</p>
          ${active || done ? `<p class="step-desc">${step.desc}</p>` : ''}
        </div>
      </div>`;
    }).join('');

    return `
    <article class="rastreio-card" aria-label="Rastreio ${pedido.codigo}">
      <div class="rastreio-top">
        <div>
          <p class="rastreio-codigo">${pedido.codigo}</p>
          <p class="rastreio-comercio">${pedido.comercio?.emoji || '🏪'} ${pedido.comercio?.nome}</p>
        </div>
        <p style="font-size:.78rem;color:var(--text-muted)">${new Date(pedido.createdAt).toLocaleDateString('pt-BR')}</p>
      </div>
      <div class="timeline" role="list">${stepsHtml}</div>
    </article>`;
}

function isRecent(dateStr, hours) {
    return (Date.now() - new Date(dateStr).getTime()) < hours * 60 * 60 * 1000;
}

export function unmount() {
    _cleanup.forEach(fn => fn());
    _cleanup = [];
}
