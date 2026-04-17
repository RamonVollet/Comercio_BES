// ===========================================
// InicioSection.js — Seção de boas-vindas
// Comum a todos os roles (admin, comerciante, cliente)
// ===========================================

let _cleanup = [];

/**
 * @param {HTMLElement} container
 * @param {{user: {nome:string, role:string}, capabilities:string[], stores:Array, activeStoreId:number|null, csrfToken:string}} ctx
 */
export function mount(container, ctx) {
  _cleanup = [];

  const { user, capabilities, stores } = ctx;

  const SVG = {
    crown: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 4h20M4 4l2 16h12l2-16M12 4v16"/></svg>`,
    store: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
    bag: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>`,
    users: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>`,
    list: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
    settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    box: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
    receipt: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="16" y1="14" x2="8" y2="14"/><line x1="16" y1="10" x2="8" y2="10"/></svg>`,
    truck: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    dollar: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    mapPin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    creditCard: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
    mail: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    cornerUpLeft: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`
  };

  const roleConfig = {
    admin: {
      emoji: SVG.crown,
      titulo: 'Painel de Administração',
      descricao: 'Gerencie usuários, lojas, pedidos e configurações globais do marketplace.',
      cor: '#7C3AED',
      items: [
        { icon: SVG.users, label: 'Usuários', path: '/minha-conta/usuarios', cap: 'users.manage' },
        { icon: SVG.shield, label: 'Moderar Lojas', path: '/minha-conta/moderacao', cap: 'stores.moderate' },
        { icon: SVG.list, label: 'Logs', path: '/minha-conta/logs', cap: 'logs.read' },
        { icon: SVG.settings, label: 'Configurações', path: '/minha-conta/configuracoes', cap: 'integrations.manage' },
      ],
    },
    comerciante: {
      emoji: SVG.store,
      titulo: 'Painel do Lojista',
      descricao: stores.length > 1
        ? `Você gerencia ${stores.length} lojas. Use o seletor no topo para alternar.`
        : 'Gerencie seus produtos, pedidos e recebíveis.',
      cor: '#047857',
      items: [
        { icon: SVG.box, label: 'Produtos', path: '/minha-conta/produtos', cap: 'products.manage.own' },
        { icon: SVG.receipt, label: 'Pedidos', path: '/minha-conta/pedidos-loja', cap: 'orders.view.ownStore' },
        { icon: SVG.truck, label: 'Frete', path: '/minha-conta/frete', cap: 'shipping.manage.ownStore' },
        { icon: SVG.dollar, label: 'Recebíveis', path: '/minha-conta/recebiveis', cap: 'payouts.view.ownStore' },
      ],
    },
    cliente: {
      emoji: SVG.bag,
      titulo: 'Minha Conta',
      descricao: 'Acompanhe seus pedidos, endereços e dados de pagamento.',
      cor: '#2563EB',
      items: [
        { icon: SVG.bag, label: 'Meus Pedidos', path: '/minha-conta/historico', cap: 'orders.view.own' },
        { icon: SVG.mapPin, label: 'Rastreio', path: '/minha-conta/rastreio', cap: 'orders.view.own' },
        { icon: SVG.mail, label: 'Endereços', path: '/minha-conta/enderecos', cap: 'addresses.manage.own' },
        { icon: SVG.creditCard, label: 'Pagamentos', path: '/minha-conta/pagamentos', cap: 'payments.manage.own' },
      ],
    },
  };

  const config = roleConfig[user.role] || roleConfig.cliente;

  // Filtra ítens que o usuário realmente tem capability
  const acessiveis = config.items.filter(item => capabilities.includes(item.cap));

  container.innerHTML = `
    <section class="inicio-section">
      <div class="inicio-header card" style="border-left: 4px solid ${config.cor}">
        <div class="inicio-greeting">
          <span class="inicio-emoji">${config.emoji}</span>
          <div>
            <h2 class="inicio-titulo">Olá, ${user.nome.split(' ')[0]}!</h2>
            <p class="inicio-subtitulo">${config.titulo}</p>
          </div>
        </div>
        <p class="inicio-descricao">${config.descricao}</p>
      </div>

      ${acessiveis.length > 0 ? `
      <h3 class="inicio-secao-titulo">Acesso rápido</h3>
      <div class="inicio-grid">
        ${acessiveis.map(item => `
          <a href="${item.path}" class="inicio-card" data-path="${item.path}">
            <span class="inicio-card-icon">${item.icon}</span>
            <span class="inicio-card-label">${item.label}</span>
            <span class="inicio-card-arrow">→</span>
          </a>
        `).join('')}
      </div>
      ` : ''}
    </section>

    <style>
      .inicio-section { max-width: 700px; }

      .inicio-header {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 24px;
        padding: 24px;
      }
      .inicio-greeting {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .inicio-emoji { font-size: 2.2rem; }
      .inicio-titulo {
        font-family: var(--font-display);
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text);
        margin: 0;
      }
      .inicio-subtitulo {
        font-size: 0.82rem;
        color: var(--text-muted);
        margin: 0;
      }
      .inicio-descricao {
        font-size: 0.9rem;
        color: var(--text-muted);
        line-height: 1.6;
      }
      .inicio-secao-titulo {
        font-size: 0.78rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: .06em;
        color: var(--text-muted);
        margin-bottom: 12px;
      }
      .inicio-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 12px;
      }
      .inicio-card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 18px 16px;
        text-decoration: none;
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
        position: relative;
      }
      .inicio-card:hover,
      .inicio-card:focus-visible {
        border-color: var(--accent);
        box-shadow: 0 0 0 2px var(--accent-bg), var(--shadow-md);
        transform: translateY(-2px);
        outline: none;
      }
      .inicio-card-icon { font-size: 1.5rem; }
      .inicio-card-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text);
      }
      .inicio-card-arrow {
        position: absolute;
        top: 50%;
        right: 14px;
        transform: translateY(-50%);
        font-size: 1rem;
        color: var(--text-muted);
        transition: right 0.15s;
      }
      .inicio-card:hover .inicio-card-arrow { right: 10px; }
    </style>
  `;

  // Delegação de eventos nos cards de acesso rápido
  const handleCardClick = (e) => {
    const card = e.target.closest('.inicio-card[data-path]');
    if (!card) return;
    e.preventDefault();
    // Dispara navegação interna via popstate / pushState
    window.dispatchEvent(new CustomEvent('spa:navigate', { detail: { path: card.dataset.path } }));
  };

  container.addEventListener('click', handleCardClick);
  _cleanup.push(() => container.removeEventListener('click', handleCardClick));

  // Ouvir evento de navegação customizado
  const handleNav = (e) => {
    if (e.detail?.path) {
      history.pushState({ path: e.detail.path }, '', e.detail.path);
      window.dispatchEvent(new PopStateEvent('popstate', { state: { path: e.detail.path } }));
    }
  };
  window.addEventListener('spa:navigate', handleNav);
  _cleanup.push(() => window.removeEventListener('spa:navigate', handleNav));
}

export function unmount() {
  _cleanup.forEach(fn => fn());
  _cleanup = [];
}
