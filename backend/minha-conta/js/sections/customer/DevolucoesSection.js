// =====================================================
// DevolucoesSection.js — Devoluções/solicitações (cliente) - MVP
// =====================================================
// MVP: abertura de solicitação via cancelamento de pedido
// Fase 4: implementar fluxo completo com status e SLA

let _cleanup = [];

export function mount(container, ctx) {
    _cleanup = [];

    container.innerHTML = `
    <section class="devolucoes-section">
      <div class="section-header">
        <h2 class="section-title">↩️ Devoluções</h2>
        <p class="section-subtitle">Solicitar devolução ou cancelamento de pedido</p>
      </div>

      <div class="info-banner">
        <span class="info-icon">ℹ️</span>
        <div>
          <p class="info-title">Como funciona</p>
          <p class="info-text">Para solicitar devolução de um pedido entregue, cancele o pedido informando o motivo. Nossa equipe entrará em contato em até 48h.</p>
        </div>
      </div>

      <h3 class="sub-title">Pedidos recentes elegíveis</h3>
      <div id="devolucoes-list">
        <div class="content-loading"><div class="spinner"></div></div>
      </div>
    </section>

    <style>
      .devolucoes-section { max-width: 680px; }
      .section-header { margin-bottom: 16px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }
      .sub-title { font-size: .875rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; margin: 20px 0 12px; }

      .info-banner { display: flex; gap: 12px; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 20px; }
      .info-icon { font-size: 1.2rem; flex-shrink: 0; }
      .info-title { font-weight: 600; font-size: .875rem; margin: 0 0 2px; }
      .info-text { font-size: .82rem; color: var(--text-muted); margin: 0; line-height: 1.5; }

      .dev-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
      .dev-info {}
      .dev-codigo { font-weight: 700; font-size: .9rem; margin: 0 0 3px; }
      .dev-meta { font-size: .8rem; color: var(--text-muted); margin: 0; }
      .dev-total { font-weight: 700; font-size: .9rem; margin: 0 0 6px; }
      .btn-solicitar { background: none; border: 1px solid var(--danger); color: var(--danger); padding: 7px 14px; border-radius: var(--radius-sm); font-size: .8rem; font-weight: 600; cursor: pointer; transition: background .15s; white-space: nowrap; }
      .btn-solicitar:hover { background: #fef2f2; }
      .status-cancelado-badge { display: inline-block; font-size: .75rem; background: #FEE2E2; color: var(--danger); padding: 3px 10px; border-radius: 999px; font-weight: 600; }
    </style>
  `;

    carregarElegiveis(container, ctx);
}

async function carregarElegiveis(container, ctx) {
    const el = container.querySelector('#devolucoes-list');
    try {
        const res = await fetch('/api/pedidos?limit=20', { credentials: 'include' });
        if (!res.ok) throw new Error();
        const { pedidos } = await res.json();

        // Elegíveis: entregues nos últimos 7 dias, ou canceláveis (pendente/confirmado)
        const elegiveis = pedidos.filter(p => {
            if (p.status === 'cancelado') return false;
            if (['pendente', 'confirmado'].includes(p.status)) return true;
            if (p.status === 'entregue') return isRecent(p.createdAt, 7 * 24);
            return false;
        });

        if (!elegiveis.length) {
            el.innerHTML = `<div class="section-empty"><h2>Nenhum pedido elegível</h2><p>Pedidos entregues há mais de 7 dias não podem ser devolvidos por este canal.</p></div>`;
            return;
        }

        el.innerHTML = elegiveis.map(p => {
            const data = new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            const valor = p.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const isCancelavel = ['pendente', 'confirmado'].includes(p.status);
            const label = isCancelavel ? 'Cancelar pedido' : 'Solicitar devolução';

            return `
        <div class="dev-card" data-codigo="${p.codigo}">
          <div class="dev-info">
            <p class="dev-codigo">${p.codigo} · ${p.comercio?.nome || 'Loja'}</p>
            <p class="dev-meta">${data} · ${p.status === 'entregue' ? '✔️ Entregue' : '⏳ Em andamento'}</p>
          </div>
          <div style="text-align:right">
            <p class="dev-total">${valor}</p>
            <button class="btn-solicitar" data-codigo="${p.codigo}" data-label="${label}">${label}</button>
          </div>
        </div>`;
        }).join('');

        el.querySelectorAll('.btn-solicitar[data-codigo]').forEach(btn => {
            btn.addEventListener('click', () => solicitarDevolucao(btn.dataset.codigo, btn.dataset.label, container, ctx));
        });

    } catch {
        el.innerHTML = '<div class="section-error"><h2>Erro ao carregar pedidos</h2></div>';
    }
}

async function solicitarDevolucao(codigo, label, container, ctx) {
    const motivo = prompt(`${label} — ${codigo}\n\nDescreva o motivo da solicitação:`);
    if (!motivo?.trim()) return;

    try {
        const res = await fetch(`/api/pedidos/${codigo}/status`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': ctx.csrfToken },
            body: JSON.stringify({ status: 'cancelado', motivoCancelamento: motivo.trim() }),
        });
        if (res.ok) {
            alert('✅ Solicitação enviada! Nossa equipe entrará em contato em breve.');
            carregarElegiveis(container, ctx);
        } else {
            const d = await res.json();
            alert(`❌ ${d.error || 'Erro ao processar solicitação'}`);
        }
    } catch {
        alert('Erro de rede. Tente novamente.');
    }
}

function isRecent(dateStr, hours) {
    return (Date.now() - new Date(dateStr).getTime()) < hours * 60 * 60 * 1000;
}

export function unmount() {
    _cleanup.forEach(fn => fn());
    _cleanup = [];
}
