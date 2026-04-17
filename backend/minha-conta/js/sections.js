// ===========================================
// sections.js — Single Source of Truth das Seções
// Minha Conta / RBAC
// ===========================================

/**
 * @typedef {{
 *   key: string,
 *   path: string,
 *   roles: string[],
 *   label: string,
 *   icon: string,
 *   load: string
 * }} Section
 */

/** @type {Section[]} */
export const sections = [
    // ---- Comum (todos os roles) ----
    {
        key: 'inicio',
        path: '/minha-conta',
        roles: ['admin', 'comerciante', 'cliente'],
        label: 'Início',
        icon: '🏠',
        load: '/minha-conta/js/sections/common/InicioSection.js',
    },
    {
        key: 'perfil',
        path: '/minha-conta/perfil',
        roles: ['admin', 'comerciante', 'cliente'],
        label: 'Meu Perfil',
        icon: '👤',
        load: '/minha-conta/js/sections/common/PerfilSection.js',
    },

    // ---- Admin ----
    {
        key: 'usuarios',
        path: '/minha-conta/usuarios',
        roles: ['admin'],
        label: 'Usuários',
        icon: '👥',
        load: '/minha-conta/js/sections/admin/UsuariosSection.js',
    },
    {
        key: 'moderacao',
        path: '/minha-conta/moderacao',
        roles: ['admin'],
        label: 'Moderação de Lojas',
        icon: '🛡️',
        load: '/minha-conta/js/sections/admin/ModeracaoLojasSection.js',
    },
    {
        key: 'configuracoes',
        path: '/minha-conta/configuracoes',
        roles: ['admin'],
        label: 'Configurações',
        icon: '⚙️',
        load: '/minha-conta/js/sections/admin/ConfiguracoesSection.js',
    },
    {
        key: 'logs',
        path: '/minha-conta/logs',
        roles: ['admin'],
        label: 'Logs',
        icon: '📋',
        load: '/minha-conta/js/sections/admin/LogsSection.js',
    },

    // ---- Comerciante ----
    {
        key: 'produtos',
        path: '/minha-conta/produtos',
        roles: ['comerciante'],
        label: 'Produtos',
        icon: '📦',
        load: '/minha-conta/js/sections/merchant/ProdutosSection.js',
    },
    {
        key: 'estoque',
        path: '/minha-conta/estoque',
        roles: ['comerciante'],
        label: 'Estoque',
        icon: '🗃️',
        load: '/minha-conta/js/sections/merchant/EstoqueSection.js',
    },
    {
        key: 'pedidos-loja',
        path: '/minha-conta/pedidos-loja',
        roles: ['comerciante'],
        label: 'Pedidos',
        icon: '🧾',
        load: '/minha-conta/js/sections/merchant/PedidosSection.js',
    },
    {
        key: 'frete',
        path: '/minha-conta/frete',
        roles: ['comerciante'],
        label: 'Frete',
        icon: '🚚',
        load: '/minha-conta/js/sections/merchant/FreteSection.js',
    },
    {
        key: 'recebiveis',
        path: '/minha-conta/recebiveis',
        roles: ['comerciante'],
        label: 'Recebíveis',
        icon: '💰',
        load: '/minha-conta/js/sections/merchant/RecebiveisSection.js',
    },

    // ---- Cliente ----
    {
        key: 'historico',
        path: '/minha-conta/historico',
        roles: ['cliente'],
        label: 'Meus Pedidos',
        icon: '🛍️',
        load: '/minha-conta/js/sections/customer/HistoricoSection.js',
    },
    {
        key: 'rastreio',
        path: '/minha-conta/rastreio',
        roles: ['cliente'],
        label: 'Rastreio',
        icon: '📍',
        load: '/minha-conta/js/sections/customer/RastreioSection.js',
    },
    {
        key: 'pagamentos',
        path: '/minha-conta/pagamentos',
        roles: ['cliente'],
        label: 'Pagamentos',
        icon: '💳',
        load: '/minha-conta/js/sections/customer/PagamentosSection.js',
    },
    {
        key: 'enderecos',
        path: '/minha-conta/enderecos',
        roles: ['cliente'],
        label: 'Endereços',
        icon: '📬',
        load: '/minha-conta/js/sections/customer/EnderecosSection.js',
    },
    {
        key: 'devolucoes',
        path: '/minha-conta/devolucoes',
        roles: ['cliente'],
        label: 'Devoluções',
        icon: '↩️',
        load: '/minha-conta/js/sections/customer/DevolucoesSection.js',
    },
];

/**
 * Mapeamento de capability → roles com acesso
 * (derivado de capabilities.js do backend)
 */
const CAP_TO_ROLES = {
    'account.view': ['admin', 'comerciante', 'cliente'],
    'account.view.store': ['comerciante'],
    'users.manage': ['admin'],
    'stores.moderate': ['admin'],
    'stores.manage.own': ['comerciante'],
    'products.manage.own': ['comerciante'],
    'orders.view.global': ['admin'],
    'orders.view.ownStore': ['comerciante'],
    'orders.view.own': ['cliente'],
    'shipping.manage.ownStore': ['comerciante'],
    'payouts.view.ownStore': ['comerciante'],
    'payments.manage.own': ['cliente'],
    'addresses.manage.own': ['cliente'],
    'returns.manage.own': ['cliente'],
    'logs.read': ['admin'],
    'integrations.manage': ['admin'],
};

/**
 * Verifica se o usuário tem acesso à seção com base nas capabilities.
 * @param {string[]} sectionRoles - roles aceitos pela seção
 * @param {string[]} capabilities - capabilities do usuário (vindas de /api/auth/me)
 * @returns {boolean}
 */
function hasAccess(sectionRoles, capabilities) {
    // Verificar se alguma capability do usuário implica em um dos roles da seção
    return capabilities.some((cap) => {
        const capRoles = CAP_TO_ROLES[cap] || [];
        return capRoles.some((r) => sectionRoles.includes(r));
    });
}

/**
 * Resolve a seção ativa pela URL do pathname.
 * Retorna null se não encontrada ou sem permissão.
 * @param {string} pathname
 * @param {string[]} capabilities
 * @returns {Section|null}
 */
export function resolveSection(pathname, capabilities) {
    // Match exato ou prefixo (e.g. /minha-conta/produtos/123)
    const section = sections.find(
        (s) => pathname === s.path || pathname.startsWith(s.path + '/')
    );
    if (!section) return null;
    return hasAccess(section.roles, capabilities) ? section : null;
}

/**
 * Retorna as seções visíveis no menu para as capabilities dadas.
 * @param {string[]} capabilities
 * @returns {Section[]}
 */
export function getMenuByCapabilities(capabilities) {
    return sections.filter((s) => hasAccess(s.roles, capabilities));
}
