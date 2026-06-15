// ===========================================
// Prisma Client - Instancia unica compartilhada
// ===========================================
const { withDefaultDatabaseTimeouts } = require('./databaseUrl');
const { PrismaClient } = require('@prisma/client');

process.env.DATABASE_URL = withDefaultDatabaseTimeouts(process.env.DATABASE_URL, {
  connectTimeoutSeconds: process.env.DB_CONNECT_TIMEOUT_SECONDS,
  poolTimeoutSeconds: process.env.DB_POOL_TIMEOUT_SECONDS,
});

const prisma = new PrismaClient();

module.exports = prisma;
