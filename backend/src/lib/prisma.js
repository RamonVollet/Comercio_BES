// ===========================================
// Prisma Client - Instancia unica compartilhada
// ===========================================
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
