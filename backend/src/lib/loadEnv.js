const path = require('path');
const dotenv = require('dotenv');

function loadEnv() {
  const rootEnv = path.join(__dirname, '..', '..', '..', '.env');

  dotenv.config({ path: rootEnv });
}

module.exports = loadEnv;
