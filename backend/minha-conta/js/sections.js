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

const ICONS = {
    home: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    user: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    users: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>`,
    settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    list: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
    box: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
    archive: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
    receipt: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="16" y1="14" x2="8" y2="14"/><line x1="16" y1="10" x2="8" y2="10"/></svg>`,
    truck: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    dollar: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    bag: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    mapPin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    creditCard: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
    mail: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    cornerUpLeft: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`
};

/** @type {Section[]} */
export const sections = [
    // ---- Comum (todos os roles) ----
    {
        key: 'inicio',
        path: '/minha-conta',
        roles: ['admin', 'comerciante', 'cliente'],
        label: 'Início',
        icon: ICONS.home,
        load: '/minha-conta/js/sections/common/InicioSection.js',
    },
    {
        key: 'perfil',
        path: '/minha-conta/perfil',
        roles: ['admin', 'comerciante', 'cliente'],
        label: 'Meu Perfil',
        icon: ICONS.user,
        load: '/minha-conta/js/sections/common/PerfilSection.js',
    },

    // ---- Admin ----
    {
        key: 'usuarios',
        path: '/minha-conta/usuarios',
        roles: ['admin'],
        label: 'Usuários',
        icon: ICONS.users,
        load: '/minha-conta/js/sections/admin/UsuariosSection.js',
    },
    {
        key: 'moderacao',
        path: '/minha-conta/moderacao',
        roles: ['admin'],
        label: 'Moderação de Lojas',
        icon: ICONS.shield,
        load: '/minha-conta/js/sections/admin/ModeracaoLojasSection.js',
    },
    {
        key: 'configuracoes',
        path: '/minha-conta/configuracoes',
        roles: ['admin'],
        label: 'Configurações',
        icon: ICONS.settings,
        load: '/minha-conta/js/sections/admin/ConfiguracoesSection.js',
    },
    {
        key: 'logs',
        path: '/minha-conta/logs',
        roles: ['admin'],
        label: 'Logs',
        icon: ICONS.list,
        load: '/minha-conta/js/sections/admin/LogsSection.js',
    },

    // ---- Comerciante ----
    {
        key: 'produtos',
        path: '/minha-conta/produtos',
        roles: ['comerciante'],
        label: 'Produtos',
        icon: ICONS.box,
        load: '/minha-conta/js/sections/merchant/ProdutosSection.js',
    },
    {
        key: 'estoque',
        path: '/minha-conta/estoque',
        roles: ['comerciante'],
        label: 'Estoque',
        icon: ICONS.archive,
        load: '/minha-conta/js/sections/merchant/EstoqueSection.js',
    },
    {
        key: 'pedidos-loja',
        path: '/minha-conta/pedidos-loja',
        roles: ['comerciante'],
        label: 'Pedidos',
        icon: ICONS.receipt,
        load: '/minha-conta/js/sections/merchant/PedidosSection.js',
    },
    {
        key: 'frete',
        path: '/minha-conta/frete',
        roles: ['comerciante'],
        label: 'Frete',
        icon: ICONS.truck,
        load: '/minha-conta/js/sections/merchant/FreteSection.js',
    },
    {
        key: 'recebiveis',
        path: '/minha-conta/recebiveis',
        roles: ['comerciante'],
        label: 'Recebíveis',
        icon: ICONS.dollar,
        load: '/minha-conta/js/sections/merchant/RecebiveisSection.js',
    },

    // ---- Cliente ----
    {
        key: 'historico',
        path: '/minha-conta/historico',
        roles: ['cliente'],
        label: 'Meus Pedidos',
        icon: ICONS.bag,
        load: '/minha-conta/js/sections/customer/HistoricoSection.js',
    },
    {
        key: 'rastreio',
        path: '/minha-conta/rastreio',
        roles: ['cliente'],
        label: 'Rastreio',
        icon: ICONS.mapPin,
        load: '/minha-conta/js/sections/customer/RastreioSection.js',
    },
    {
        key: 'pagamentos',
        path: '/minha-conta/pagamentos',
        roles: ['cliente'],
        label: 'Pagamentos',
        icon: ICONS.creditCard,
        load: '/minha-conta/js/sections/customer/PagamentosSection.js',
    },
    {
        key: 'enderecos',
        path: '/minha-conta/enderecos',
        roles: ['cliente'],
        label: 'Endereços',
        icon: ICONS.mail,
        load: '/minha-conta/js/sections/customer/EnderecosSection.js',
    },
    {
        key: 'devolucoes',
        path: '/minha-conta/devolucoes',
        roles: ['cliente'],
        label: 'Devoluções',
        icon: ICONS.cornerUpLeft,
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
 * Verifica se o usuário tem acesso à seção com base no role dele.
 * @param {string[]} sectionRoles - roles aceitos pela seção
 * @param {string} role - role do usuário (vindo de ctx.user.tipo via /api/auth/me)
 * @returns {boolean}
 */
function hasAccess(sectionRoles, role) {
    return sectionRoles.includes(role);
}

/**
 * Resolve a seção ativa pela URL do pathname.
 * Retorna null se não encontrada ou sem permissão.
 * @param {string} pathname
 * @param {string} role
 * @returns {Section|null}
 */
export function resolveSection(pathname, role) {
    // Ordena as definições pela URL mais longa primeiro para evitar que '/minha-conta' (curto) 
    // capture '/minha-conta/perfil' (longo) erroneamente no startsWith
    const ordSections = [...sections].sort((a, b) => b.path.length - a.path.length);

    // Match exato ou prefixo (e.g. /minha-conta/produtos/123)
    const section = ordSections.find(
        (s) => pathname === s.path || pathname.startsWith(s.path + '/')
    );
    if (!section) return null;
    return hasAccess(section.roles, role) ? section : null;
}

/**
 * Retorna as seções visíveis no menu para o role atual.
 * @param {string} role
 * @returns {Section[]}
 */
export function getMenuByRole(role) {
    return sections.filter((s) => hasAccess(s.roles, role));
}
