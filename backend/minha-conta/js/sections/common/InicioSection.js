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

    const roleConfig = {
        admin: {
            emoji: '👑',
            titulo: 'Painel de Administração',
            descricao: 'Gerencie usuários, lojas, pedidos e configurações globais do marketplace.',
            cor: '#7C3AED',
            items: [
                { icon: '👥', label: 'Usuários', path: '/minha-conta/usuarios', cap: 'users.manage' },
                { icon: '🛡️', label: 'Moderar Lojas', path: '/minha-conta/moderacao', cap: 'stores.moderate' },
                { icon: '📋', label: 'Logs', path: '/minha-conta/logs', cap: 'logs.read' },
                { icon: '⚙️', label: 'Configurações', path: '/minha-conta/configuracoes', cap: 'integrations.manage' },
            ],
        },
        comerciante: {
            emoji: '🏪',
            titulo: 'Painel do Lojista',
            descricao: stores.length > 1
                ? `Você gerencia ${stores.length} lojas. Use o seletor no topo para alternar.`
                : 'Gerencie seus produtos, pedidos e recebíveis.',
            cor: '#047857',
            items: [
                { icon: '📦', label: 'Produtos', path: '/minha-conta/produtos', cap: 'products.manage.own' },
                { icon: '🧾', label: 'Pedidos', path: '/minha-conta/pedidos-loja', cap: 'orders.view.ownStore' },
                { icon: '🚚', label: 'Frete', path: '/minha-conta/frete', cap: 'shipping.manage.ownStore' },
                { icon: '💰', label: 'Recebíveis', path: '/minha-conta/recebiveis', cap: 'payouts.view.ownStore' },
            ],
        },
        cliente: {
            emoji: '🛍️',
            titulo: 'Minha Conta',
            descricao: 'Acompanhe seus pedidos, endereços e dados de pagamento.',
            cor: '#2563EB',
            items: [
                { icon: '📦', label: 'Meus Pedidos', path: '/minha-conta/historico', cap: 'orders.view.own' },
                { icon: '📍', label: 'Rastreio', path: '/minha-conta/rastreio', cap: 'orders.view.own' },
                { icon: '📬', label: 'Endereços', path: '/minha-conta/enderecos', cap: 'addresses.manage.own' },
                { icon: '💳', label: 'Pagamentos', path: '/minha-conta/pagamentos', cap: 'payments.manage.own' },
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
