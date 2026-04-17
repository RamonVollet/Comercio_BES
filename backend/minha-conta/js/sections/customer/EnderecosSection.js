// =====================================================
// EnderecosSection.js — Gerenciamento de endereços (cliente)
// =====================================================

let _cleanup = [];

export function mount(container, ctx) {
    _cleanup = [];

    container.innerHTML = `
    <section class="enderecos-section">
      <div class="section-header-row">
        <div>
          <h2 class="section-title">📬 Endereços de Entrega</h2>
          <p class="section-subtitle">Gerencie seus endereços salvos</p>
        </div>
        <button id="btn-novo-endereco" class="btn-primary">+ Novo endereço</button>
      </div>

      <div id="endereco-form-container" class="hidden"></div>

      <div id="enderecos-list">
        <div class="content-loading"><div class="spinner"></div></div>
      </div>
    </section>

    <style>
      .enderecos-section { max-width: 700px; }
      .section-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }
      .btn-primary { background: var(--accent); color: #fff; border: none; padding: 9px 18px; border-radius: var(--radius-sm); font-size: .875rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background .15s; }
      .btn-primary:hover { background: var(--accent-dark); }

      .endereco-form-card { background: var(--surface); border: 1px solid var(--accent); border-radius: var(--radius-md); padding: 20px; margin-bottom: 16px; }
      .endereco-form-card h3 { font-size: .95rem; font-weight: 700; margin: 0 0 16px; }
      .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      @media (max-width: 540px) { .form-grid { grid-template-columns: 1fr; } }
      .form-group { display: flex; flex-direction: column; gap: 5px; }
      .form-group.span2 { grid-column: span 2; }
      @media (max-width: 540px) { .form-group.span2 { grid-column: span 1; } }
      .form-group label { font-size: .78rem; font-weight: 600; color: var(--text-muted); }
      .form-group input[type="text"], .form-group input[type="tel"] { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 11px; font-size: .875rem; outline: none; transition: border-color .15s; }
      .form-group input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-bg); }
      .form-check { display: flex; align-items: center; gap: 8px; font-size: .875rem; }
      .form-actions { display: flex; gap: 10px; margin-top: 16px; }
      .btn-secondary { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 8px 16px; border-radius: var(--radius-sm); font-size: .875rem; cursor: pointer; }

      .enderecos-list { display: flex; flex-direction: column; gap: 10px; }
      .endereco-card { display: flex; justify-content: space-between; align-items: flex-start; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; gap: 12px; }
      .endereco-card.principal-card { border-color: var(--accent); }
      .endereco-body { flex: 1; }
      .endereco-apelido { font-weight: 700; font-size: .9rem; margin: 0 0 4px; display: flex; align-items: center; gap: 8px; }
      .badge-principal { font-size: .7rem; background: var(--accent-bg); color: var(--accent); padding: 2px 8px; border-radius: 999px; font-weight: 600; }
      .endereco-linha { font-size: .83rem; color: var(--text-muted); margin: 0; line-height: 1.5; }
      .endereco-acoes { display: flex; flex-direction: column; gap: 6px; }
      .btn-link { background: none; border: none; color: var(--accent); font-size: .78rem; cursor: pointer; text-align: right; padding: 0; }
      .btn-link.danger { color: var(--danger); }
    </style>
  `;

    carregarEnderecos(container, ctx);

    const btnNovo = container.querySelector('#btn-novo-endereco');
    const onNovo = () => mostrarFormulario(container, ctx, null);
    btnNovo.addEventListener('click', onNovo);
    _cleanup.push(() => btnNovo.removeEventListener('click', onNovo));
}

async function carregarEnderecos(container, ctx) {
    const el = container.querySelector('#enderecos-list');
    try {
        const res = await fetch('/api/auth/enderecos', { credentials: 'include' });
        if (!res.ok) throw new Error();
        const enderecos = await res.json();

        if (!enderecos.length) {
            el.innerHTML = `<div class="section-empty"><h2>Nenhum endereço salvo</h2><p>Adicione um endereço de entrega.</p></div>`;
            return;
        }

        el.innerHTML = `<div class="enderecos-list">${enderecos.map(e => renderEnderecoCard(e)).join('')}</div>`;

        el.querySelectorAll('.btn-excluir[data-id]').forEach(btn => {
            btn.addEventListener('click', () => excluirEndereco(Number(btn.dataset.id), container, ctx));
        });
    } catch {
        el.innerHTML = '<div class="section-error"><h2>Erro ao carregar endereços</h2></div>';
    }
}

