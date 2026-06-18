// ===========================================
// Fallback Auth - somente para homologacao sem banco
// ===========================================
const ENABLED = process.env.AUTH_FALLBACK_ENABLED === 'true';

const fallbackUsers = [
  {
    id: 9001,
    nome: 'Administrador Demo',
    email: 'admin@comerciobes.com',
    senha: 'admin123',
    tipo: 'admin',
    stores: []
  },
  {
    id: 9002,
    nome: 'Lojista Demo',
    email: 'lojista@comerciobes.com',
    senha: 'lojista123',
    tipo: 'comerciante',
    nomeFantasia: 'Loja Demo',
    stores: [{ id: 9001, nome: 'Loja Demo', slug: 'aquaflora-groshop' }]
  },
  {
    id: 9003,
    nome: 'Comerciante Demo',
    email: 'comerciante@demo.com',
    senha: 'demo123',
    tipo: 'comerciante',
    nomeFantasia: 'Comerciante Demo',
    stores: [{ id: 9001, nome: 'Loja Demo', slug: 'aquaflora-groshop' }]
  }
];

function isFallbackAuthEnabled() {
  return ENABLED;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    tipo: user.tipo,
    telefone: null,
    nomeFantasia: user.nomeFantasia,
    fallbackAuth: true
  };
}

function findFallbackUserByCredentials(email, senha) {
  if (!ENABLED) return null;
  const normalizedEmail = String(email || '').toLowerCase().trim();
  return fallbackUsers.find(user => user.email === normalizedEmail && user.senha === senha) || null;
}

function findFallbackUserById(id) {
  if (!ENABLED) return null;
  return fallbackUsers.find(user => user.id === Number(id)) || null;
}

module.exports = {
  isFallbackAuthEnabled,
  findFallbackUserByCredentials,
  findFallbackUserById,
  publicUser,
};
