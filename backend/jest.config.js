module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./src/__tests__/env.js'],
  globalSetup: './src/__tests__/globalSetup.js',
  globalTeardown: './src/__tests__/globalTeardown.js',
  testMatch: ['**/__tests__/**/*.test.js'],
  testTimeout: 15000,
  verbose: true
};
