// =====================================================
// ModeracaoLojasSection.js — Moderação de Lojas (Admin)
// =====================================================
import { esc } from '../../utils.js';

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
  `;

  carregarLojas(container, ctx);
}

async function carregarLojas(container, ctx) {
  const tbody = container.querySelector('tbody');
  try {
    const res = await fetch('/api/comercios?limit=50');
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
            <span>${esc(l.emoji) || '🏪'}</span>
            <span>${esc(l.nome)}</span>
          </div>
          <div style="font-size:.75rem; color:var(--text-muted); margin-top:4px">${esc(l.slug)}</div>
        </td>
        <td style="color:var(--text-muted)">ID: ${esc(String(l.userId || '?'))}</td>
        <td><span class="badge-status ${l.aberto ? 'aberto' : 'fechado'}">${l.aberto ? 'Aberto' : 'Fechado'}</span></td>
        <td>
          <div class="acoes">
            <button class="btn-link" onclick="window.open('/${esc(l.slug)}','_blank')">Ver Página</button>
            <button class="btn-link ${l.aberto ? 'danger' : ''} btn-suspender" data-id="${l.id}" data-aberto="${l.aberto}">${l.aberto ? 'Suspender' : 'Reativar'}</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Eventos
    tbody.querySelectorAll('.btn-suspender').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const estavaAberto = btn.dataset.aberto === 'true';
        const acao = estavaAberto ? 'Suspender' : 'Reativar';
        const novoAberto = !estavaAberto;

        if (!confirm(`Tem certeza que deseja ${acao} esta loja?`)) return;

        try {
          const res = await fetch(`/api/admin/lojas/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ativo: novoAberto })
          });

          if (!res.ok) throw new Error('Falha ao atualizar status');
          carregarLojas(container, ctx);
        } catch (err) {
          alert('Erro de rede: ' + err.message);
        }
      });
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--danger)">Erro ao carregar lojas</td></tr>`;
  }
}

export function unmount() {
  _cleanup.forEach(fn => fn());
  _cleanup = [];
}
