// =====================================================
// RecebiveisSection.js — Dashboard financeiro (comerciante) MVP
// =====================================================

let _cleanup = [];

export function mount(container, ctx) {
    _cleanup = [];

    container.innerHTML = `
    <section class="recebiveis-section">
      <div class="section-header-row">
        <div>
          <h2 class="section-title">💰 Recebíveis</h2>
          <p class="section-subtitle">Resumo financeiro da loja ativa</p>
        </div>
      </div>

      <div id="no-store-banner" class="hidden section-error">
        <p>Você precisa selecionar uma loja no topo para visualizar os recebíveis.</p>
      </div>

      <div id="recebiveis-content">
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Disponível para saque</span>
            <span class="stat-value text-accent" id="resumo-faturamento">R$ 0,00</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">A receber (futuro)</span>
            <span class="stat-value" id="resumo-futuro">R$ 0,00</span>
          </div>
        </div>
        
        <div style="margin-top:20px;">
          <h3 style="font-size: 1rem; margin-bottom: 12px;">Desempenho</h3>
          <p style="font-size:.85rem; color:var(--text-muted)">Os dados de pagamentos estarão disponíveis detalhadamente após integração com adquirente.</p>
        </div>
      </div>
    </section>

    <style>
      .recebiveis-section { max-width: 800px; }
      .section-header-row { margin-bottom: 20px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }
      
      .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 8px; }
      .stat-label { font-size: .8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
      .stat-value { font-family: var(--font-display); font-size: 1.8rem; font-weight: 700; }
      .text-accent { color: var(--accent); }
    </style>
  `;

    if (!ctx.activeStoreId) {
        container.querySelector('#no-store-banner').classList.remove('hidden');
        container.querySelector('#recebiveis-content').classList.add('hidden');
        return;
    }

    // Busca do resumo de pedidos do backend 
    fetch('/api/pedidos/resumo', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
            // Como o resumo do backend agrega se não passar a loja, assumimos o faturamento retornado como global do comerciante
            // (Em refactoring futuro, /api/pedidos/resumo pode receber ?lojaId=...)
            if (container.querySelector('#resumo-faturamento')) {
                container.querySelector('#resumo-faturamento').textContent = (data.faturamento || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
        })
        .catch(() => { });
}

export function unmount() {
    _cleanup.forEach(fn => fn());
    _cleanup = [];
}
