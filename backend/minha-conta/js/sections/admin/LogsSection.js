// =====================================================
// LogsSection.js — Audit Logs do Sistema (Admin)
// =====================================================

let _cleanup = [];

export function mount(container, ctx) {
    _cleanup = [];

    container.innerHTML = `
    <section class="logs-section">
      <div class="section-header-row">
        <div>
          <h2 class="section-title">📋 Logs de Auditoria</h2>
          <p class="section-subtitle">Ações críticas registradas no sistema (AuditLog)</p>
        </div>
      </div>

      <div class="card" style="padding:0">
        <div class="table-responsive">
          <table class="table" id="table-logs">
            <thead>
              <tr>
                <th>Data</th>
                <th>Usuário ID</th>
                <th>Ação</th>
                <th>Recurso</th>
                <th>IP</th>
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
      .logs-section { max-width: 1000px; }
      .section-header-row { margin-bottom: 20px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }
      
      .table-responsive { overflow-x: auto; }
      .table { width: 100%; border-collapse: collapse; font-size: .8rem; text-align: left; font-family: monospace; }
      .table th { padding: 10px 16px; background: #fafafa; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); font-family: var(--font-body); }
      .table td { padding: 10px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
      .table tr:last-child td { border-bottom: none; }
      
      .badge-action { font-weight: 600; padding: 2px 6px; border-radius: 4px; border: 1px solid currentColor; display: inline-block; }
      .badge-action.create { color: #059669; background: #D1FAE5; border-color: #A7F3D0; }
      .badge-action.update { color: #D97706; background: #FEF3C7; border-color: #FDE68A; }
      .badge-action.delete { color: #DC2626; background: #FEE2E2; border-color: #FECACA; }
      .badge-action.login  { color: #2563EB; background: #DBEAFE; border-color: #BFDBFE; }
    </style>
  `;

    // Assume que teremos API /api/admin/logs futuramente no backend
    carregarLogs(container, ctx);
}

async function carregarLogs(container, ctx) {
    const tbody = container.querySelector('tbody');
    try {
        const res = await fetch('/api/admin/logs', { credentials: 'include' });
        if (!res.ok) throw new Error('Endpoint pode ainda não existir');
        const data = await res.json();
        const logs = data.logs || [];

        if (!logs.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; font-family:sans-serif">Nenhum log encontrado.</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(l => {
            // Color coding simple base on action name
            let cls = '';
            const act = l.action.toLowerCase();
            if (act.includes('create')) cls = 'create';
            else if (act.includes('update')) cls = 'update';
            else if (act.includes('delete')) cls = 'delete';
            else if (act.includes('login') || act.includes('auth')) cls = 'login';

            return `
        <tr>
          <td style="color:var(--text-muted)">${new Date(l.createdAt).toLocaleString('pt-BR')}</td>
          <td><b>#${l.userId}</b></td>
          <td><span class="badge-action ${cls}">${l.action}</span></td>
          <td style="color:#6B7280; font-size:.75rem">${l.resource}</td>
          <td style="color:#9CA3AF">${l.ip || '0.0.0.0'}</td>
        </tr>
      `;
        }).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger); font-family:var(--font-body)">
      A funcionalidade <b>Logs de Auditoria</b> está mapeada no Schema (AuditLog) mas a rota GET <code>/api/admin/logs</code> ainda será implementada no backend.
    </td></tr>`;
    }
}

export function unmount() {
    _cleanup.forEach(fn => fn());
    _cleanup = [];
}
