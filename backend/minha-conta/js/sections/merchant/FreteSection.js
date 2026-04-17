// =====================================================
// FreteSection.js — Configurações de Frete (comerciante) MVP
// =====================================================

let _cleanup = [];

export function mount(container, ctx) {
    _cleanup = [];

    container.innerHTML = `
    <section class="frete-section">
      <div class="section-header-row">
        <div>
          <h2 class="section-title">🚚 Frete e Entregas</h2>
          <p class="section-subtitle">Ajuste as taxas e regras de entrega da loja atual</p>
        </div>
      </div>

      <div id="no-store-banner" class="hidden section-error">
        <p>Você precisa selecionar uma loja no topo para gerenciar o frete.</p>
      </div>

      <div class="card frete-card" id="frete-content">
        <!-- Mock visual por enquanto até ter endpoint de configurações do comercio -->
        <form id="form-frete">
          <div class="form-group">
            <label>Taxa de entrega padrão (R$)</label>
            <input type="number" step="0.50" value="5.00" />
          </div>
          <div class="form-group">
            <label>Tempo estimado (minutos)</label>
            <input type="number" value="40" />
          </div>
          <div style="margin-top:20px">
            <button type="submit" class="btn-primary">Salvar Configurações</button>
          </div>
        </form>
      </div>
    </section>

    <style>
      .frete-section { max-width: 600px; }
      .section-header-row { margin-bottom: 20px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }
      .frete-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 24px; }
      
      .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
      .form-group label { font-size: .8rem; font-weight: 600; color: var(--text-muted); }
      .form-group input { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 9px 12px; outline: none; }
      .btn-primary { background: var(--accent); color: #fff; border: none; padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; transition: background .15s; }
      .btn-primary:hover { background: var(--accent-dark); }
    </style>
  `;

    if (!ctx.activeStoreId) {
        container.querySelector('#no-store-banner').classList.remove('hidden');
        container.querySelector('#frete-content').classList.add('hidden');
        return;
    }

    const form = container.querySelector('#form-frete');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Configurações salvas (MVP Simulator)');
    });
}

export function unmount() {
    _cleanup.forEach(fn => fn());
    _cleanup = [];
}
