// Roda uma vez antes de todos os testes, em processo separado
// Cria o schema do banco de testes via prisma db push
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  // db push sem --force-reset: cria as tabelas se nao existirem,
  // sincroniza schema se existirem. Nao destrutivo.
  // A limpeza de dados e feita pelo cleanDatabase() em cada beforeEach.
  execSync('npx prisma db push', {
    cwd: path.join(__dirname, '..', '..'),
    env: {
      ...process.env,
      DATABASE_URL: 'file:./prisma/test.db'
    },
    stdio: 'pipe'
  });
};
