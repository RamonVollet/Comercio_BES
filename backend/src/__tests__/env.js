// Carregado pelo Jest antes de qualquer modulo ser importado
// Garante que os testes usam um banco isolado
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./prisma/test.db';
process.env.JWT_SECRET = 'jest-test-secret-key-nao-usar-em-producao';
process.env.JWT_EXPIRES_IN = '1h';
process.env.FRONTEND_URL = 'http://localhost:8080';
process.env.PORT = '3001';
