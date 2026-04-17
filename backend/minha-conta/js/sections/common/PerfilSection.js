// =====================================================
// PerfilSection.js — Perfil do usuário (todos os roles)
// =====================================================

let _cleanup = [];

export function mount(container, ctx) {
    _cleanup = [];
    const { user } = ctx;

    container.innerHTML = `
    <section class="perfil-section">
      <div class="section-header">
        <h2 class="section-title">👤 Meu Perfil</h2>
        <p class="section-subtitle">Atualize seus dados pessoais</p>
      </div>

      <div id="perfil-feedback" class="feedback-box hidden"></div>

      <div class="card perfil-card">
        <div class="avatar-row">
          <div class="avatar-circle" id="perfil-avatar-preview">${user.nome.charAt(0).toUpperCase()}</div>
          <div>
            <p class="avatar-name">${user.nome}</p>
            <p class="avatar-role">${{ admin: 'Administrador', comerciante: 'Comerciante', cliente: 'Cliente' }[user.role] || user.role}</p>
          </div>
        </div>

        <form id="perfil-form" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label for="perfil-nome">Nome completo</label>
              <input type="text" id="perfil-nome" name="nome" autocomplete="name" />
            </div>
            <div class="form-group">
              <label for="perfil-telefone">Telefone</label>
              <input type="tel" id="perfil-telefone" name="telefone" autocomplete="tel" />
            </div>
          </div>

          <div class="form-section-title">Alterar senha <span class="optional">(opcional)</span></div>
          <div class="form-row">
            <div class="form-group">
              <label for="perfil-senha-atual">Senha atual</label>
              <input type="password" id="perfil-senha-atual" name="senhaAtual" autocomplete="current-password" />
            </div>
            <div class="form-group">
              <label for="perfil-nova-senha">Nova senha</label>
              <input type="password" id="perfil-nova-senha" name="novaSenha" autocomplete="new-password" />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" id="perfil-submit">Salvar alterações</button>
          </div>
        </form>
      </div>

      <div class="card" style="margin-top:16px">
        <p class="info-label">E-mail (não editável)</p>
        <p class="info-value">${user.email}</p>
      </div>
    </section>

    <style>
      .perfil-section { max-width: 620px; }
      .section-header { margin-bottom: 20px; }
      .section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin: 0 0 4px; }
      .section-subtitle { color: var(--text-muted); font-size: .875rem; margin: 0; }

      .feedback-box { padding: 12px 16px; border-radius: var(--radius-sm); font-size: .875rem; margin-bottom: 16px; }
      .feedback-box.success { background: var(--accent-bg); color: var(--accent); border: 1px solid #a7f3d0; }
      .feedback-box.error   { background: #fef2f2; color: var(--danger); border: 1px solid #fecaca; }
      .feedback-box.hidden  { display: none; }

      .perfil-card { padding: 24px; }
      .avatar-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
      .avatar-circle { width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .avatar-name { font-weight: 600; font-size: .95rem; margin: 0 0 2px; }
      .avatar-role { font-size: .8rem; color: var(--text-muted); margin: 0; }

      .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
      @media (max-width: 540px) { .form-row { grid-template-columns: 1fr; } }
      .form-group { display: flex; flex-direction: column; gap: 6px; }
      .form-group label { font-size: .82rem; font-weight: 600; color: var(--text-muted); }
      .form-group input { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 9px 12px; font-size: .875rem; font-family: var(--font-body); outline: none; transition: border-color .15s; }
      .form-group input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-bg); }
      .form-section-title { font-size: .78rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin: 8px 0 12px; }
      .optional { font-weight: 400; text-transform: none; letter-spacing: 0; }
      .form-actions { margin-top: 20px; }
      .btn-primary { background: var(--accent); color: #fff; border: none; padding: 10px 22px; border-radius: var(--radius-sm); font-size: .875rem; font-weight: 600; cursor: pointer; transition: background .15s, transform .1s; }
      .btn-primary:hover { background: var(--accent-dark); }
      .btn-primary:active { transform: scale(.97); }
      .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
      .info-label { font-size: .78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; margin: 0 0 4px; }
      .info-value  { font-size: .9rem; color: var(--text); margin: 0; }
    </style>
  `;

    // Carrega dados atuais
    loadPerfil(container, ctx);

    const form = container.querySelector('#perfil-form');
    const handler = (e) => submitPerfil(e, container, ctx);
    form.addEventListener('submit', handler);
    _cleanup.push(() => form.removeEventListener('submit', handler));
}

async function loadPerfil(container, ctx) {
    try {
        const res = await fetch('/api/auth/perfil', {
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const nomeEl = container.querySelector('#perfil-nome');
        const telEl = container.querySelector('#perfil-telefone');
        if (nomeEl) nomeEl.value = data.nome || '';
        if (telEl) telEl.value = data.telefone || '';
    } catch { /* sem rede — campos ficam em branco */ }
}

async function submitPerfil(e, container, ctx) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('#perfil-submit');
    const feedback = container.querySelector('#perfil-feedback');

    const body = {
        nome: form.nome.value.trim(),
        telefone: form.telefone.value.trim() || undefined,
        senhaAtual: form.senhaAtual.value || undefined,
        novaSenha: form.novaSenha.value || undefined,
    };

    btn.disabled = true;
    btn.textContent = 'Salvando...';
    hideFeedback(feedback);

    try {
        const res = await fetch('/api/auth/perfil', {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': ctx.csrfToken,
                'Authorization': `Bearer ${getToken()}`,
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (res.ok) {
            showFeedback(feedback, '✅ Perfil atualizado com sucesso!', 'success');
            form.senhaAtual.value = '';
            form.novaSenha.value = '';
            // Atualiza avatar
            const av = container.querySelector('#perfil-avatar-preview');
            if (av && data.user?.nome) av.textContent = data.user.nome.charAt(0).toUpperCase();
        } else {
            showFeedback(feedback, `❌ ${data.error || 'Erro ao salvar'}`, 'error');
        }
    } catch {
        showFeedback(feedback, '❌ Erro de rede. Tente novamente.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar alterações';
    }
}

function showFeedback(el, msg, type) {
    el.textContent = msg;
    el.className = `feedback-box ${type}`;
}
function hideFeedback(el) { el.className = 'feedback-box hidden'; }
function getToken() {
    return document.cookie.split(';').find(c => c.trim().startsWith('access_token='))?.split('=')[1] || '';
}

export function unmount() {
    _cleanup.forEach(fn => fn());
    _cleanup = [];
}
