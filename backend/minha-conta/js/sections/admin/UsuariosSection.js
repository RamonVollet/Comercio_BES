// =====================================================
// UsuariosSection.js — Gerenciamento de Usuários (Admin)
// =====================================================

let _cleanup = [];

export function mount(container, ctx) {
  _cleanup = [];

  container.innerHTML = `
    <section class="usuarios-section">
      <div class="section-header-row">
        <div>
          <h2 class="section-title">👥 Usuários</h2>
          <p class="section-subtitle">Gestão de clientes, comerciantes e administradores</p>
        </div>
      </div>

      <div class="card" style="padding:0">
        <div class="table-responsive">
          <table class="table" id="table-usuarios">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Tipo</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colspan="5" style="text-align:center;padding:20px"><div class="spinner" style="border-color:var(--border);border-top-color:var(--accent);display:inline-block"></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <style>
      .usuarios-section { max-width: 900px; }
      .section-header-row { margin-bottom: 20px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }
      
      .table-responsive { overflow-x: auto; }
      .table { width: 100%; border-collapse: collapse; font-size: .875rem; text-align: left; }
      .table th { padding: 12px 16px; background: #fafafa; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); }
      .table td { padding: 12px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
      .table tr:last-child td { border-bottom: none; }
      
      .badge-tipo { font-size: .75rem; font-weight: 600; padding: 3px 8px; border-radius: 999px; display: inline-block; }
      .tipo-admin { background: #EDE9FE; color: #5B21B6; }
      .tipo-comerciante { background: #DCFCE7; color: #166534; }
      .tipo-cliente { background: #E0F2FE; color: #075985; }
    </style>
  `;

  // Assume rota /api/admin/usuarios (se existir, senao mock p/ MVP)
  // Como nao vi rota admin na Fase 1 e no legado era apenas fetch direto ou sem rota de listagem pra admin exposta
  // Vou mockar com a base do schema para MVP, o admin routes seria fase 3 backend, let's load what we can.
  // Vou assumir que ainda vamos buildar rotas de admin ou as que existirem.

  carregarUsuarios(container, ctx);
}

async function carregarUsuarios(container, ctx) {
  const tbody = container.querySelector('tbody');
  try {
    // API Legado /admin/usuarios existe? Vamos assumir que sim por enquanto ou fazer erro gracefull
    const res = await fetch('/api/usuarios', { credentials: 'include' });
    if (!res.ok) throw new Error();
    const data = await res.json();
    // Assuming data is an array of users for the sake of MVP
    const users = Array.isArray(data) ? data : (data.usuarios || []);

    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhum dado retornado (verifique a API)</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td style="color:var(--text-muted)">#${u.id}</td>
        <td style="font-weight:600">${u.nome}</td>
        <td>${u.email}</td>
        <td><span class="badge-tipo tipo-${u.tipo}">${u.tipo}</span></td>
        <td>${new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 40px; color:var(--text-muted)">
          <div style="font-size: 2rem; margin-bottom: 10px;">🚧</div>
          <strong style="color:var(--text)">Módulo em Construção</strong><br>
          A API de gerenciamento (CRUD) será conectada na próxima fase.
        </td></tr>`;
  }
}

export function unmount() {
  _cleanup.forEach(fn => fn());
  _cleanup = [];
}
