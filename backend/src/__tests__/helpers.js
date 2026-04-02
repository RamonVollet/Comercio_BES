// Utilitarios compartilhados entre os testes
const prisma = require('../lib/prisma');

// Limpa todas as tabelas na ordem correta (respeitando foreign keys)
async function cleanDatabase() {
  await prisma.pagamento.deleteMany();
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.avaliacao.deleteMany();
  await prisma.estatistica.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.promocao.deleteMany();
  await prisma.comercio.deleteMany();
  await prisma.endereco.deleteMany();
  await prisma.user.deleteMany();
  await prisma.categoria.deleteMany();
}

// Cria uma categoria de teste e retorna o objeto
async function criarCategoriaTeste(dados = {}) {
  return prisma.categoria.create({
    data: {
      nome: dados.nome || 'Restaurante',
      slug: dados.slug || 'restaurante',
      emoji: dados.emoji || '🍽️'
    }
  });
}

// Cria um usuario de teste e retorna { user, token }
async function criarUsuarioTeste(app, dados = {}) {
  const supertest = require('supertest');
  const payload = {
    nome: dados.nome || 'Usuario Teste',
    email: dados.email || `teste_${Date.now()}@example.com`,
    senha: dados.senha || 'senha123',
    tipo: dados.tipo || 'cliente'
  };

  if (payload.tipo === 'comerciante') {
    payload.nomeFantasia = dados.nomeFantasia || 'Negocio Teste';
    payload.cpfCnpj = dados.cpfCnpj || '12345678901';
  }

  const res = await supertest(app)
    .post('/api/auth/registro')
    .send(payload);

  return { user: res.body.user, token: res.body.token };
}

// Cria um admin diretamente no banco (registro via API nao permite tipo admin)
async function criarAdminTeste() {
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');

  const admin = await prisma.user.create({
    data: {
      nome: 'Admin Teste',
      email: `admin_${Date.now()}@example.com`,
      senha: await bcrypt.hash('admin123', 10),
      tipo: 'admin'
    }
  });

  const token = jwt.sign(
    { id: admin.id, email: admin.email, tipo: admin.tipo },
    process.env.JWT_SECRET,
    { expiresIn: '1h', algorithm: 'HS256' }
  );

  return { user: admin, token };
}

// Cria um comercio de teste e retorna o objeto
async function criarComercioTeste(categoriaId, ownerId = null) {
  return prisma.comercio.create({
    data: {
      slug: `comercio-teste-${Date.now()}`,
      nome: 'Comercio Teste',
      categoriaId,
      tags: '[]',
      emoji: '🏪',
      endereco: 'Rua Teste, 123',
      lat: -21.99,
      lng: -48.39,
      whatsapp: '5516999999999',
      horario: 'Seg-Sex 9h-18h',
      ownerId
    },
    include: {
      categoria: true,
      produtos: true,
      promocao: true,
      avaliacoes: { select: { nota: true } }
    }
  });
}

module.exports = {
  cleanDatabase,
  criarCategoriaTeste,
  criarUsuarioTeste,
  criarAdminTeste,
  criarComercioTeste
};
