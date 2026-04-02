// Roda uma vez depois de todos os testes
// Remove o banco de testes
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const testDb = path.join(__dirname, '..', '..', 'prisma', 'test.db');
  if (fs.existsSync(testDb)) {
    fs.unlinkSync(testDb);
  }
};
