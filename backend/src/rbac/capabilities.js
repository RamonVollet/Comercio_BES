// ===========================================
// RBAC - Capabilities por Role
// Single source of truth: backend + /api/auth/me
// ===========================================

/** @type {Record<string, string[]>} */
const ROLE_CAPABILITIES = {
  admin: [
    'account.view',
    'users.manage',
    'stores.moderate',
    'orders.view.global',
    'logs.read',
    'integrations.manage',
  ],
  comerciante: [
    'account.view',
    'account.view.store',
    'stores.manage.own',
    'products.manage.own',
    'orders.view.ownStore',
    'shipping.manage.ownStore',
    'payouts.view.ownStore',
  ],
  cliente: [
    'account.view',
    'orders.view.own',
    'payments.manage.own',
    'addresses.manage.own',
    'returns.manage.own',
  ],
};

/**
 * Retorna array de capabilities para um tipo/role de usuário.
 * @param {string} tipo - 'admin' | 'comerciante' | 'cliente'
 * @returns {string[]}
 */
function getCapabilities(tipo) {
  return ROLE_CAPABILITIES[tipo] || [];
}

/**
 * Verifica se um tipo possui uma capability específica.
 * @param {string} tipo
 * @param {string} cap
 * @returns {boolean}
 */
function hasCapability(tipo, cap) {
  return getCapabilities(tipo).includes(cap);
}

module.exports = { ROLE_CAPABILITIES, getCapabilities, hasCapability };
