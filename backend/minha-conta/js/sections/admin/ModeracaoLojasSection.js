// =====================================================
// ModeracaoLojasSection.js — Moderação de Lojas (Admin)
// =====================================================

let _cleanup = [];

export function mount(container, ctx) {
    _cleanup = [];

    container.innerHTML = `
    <section class="moderacao-section">
      <div class="section-header-row">
        <div>
          <h2 class="section-title">🛡️ Moderação de Lojas</h2>
          <p class="section-subtitle">Visualizar e moderar comercios cadastrados na plataforma</p>
        </div>
      </div>

      <div class="card" style="padding:0">
        <div class="table-responsive">
          <table class="table" id="table-lojas">
            <thead>
              <tr>
                <th>Comércio</th>
                <th>Dono / Usuário ID</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colspan="4" style="text-align:center;padding:20px"><div class="spinner" style="border-color:var(--border);border-top-color:var(--accent);display:inline-block"></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <style>
      .moderacao-section { max-width: 900px; }
      .section-header-row { margin-bottom: 20px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }
      
      .table-responsive { overflow-x: auto; }
      .table { width: 100%; border-collapse: collapse; font-size: .875rem; text-align: left; }
      .table th { padding: 12px 16px; background: #fafafa; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); }
      .table td { padding: 12px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
      .table tr:last-child td { border-bottom: none; }
      
      .nome-loja { font-weight: 600; display: flex; align-items: center; gap: 8px; }
      .badge-status { font-size: .75rem; font-weight: 600; padding: 3px 8px; border-radius: 999px; }
      .badge-status.aberto { background: #DCFCE7; color: #166534; }
      .badge-status.fechado { background: #FEE2E2; color: #991B1B; }

      .btn-link { background: none; border: none; font-size: .8rem; cursor: pointer; color: var(--accent); font-weight: 600; padding: 0; }
      .btn-link.danger { color: var(--danger); }
      .acoes { display: flex; gap: 10px; }
    </style>
  `;

    carregarLojas(container, ctx);
}

async function carregarLojas(container, ctx) {
    const tbody = container.querySelector('tbody');
    try {
        const res = await fetch('/api/comercios?limit=50', { auth: false });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const lojas = data.comercios || [];

        if (!lojas.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Nenhuma loja encontrada</td></tr>';
            return;
        }

        tbody.innerHTML = lojas.map(l => `
      <tr>
        <td>
          <div class="nome-loja">
            <span>${l.emoji || '🏪'}</span>
            <span>${l.nome}</span>
          </div>
          <div style="font-size:.75rem; color:var(--text-muted); margin-top:4px">${l.slug}</div>
        </td>
        <td style="color:var(--text-muted)">ID: ${l.userId || '?'}</td>
        <td><span class="badge-status ${l.aberto ? 'aberto' : 'fechado'}">${l.aberto ? 'Aberto' : 'Fechado'}</span></td>
        <td>
          <div class="acoes">
            <button class="btn-link" onclick="window.open('/${l.slug}','_blank')">Ver Página</button>
            <button class="btn-link danger" data-id="${l.id}" title="Desativar comércio na plataforma (Requer endpoint de moderação)">Suspender</button>
          </div>
        </td>
      </tr>
    `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--danger)">Erro ao carregar lojas</td></tr>`;
    }
}

export function unmount() {
    _cleanup.forEach(fn => fn());
    _cleanup = [];
}
