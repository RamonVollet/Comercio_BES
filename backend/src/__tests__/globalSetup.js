// Roda uma vez antes de todos os testes, em processo separado
// Cria o schema do banco de testes via prisma db push
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  execSync('npx prisma db push --force-reset', {
    cwd: path.join(__dirname, '..', '..'),
    env: {
      ...process.env,
      DATABASE_URL: 'file:./prisma/test.db'
    },
    stdio: 'pipe' // silencia o output do prisma nos testes
  });
};
