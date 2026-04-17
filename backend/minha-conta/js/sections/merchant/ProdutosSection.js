// =====================================================
// ProdutosSection.js — Gerenciamento do catálogo da loja
// =====================================================

let _cleanup = [];

export function mount(container, ctx) {
    _cleanup = [];

    container.innerHTML = `
    <section class="produtos-section">
      <div class="section-header-row">
        <div>
          <h2 class="section-title">📦 Produtos</h2>
          <p class="section-subtitle">Gerencie o catálogo da loja atual</p>
        </div>
        <button id="btn-novo-produto" class="btn-primary">+ Novo produto</button>
      </div>

      <!-- Banner de aviso se não há loja ativa -->
      <div id="no-store-banner" class="hidden section-error">
        <p>Você precisa selecionar uma loja no topo para gerenciar os produtos.</p>
      </div>

      <div id="produto-form-container" class="hidden"></div>

      <div id="produtos-list">
        <div class="content-loading"><div class="spinner"></div></div>
      </div>
    </section>

    <style>
      .produtos-section { max-width: 800px; }
      .section-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }
      
      .btn-primary { background: var(--accent); color: #fff; border: none; padding: 9px 18px; border-radius: var(--radius-sm); font-size: .875rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background .15s; }
      .btn-primary:hover { background: var(--accent-dark); }
      .btn-secondary { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 8px 16px; border-radius: var(--radius-sm); font-size: .875rem; cursor: pointer; }

      .form-card { background: var(--surface); border: 1px solid var(--accent); border-radius: var(--radius-md); padding: 20px; margin-bottom: 20px; }
      .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .form-group { display: flex; flex-direction: column; gap: 5px; }
      .form-group.span2 { grid-column: span 2; }
      .form-group label { font-size: .78rem; font-weight: 600; color: var(--text-muted); }
      .form-group input, .form-group textarea, .form-group select { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 11px; font-size: .875rem; outline: none; }
      .form-group input:focus, .form-group textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-bg); }
      .form-actions { display: flex; gap: 10px; margin-top: 16px; }

      .produtos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
      .produto-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; justify-content: space-between; }
      .produto-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
      .produto-nome { font-weight: 700; font-size: 1rem; margin: 0; }
      .produto-status { font-size: .7rem; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
      .status-ativo { background: var(--accent-bg); color: var(--accent); }
      .status-inativo { background: #FEE2E2; color: var(--danger); }
      .produto-desc { font-size: .85rem; color: var(--text-muted); margin: 0 0 12px; }
      .produto-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 12px; }
      .produto-preco { font-weight: 700; color: var(--text); }
      .produto-acoes { display: flex; gap: 8px; }
      .btn-link { background: none; border: none; font-size: .8rem; cursor: pointer; color: var(--accent); font-weight: 600; padding: 0; }
      .btn-link.danger { color: var(--danger); }
    </style>
  `;

    if (!ctx.activeStoreId) {
        container.querySelector('#no-store-banner').classList.remove('hidden');
        container.querySelector('#produtos-list').classList.add('hidden');
        container.querySelector('#btn-novo-produto').disabled = true;
        return;
    }

    carregarProdutos(container, ctx);

    const btnNovo = container.querySelector('#btn-novo-produto');
    const onNovo = () => mostrarFormulario(container, ctx, null);
    btnNovo.addEventListener('click', onNovo);
    _cleanup.push(() => btnNovo.removeEventListener('click', onNovo));

    // Ouve evento global do header quando trocar a loja (se aplicável para recarregar sem hard reload)
    // Mas o app.js dá trigger de hard reload (`navigate`) quando muda, então estamos OK.
}

