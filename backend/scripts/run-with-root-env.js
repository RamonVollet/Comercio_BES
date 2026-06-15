const { spawnSync } = require('child_process');
const path = require('path');
require('../src/lib/loadEnv')();

const [tool, ...toolArgs] = process.argv.slice(2);

if (!tool) {
  console.error('Uso: node scripts/run-with-root-env.js <comando> [...args]');
  process.exit(1);
}

let command = tool;
let args = toolArgs;

if (tool === 'prisma') {
  command = process.execPath;
  args = [path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js'), ...toolArgs];
}

const result = spawnSync(command, args, {
  cwd: path.join(__dirname, '..'),
  env: process.env,
  stdio: 'inherit',
  shell: false
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
