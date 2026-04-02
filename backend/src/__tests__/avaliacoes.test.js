const request = require('supertest');
const app = require('../server');
const {
  cleanDatabase,
  criarCategoriaTeste,
  criarUsuarioTeste,
  criarComercioTeste
} = require('./helpers');

let categoria;
let comercio;

beforeEach(async () => {
  await cleanDatabase();
  categoria = await criarCategoriaTeste();
  comercio = await criarComercioTeste(categoria.id);
});

afterAll(async () => {
  const prisma = require('../lib/prisma');
  await prisma.$disconnect();
});

// ============================================================
// GET /api/avaliacoes/:slug
// ============================================================
describe('GET /api/avaliacoes/:slug', () => {
  it('retorna lista vazia e media 0 quando sem avaliacoes', async () => {
    const res = await request(app).get(`/api/avaliacoes/${comercio.slug}`);

    expect(res.status).toBe(200);
    expect(res.body.avaliacoes).toEqual([]);
    expect(res.body.media).toBe(0);
    expect(res.body.total).toBe(0);
  });

  it('retorna 404 para slug inexistente', async () => {
    const res = await request(app).get('/api/avaliacoes/slug-inexistente');
    expect(res.status).toBe(404);
  });
});

// ============================================================
// POST /api/avaliacoes/:slug
// ============================================================
describe('POST /api/avaliacoes/:slug', () => {
  it('cria avaliacao anonima valida (sem token)', async () => {
    const res = await request(app)
      .post(`/api/avaliacoes/${comercio.slug}`)
      .send({ nota: 5, comentario: 'Excelente!' });

    expect(res.status).toBe(201);
    expect(res.body.avaliacao.nota).toBe(5);
    expect(res.body.avaliacao.comentario).toBe('Excelente!');
    expect(res.body.avaliacao.usuario).toBe('Anonimo');
  });

  it('cria avaliacao com usuario autenticado', async () => {
    const { token } = await criarUsuarioTeste(app, { nome: 'Maria Avaliadora' });

    const res = await request(app)
      .post(`/api/avaliacoes/${comercio.slug}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nota: 4 });

    expect(res.status).toBe(201);
    expect(res.body.avaliacao.usuario).toBe('Maria Avaliadora');
  });

  it('calcula media corretamente com multiplas avaliacoes', async () => {
    await request(app)
      .post(`/api/avaliacoes/${comercio.slug}`)
      .send({ nota: 5 });

    await request(app)
      .post(`/api/avaliacoes/${comercio.slug}`)
      .send({ nota: 3 });

    const res = await request(app)
      .post(`/api/avaliacoes/${comercio.slug}`)
      .send({ nota: 4 });

    // Media de 5+3+4 = 12 / 3 = 4.0
    expect(res.body.mediaAtual).toBe(4);
    expect(res.body.totalAvaliacoes).toBe(3);
  });

  it('rejeita nota invalida (acima de 5)', async () => {
    const res = await request(app)
      .post(`/api/avaliacoes/${comercio.slug}`)
      .send({ nota: 6 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nota/i);
  });

  it('rejeita nota invalida (abaixo de 1)', async () => {
    const res = await request(app)
      .post(`/api/avaliacoes/${comercio.slug}`)
      .send({ nota: 0 });

    expect(res.status).toBe(400);
  });

  it('rejeita nota ausente', async () => {
    const res = await request(app)
      .post(`/api/avaliacoes/${comercio.slug}`)
      .send({ comentario: 'Sem nota' });

    expect(res.status).toBe(400);
  });

  it('retorna 404 para comercio inexistente', async () => {
    const res = await request(app)
      .post('/api/avaliacoes/slug-inexistente')
      .send({ nota: 5 });

    expect(res.status).toBe(404);
  });

  it('media arredonda para 1 casa decimal corretamente', async () => {
    // 5 + 4 = 9 / 2 = 4.5
    await request(app).post(`/api/avaliacoes/${comercio.slug}`).send({ nota: 5 });
    const res = await request(app)
      .post(`/api/avaliacoes/${comercio.slug}`)
      .send({ nota: 4 });

    expect(res.body.mediaAtual).toBe(4.5);
  });

  it('GET retorna avaliacoes criadas com media atualizada', async () => {
    await request(app).post(`/api/avaliacoes/${comercio.slug}`).send({ nota: 5 });
    await request(app).post(`/api/avaliacoes/${comercio.slug}`).send({ nota: 3 });

    const res = await request(app).get(`/api/avaliacoes/${comercio.slug}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.media).toBe(4); // (5+3)/2
  });
});
