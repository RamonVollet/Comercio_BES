const request = require('supertest');
const app = require('../server');
const { cleanDatabase } = require('./helpers');

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  const prisma = require('../lib/prisma');
  await prisma.$disconnect();
});

// ============================================================
// POST /api/auth/registro
// ============================================================
describe('POST /api/auth/registro', () => {
  it('registra um cliente com dados validos', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({
        nome: 'Maria Silva',
        email: 'maria@example.com',
        senha: 'senha123'
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('maria@example.com');
    expect(res.body.user.tipo).toBe('cliente');
    expect(res.body.token).toBeDefined();
    expect(res.body.user.senha).toBeUndefined(); // senha nunca retorna
  });

  it('registra um comerciante com dados validos', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({
        nome: 'Joao Comerciante',
        email: 'joao@example.com',
        senha: 'senha123',
        tipo: 'comerciante',
        nomeFantasia: 'Mercadinho do Joao',
        cpfCnpj: '12345678901'
      });

    expect(res.status).toBe(201);
    expect(res.body.user.tipo).toBe('comerciante');
    expect(res.body.user.nomeFantasia).toBe('Mercadinho do Joao');
  });

  it('bloqueia escalacao de privilegio para admin', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({
        nome: 'Hacker',
        email: 'hacker@example.com',
        senha: 'senha123',
        tipo: 'admin' // deve ser ignorado e virar 'cliente'
      });

    expect(res.status).toBe(201);
    expect(res.body.user.tipo).toBe('cliente'); // nunca admin
  });

  it('rejeita email invalido', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({
        nome: 'Teste',
        email: 'nao-e-um-email',
        senha: 'senha123'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejeita senha curta (menos de 6 caracteres)', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({
        nome: 'Teste',
        email: 'teste@example.com',
        senha: '123'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/senha/i);
  });

  it('rejeita campos obrigatorios ausentes', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ email: 'teste@example.com' }); // sem nome e senha

    expect(res.status).toBe(400);
  });

  it('rejeita email duplicado', async () => {
    const dados = { nome: 'Usuario', email: 'duplicado@example.com', senha: 'senha123' };
    await request(app).post('/api/auth/registro').send(dados);

    const res = await request(app).post('/api/auth/registro').send(dados);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/cadastrado/i);
  });

  it('comerciante sem nomeFantasia retorna erro', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({
        nome: 'Lojista',
        email: 'lojista@example.com',
        senha: 'senha123',
        tipo: 'comerciante'
        // sem nomeFantasia
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fantasia/i);
  });
});

// ============================================================
// POST /api/auth/login
// ============================================================
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/registro')
      .send({ nome: 'Usuario', email: 'usuario@example.com', senha: 'correta123' });
  });

  it('faz login com credenciais validas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'usuario@example.com', senha: 'correta123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('usuario@example.com');
  });

  it('rejeita senha errada', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'usuario@example.com', senha: 'errada999' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/incorretos/i);
  });

  it('rejeita email inexistente', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'naoexiste@example.com', senha: 'qualquer' });

    expect(res.status).toBe(401);
  });

  it('rejeita campos ausentes', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'usuario@example.com' }); // sem senha

    expect(res.status).toBe(400);
  });
});

// ============================================================
// GET /api/auth/perfil (rota protegida)
// ============================================================
describe('GET /api/auth/perfil', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nome: 'Perfil Teste', email: 'perfil@example.com', senha: 'senha123' });
    token = res.body.token;
  });

  it('retorna perfil com token valido', async () => {
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('perfil@example.com');
  });

  it('rejeita sem token (401)', async () => {
    const res = await request(app).get('/api/auth/perfil');
    expect(res.status).toBe(401);
  });

  it('rejeita com token invalido (401)', async () => {
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', 'Bearer token-invalido-qualquer');

    expect(res.status).toBe(401);
  });
});
