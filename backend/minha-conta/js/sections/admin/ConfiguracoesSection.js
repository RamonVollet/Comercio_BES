// =====================================================
// ConfiguracoesSection.js — Configurações Globais (Admin)
// =====================================================

let _cleanup = [];

export function mount(container, ctx) {
    _cleanup = [];

    container.innerHTML = `
    <section class="configuracoes-section">
      <div class="section-header-row">
        <div>
          <h2 class="section-title">⚙️ Configurações da Plataforma</h2>
          <p class="section-subtitle">Ajustes globais do sistema</p>
        </div>
      </div>

      <div class="card configuracoes-card">
        <form id="form-config-global">
          <h3 style="font-size:.95rem; margin-top:0; margin-bottom:16px;">Taxas e Limites</h3>
          
          <div class="form-group">
            <label>Taxa de Serviço (%)</label>
            <input type="number" step="0.1" value="2.0" />
            <span class="help-text">Taxa retida das vendas dos comerciantes para a plataforma.</span>
          </div>

          <div class="form-group">
            <label>Máximo de lojas por comerciante</label>
            <input type="number" value="3" />
          </div>

          <hr style="border:0; border-top:1px solid var(--border); margin:20px 0" />

          <h3 style="font-size:.95rem; margin-top:0; margin-bottom:16px;">Manutenção</h3>

          <div class="form-group-check">
            <label class="switch">
              <input type="checkbox" />
              <span class="slider"></span>
            </label>
            <div style="display:flex; flex-direction:column; gap:2px">
              <span style="font-weight:600; font-size:.875rem">Modo Manutenção</span>
              <span style="font-size:.75rem; color:var(--text-muted)">Bloqueia acesso público à plataforma. Apenas admin acessam.</span>
            </div>
          </div>

          <div style="margin-top:24px">
            <button type="submit" class="btn-primary">Salvar Configurações Globais</button>
          </div>
        </form>
      </div>
    </section>

    <style>
      .configuracoes-section { max-width: 600px; }
      .section-header-row { margin-bottom: 20px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }
      .configuracoes-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 24px; }
      
      .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 20px; }
      .form-group label { font-size: .8rem; font-weight: 600; color: var(--text); }
      .help-text { font-size: .75rem; color: var(--text-muted); }
      .form-group input { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 9px 12px; outline: none; width: 100%; max-width: 300px; }
      
      .form-group-check { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }

      .btn-primary { background: var(--accent); color: #fff; border: none; padding: 10px 20px; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; transition: background .15s; }
      .btn-primary:hover { background: var(--accent-dark); }

      /* Toggle switch */
      .switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink:0; }
      .switch input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
      .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .2s; border-radius: 50%; }
      input:checked + .slider { background-color: var(--accent); }
      input:focus + .slider { box-shadow: 0 0 1px var(--accent); }
      input:checked + .slider:before { transform: translateX(20px); }
    </style>
  `;

    const form = container.querySelector('#form-config-global');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Configurações salvas (MVP Simulator)');
    });
}

export function unmount() {
    _cleanup.forEach(fn => fn());
    _cleanup = [];
}
