// =====================================================
// UsuariosSection.js — Gerenciamento de Usuários (Admin)
// =====================================================
import { esc } from '../../utils.js';

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
  `;

  carregarUsuarios(container, ctx);
}

async function carregarUsuarios(container, ctx) {
  const tbody = container.querySelector('tbody');
  try {
    const res = await fetch('/api/admin/usuarios', { credentials: 'include' });
    if (!res.ok) throw new Error('Falha na API');
    const data = await res.json();
    const users = data.usuarios || [];

    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhum usuário encontrado</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td style="color:var(--text-muted)">#${esc(String(u.id))}</td>
        <td style="font-weight:600">${esc(u.nome)}</td>
        <td>${esc(u.email)}</td>
        <td><span class="badge-tipo tipo-${esc(u.tipo)}">${esc(u.tipo)}</span></td>
        <td>${new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 40px; color:var(--danger)">Erro ao carregar usuários.</td></tr>`;
  }
}

export function unmount() {
  _cleanup.forEach(fn => fn());
  _cleanup = [];
}