async function carregarProdutos(container, ctx) {
    const el = container.querySelector('#produtos-list');
    el.innerHTML = '<div class="content-loading"><div class="spinner"></div></div>';

    try {
        const storeObj = ctx.stores.find(s => s.id === ctx.activeStoreId);
        if (!storeObj) throw new Error('Loja não encontrada');

        // Usa um slug ou API de listar produtos do comércio (reaproveitando modelo aberto do backend)
        const res = await fetch(`/api/comercios/${storeObj.slug}`);
        if (!res.ok) throw new Error();
        const loja = await res.json();

        const catalogo = loja.catalogo || [];

        if (!catalogo.length) {
            el.innerHTML = `<div class="section-empty"><h2>Sem produtos</h2><p>Comece adicionando produtos ao seu catálogo.</p></div>`;
            return;
        }

        el.innerHTML = `
      <div class="produtos-grid">
        ${catalogo.map(p => `
          <div class="produto-card">
            <div>
              <div class="produto-header">
                <h3 class="produto-nome">${p.nome_produto || p.nome}</h3>
                <span class="produto-status ${p.disponivel ? 'status-ativo' : 'status-inativo'}">${p.disponivel ? 'Ativo' : 'Inativo'}</span>
              </div>
              <p class="produto-desc">${p.descricao || 'Sem descrição'}</p>
            </div>
            <div class="produto-footer">
              <span class="produto-preco">${formatMoney(p.preco)}</span>
              <div class="produto-acoes">
                <button class="btn-link btn-excluir" data-id="${p.id}" data-pid="${p.id}">Excluir</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

        // Deletar
        el.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Excluir produto?')) return;
                try {
                    const res = await fetch(`/api/produtos/${btn.dataset.id}`, {
                        method: 'DELETE',
                        credentials: 'include',
                        headers: { 'X-CSRF-Token': ctx.csrfToken }
                    });
                    if (res.ok) carregarProdutos(container, ctx);
                    else alert('Erro ao excluir');
                } catch { alert('Erro de rede'); }
            });
        });

    } catch {
        el.innerHTML = '<div class="section-error"><h2>Erro ao carregar catálogo</h2></div>';
    }
}

function mostrarFormulario(container, ctx, produto) {
    const formEl = container.querySelector('#produto-form-container');
    formEl.classList.remove('hidden');
    formEl.innerHTML = `
    <div class="form-card">
      <h3>${produto ? 'Editar Produto' : 'Novo Produto'}</h3>
      <form id="form-produto">
        <div class="form-grid">
          <div class="form-group span2">
            <label>Nome do Produto *</label>
            <input type="text" name="nome" required value="${produto ? produto.nome : ''}" />
          </div>
          <div class="form-group span2">
            <label>Descrição</label>
            <textarea name="descricao" rows="2">${produto?.descricao || ''}</textarea>
          </div>
          <div class="form-group">
            <label>Preco (R$) *</label>
            <input type="number" step="0.01" name="preco" required value="${produto?.preco || ''}" />
          </div>
          <div class="form-group">
            <label>Disponível?</label>
            <select name="disponivel">
              <option value="true" ${produto?.disponivel !== false ? 'selected' : ''}>Sim (Ativo)</option>
              <option value="false" ${produto?.disponivel === false ? 'selected' : ''}>Não (Oculto)</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Salvar Produto</button>
          <button type="button" id="btn-cancelar-produto" class="btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>
  `;

    formEl.querySelector('#btn-cancelar-produto').addEventListener('click', () => {
        formEl.classList.add('hidden');
        formEl.innerHTML = '';
    });

    formEl.querySelector('#form-produto').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        // Precisaria da Rota /api/produtos POST/PUT - Assumindo que a Rota original funciona (comercioId atrelado)
        // No projeto antigo era POST /api/produtos {comercioId, nome, preco, descricao}
        const body = {
            comercioId: ctx.activeStoreId,
            nome: f.nome.value,
            descricao: f.descricao.value,
            preco: parseFloat(f.preco.value),
            disponivel: f.disponivel.value === 'true'
        };

        try {
            const url = produto ? `/api/produtos/${produto.id}` : '/api/produtos';
            const method = produto ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method, credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': ctx.csrfToken },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                formEl.classList.add('hidden');
                formEl.innerHTML = '';
                carregarProdutos(container, ctx);
            } else {
                const d = await res.json();
                alert(d.error || 'Erro ao salvar produto');
            }
        } catch { alert('Erro de rede'); }
    });
}

function formatMoney(val) {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function unmount() {
    _cleanup.forEach(fn => fn());
    _cleanup = [];
}
