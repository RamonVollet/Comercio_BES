const request = require('supertest');
const app = require('../server');
const {
  cleanDatabase,
  criarCategoriaTeste,
  criarUsuarioTeste,
  criarAdminTeste,
  criarComercioTeste
} = require('./helpers');

let categoria;

beforeEach(async () => {
  await cleanDatabase();
  categoria = await criarCategoriaTeste();
});

afterAll(async () => {
  const prisma = require('../lib/prisma');
  await prisma.$disconnect();
});

// ============================================================
// GET /api/comercios
// ============================================================
describe('GET /api/comercios', () => {
  it('retorna lista vazia quando nao ha comercios', async () => {
    const res = await request(app).get('/api/comercios');

    expect(res.status).toBe(200);
    expect(res.body.comercios).toEqual([]);
    expect(res.body.paginacao.total).toBe(0);
  });

  it('retorna comercios cadastrados', async () => {
    await criarComercioTeste(categoria.id);

    const res = await request(app).get('/api/comercios');

    expect(res.status).toBe(200);
    expect(res.body.comercios).toHaveLength(1);
    expect(res.body.comercios[0].nome).toBe('Comercio Teste');
    expect(res.body.paginacao.total).toBe(1);
  });

  it('filtra por categoria', async () => {
    await criarComercioTeste(categoria.id);
    const outraCategoria = await criarCategoriaTeste({ nome: 'Farmacia', slug: 'farmacia', emoji: '💊' });
    const prisma = require('../lib/prisma');
    await prisma.comercio.create({
      data: {
        slug: 'farmacia-central',
        nome: 'Farmacia Central',
        categoriaId: outraCategoria.id,
        tags: '[]',
        emoji: '💊',
        endereco: 'Rua Principal, 1',
        lat: -21.99,
        lng: -48.39,
        whatsapp: '5516988888888',
        horario: 'Seg-Sex 8h-20h'
      }
    });

    const res = await request(app).get('/api/comercios?categoria=farmacia');

    expect(res.status).toBe(200);
    expect(res.body.comercios).toHaveLength(1);
    expect(res.body.comercios[0].categoriaSlug).toBe('farmacia');
  });

  it('filtra por busca textual', async () => {
    await criarComercioTeste(categoria.id);

    const resEncontrado = await request(app).get('/api/comercios?busca=Comercio');
    expect(resEncontrado.body.comercios).toHaveLength(1);

    const resNaoEncontrado = await request(app).get('/api/comercios?busca=xyz-inexistente');
    expect(resNaoEncontrado.body.comercios).toHaveLength(0);
  });
});

// ============================================================
// GET /api/comercios/:slug
// ============================================================
describe('GET /api/comercios/:slug', () => {
  it('retorna comercio pelo slug', async () => {
    const comercio = await criarComercioTeste(categoria.id);

    const res = await request(app).get(`/api/comercios/${comercio.slug}`);

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe(comercio.slug);
    expect(res.body.nome).toBe('Comercio Teste');
  });

  it('retorna 404 para slug inexistente', async () => {
    const res = await request(app).get('/api/comercios/slug-que-nao-existe');
    expect(res.status).toBe(404);
  });
});

// ============================================================
// POST /api/comercios (requer auth: comerciante ou admin)
// ============================================================
describe('POST /api/comercios', () => {
  const dadosComercio = () => ({
    nome: `Loja Nova ${Date.now()}`,
    categoriaId: undefined, // preenchido no beforeEach
    endereco: 'Rua Nova, 456',
    whatsapp: '5516977777777',
    horario: 'Seg-Sex 9h-18h',
    lat: -21.99,
    lng: -48.39
  });

  it('rejeita sem token (401)', async () => {
    const res = await request(app)
      .post('/api/comercios')
      .send({ ...dadosComercio(), categoriaId: categoria.id });

    expect(res.status).toBe(401);
  });

  it('rejeita cliente autenticado (403)', async () => {
    const { token } = await criarUsuarioTeste(app, { tipo: 'cliente' });

    const res = await request(app)
      .post('/api/comercios')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...dadosComercio(), categoriaId: categoria.id });

    expect(res.status).toBe(403);
  });

  it('comerciante autenticado cria comercio com sucesso', async () => {
    const { token } = await criarUsuarioTeste(app, { tipo: 'comerciante' });

    const res = await request(app)
      .post('/api/comercios')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...dadosComercio(), categoriaId: categoria.id });

    expect(res.status).toBe(201);
    expect(res.body.comercio).toBeDefined();
    expect(res.body.comercio.categoria).toBe('Restaurante');
  });

  it('admin autenticado cria comercio com sucesso', async () => {
    const { token } = await criarAdminTeste();

    const res = await request(app)
      .post('/api/comercios')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...dadosComercio(), categoriaId: categoria.id });

    expect(res.status).toBe(201);
  });

  it('rejeita campos obrigatorios ausentes', async () => {
    const { token } = await criarAdminTeste();

    const res = await request(app)
      .post('/api/comercios')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Sem Campos' }); // sem categoriaId, endereco, whatsapp, horario

    expect(res.status).toBe(400);
  });

  it('rejeita categoria inexistente', async () => {
    const { token } = await criarAdminTeste();

    const res = await request(app)
      .post('/api/comercios')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...dadosComercio(), categoriaId: 99999 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/categoria/i);
  });
});

// ============================================================
// DELETE /api/comercios/:slug — teste de IDOR
// ============================================================
describe('DELETE /api/comercios/:slug (IDOR)', () => {
  it('comerciante nao deleta comercio de outro dono', async () => {
    const { user: dono, token: tokenDono } = await criarUsuarioTeste(app, { tipo: 'comerciante' });
    const comercio = await criarComercioTeste(categoria.id, dono.id);

    // Outro comerciante tenta deletar
    const { token: tokenOutro } = await criarUsuarioTeste(app, {
      tipo: 'comerciante',
      email: `outro_${Date.now()}@example.com`
    });

    const res = await request(app)
      .delete(`/api/comercios/${comercio.slug}`)
      .set('Authorization', `Bearer ${tokenOutro}`);

    expect(res.status).toBe(403);
  });

  it('dono consegue deletar seu proprio comercio', async () => {
    const { user: dono, token: tokenDono } = await criarUsuarioTeste(app, { tipo: 'comerciante' });
    const comercio = await criarComercioTeste(categoria.id, dono.id);

    const res = await request(app)
      .delete(`/api/comercios/${comercio.slug}`)
      .set('Authorization', `Bearer ${tokenDono}`);

    expect(res.status).toBe(200);
  });

  it('admin deleta qualquer comercio', async () => {
    const { user: dono } = await criarUsuarioTeste(app, { tipo: 'comerciante' });
    const comercio = await criarComercioTeste(categoria.id, dono.id);
    const { token: tokenAdmin } = await criarAdminTeste();

    const res = await request(app)
      .delete(`/api/comercios/${comercio.slug}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
  });
});
