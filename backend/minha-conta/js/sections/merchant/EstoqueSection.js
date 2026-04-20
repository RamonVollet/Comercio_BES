// =====================================================
// EstoqueSection.js — Gerenciamento rápido de estoque
// =====================================================
import { esc } from '../../utils.js';

let _cleanup = [];

export function mount(container, ctx) {
  _cleanup = [];

  container.innerHTML = `
    <section class="estoque-section">
      <div class="section-header-row">
        <div>
          <h2 class="section-title">🗃️ Estoque Rápido</h2>
          <p class="section-subtitle">Alterne rapidamente a disponibilidade dos seus produtos</p>
        </div>
      </div>

      <div id="no-store-banner" class="hidden section-error">
        <p>Você precisa selecionar uma loja no topo para gerenciar o estoque.</p>
      </div>

      <div id="estoque-list">
        <div class="content-loading"><div class="spinner"></div></div>
      </div>
    </section>

    <style>
      .estoque-section { max-width: 600px; }
      .section-header-row { margin-bottom: 20px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }
      
      .estoque-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 8px; }
      .prod-nome { font-weight: 600; font-size: .9rem; margin: 0; }
      .prod-preco { font-size: .8rem; color: var(--text-muted); margin: 0; }
      
      /* Toggle switch */
      .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
      .switch input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
      .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .2s; border-radius: 50%; }
      input:checked + .slider { background-color: var(--accent); }
      input:focus + .slider { box-shadow: 0 0 1px var(--accent); }
      input:checked + .slider:before { transform: translateX(20px); }
    </style>
  `;

  if (!ctx.activeStoreId) {
    container.querySelector('#no-store-banner').classList.remove('hidden');
    container.querySelector('#estoque-list').classList.add('hidden');
    return;
  }

  carregarEstoque(container, ctx);
}

async function carregarEstoque(container, ctx) {
  const el = container.querySelector('#estoque-list');
  try {
    const storeObj = ctx.stores.find(s => s.id === ctx.activeStoreId);
    if (!storeObj) throw new Error('Loja não encontrada');
    const res = await fetch(`/api/comercios/${storeObj.slug}`);
    if (!res.ok) throw new Error();
    const loja = await res.json();

    const catalogo = loja.catalogo || [];

    if (!catalogo.length) {
      el.innerHTML = `<div class="section-empty"><h2>Sem produtos</h2><p>Adicione produtos primeiro na aba Produtos.</p></div>`;
      return;
    }

    el.innerHTML = catalogo.map(p => `
      <div class="estoque-item">
        <div>
          <p class="prod-nome">${esc(p.nome_produto || p.nome)}</p>
          <p class="prod-preco">R$ ${p.preco.toFixed(2).replace('.', ',')}</p>
        </div>
        <label class="switch" title="Ativar/Desativar produto">
          <input type="checkbox" class="toggle-disponivel" data-id="${p.id}" ${p.disponivel ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
    `).join('');

    el.querySelectorAll('.toggle-disponivel').forEach(chk => {
      chk.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const disponivel = e.target.checked;
        try {
          await fetch(`/api/comercios/${storeObj.slug}/produtos/${id}`, {
            method: 'PUT', credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': ctx.csrfToken },
            body: JSON.stringify({ disponivel })
          });
        } catch { alert('Erro de rede ao salvar alteração'); }
      });
    });

  } catch {
    el.innerHTML = '<div class="section-error"><h2>Erro ao carregar estoque</h2></div>';
  }
}

export function unmount() {
  _cleanup.forEach(fn => fn());
  _cleanup = [];
}
