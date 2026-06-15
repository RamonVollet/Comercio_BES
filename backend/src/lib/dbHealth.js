// ===========================================
// Database health check
// ===========================================
const prisma = require('./prisma');
const { getSafeDatabaseUrlInfo } = require('./databaseUrl');

function getHealthTimeoutMs() {
  const parsed = Number.parseInt(process.env.DB_HEALTH_TIMEOUT_MS, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}

function withTimeout(promise, timeoutMs) {
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Database health check timed out after ${timeoutMs}ms`);
      err.code = 'DB_HEALTH_TIMEOUT';
      err.statusCode = 503;
      reject(err);
    }, timeoutMs);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeout,
  ]);
}

function publicDatabaseError(err) {
  if (process.env.NODE_ENV === 'production' && process.env.DB_SHOW_ERRORS !== 'true') {
    return 'Banco de dados indisponivel. Verifique DATABASE_URL e conectividade.';
  }

  return err.message;
}

async function getDatabaseHealth() {
  const startedAt = Date.now();

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, getHealthTimeoutMs());
    return {
      ok: true,
      database: 'reachable',
      elapsedMs: Date.now() - startedAt,
      databaseUrl: getSafeDatabaseUrlInfo(process.env.DATABASE_URL),
    };
  } catch (err) {
    return {
      ok: false,
      database: 'unreachable',
      elapsedMs: Date.now() - startedAt,
      code: err.code || null,
      error: publicDatabaseError(err),
      databaseUrl: getSafeDatabaseUrlInfo(process.env.DATABASE_URL),
    };
  }
}

module.exports = {
  getDatabaseHealth,
};