function renderEnderecoCard(e) {
    return `
    <div class="endereco-card ${e.principal ? 'principal-card' : ''}" data-id="${e.id}">
      <div class="endereco-body">
        <p class="endereco-apelido">
          ${e.apelido}
          ${e.principal ? '<span class="badge-principal">Principal</span>' : ''}
        </p>
        <p class="endereco-linha">${e.rua}, ${e.numero}${e.complemento ? ` ${e.complemento}` : ''}</p>
        <p class="endereco-linha">${e.bairro} · ${e.cidade}/${e.estado} · CEP ${formatCEP(e.cep)}</p>
      </div>
      <div class="endereco-acoes">
        <button class="btn-link btn-excluir" data-id="${e.id}">Excluir</button>
      </div>
    </div>`;
}

function mostrarFormulario(container, ctx, endereco) {
    const formEl = container.querySelector('#endereco-form-container');
    formEl.classList.remove('hidden');
    formEl.innerHTML = `
    <div class="endereco-form-card">
      <h3>Novo endereço</h3>
      <form id="form-endereco">
        <div class="form-grid">
          <div class="form-group"><label>Apelido</label><input type="text" name="apelido" placeholder="Casa, Trabalho..." /></div>
          <div class="form-group"><label>CEP</label><input type="text" name="cep" maxlength="9" placeholder="00000-000" /></div>
          <div class="form-group span2"><label>Rua *</label><input type="text" name="rua" required /></div>
          <div class="form-group"><label>Número *</label><input type="text" name="numero" required /></div>
          <div class="form-group"><label>Complemento</label><input type="text" name="complemento" /></div>
          <div class="form-group"><label>Bairro *</label><input type="text" name="bairro" required /></div>
          <div class="form-group"><label>Cidade</label><input type="text" name="cidade" value="Boa Esperança do Sul" /></div>
          <div class="form-group"><label>Estado</label><input type="text" name="estado" value="SP" maxlength="2" /></div>
        </div>
        <label class="form-check" style="margin-top:12px">
          <input type="checkbox" name="principal" /> Definir como endereço principal
        </label>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Salvar</button>
          <button type="button" id="btn-cancelar-form" class="btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>`;

    formEl.querySelector('#btn-cancelar-form').addEventListener('click', () => {
        formEl.classList.add('hidden');
        formEl.innerHTML = '';
    });

    formEl.querySelector('#form-endereco').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const body = {
            apelido: f.apelido.value.trim() || 'Casa',
            cep: f.cep.value.replace(/\D/g, ''),
            rua: f.rua.value.trim(),
            numero: f.numero.value.trim(),
            complemento: f.complemento.value.trim() || undefined,
            bairro: f.bairro.value.trim(),
            cidade: f.cidade.value.trim(),
            estado: f.estado.value.trim().toUpperCase(),
            principal: f.principal.checked,
        };
        try {
            const res = await fetch('/api/auth/enderecos', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': ctx.csrfToken },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                formEl.classList.add('hidden');
                formEl.innerHTML = '';
                carregarEnderecos(container, ctx);
            } else {
                const d = await res.json();
                alert(d.error || 'Erro ao salvar');
            }
        } catch { alert('Erro de rede.'); }
    });
}

async function excluirEndereco(id, container, ctx) {
    if (!confirm('Excluir este endereço?')) return;
    try {
        const res = await fetch(`/api/auth/enderecos/${id}`, {
            method: 'DELETE', credentials: 'include',
            headers: { 'X-CSRF-Token': ctx.csrfToken },
        });
        if (res.ok) carregarEnderecos(container, ctx);
        else { const d = await res.json(); alert(d.error || 'Erro ao excluir'); }
    } catch { alert('Erro de rede.'); }
}

function formatCEP(cep) {
    return cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

export function unmount() {
    _cleanup.forEach(fn => fn());
    _cleanup = [];
}
