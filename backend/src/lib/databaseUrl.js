// ===========================================
// Database URL helpers
// ===========================================

function isPostgresUrl(url) {
  return url.protocol === 'postgresql:' || url.protocol === 'postgres:';
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function withDefaultDatabaseTimeouts(rawUrl, options = {}) {
  if (!rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl);
    if (!isPostgresUrl(url)) return rawUrl;

    const connectTimeoutSeconds = positiveInteger(options.connectTimeoutSeconds, 10);
    const poolTimeoutSeconds = positiveInteger(options.poolTimeoutSeconds, 10);

    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', String(connectTimeoutSeconds));
    }

    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', String(poolTimeoutSeconds));
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

function getSafeDatabaseUrlInfo(rawUrl) {
  if (!rawUrl) return { configured: false };

  try {
    const url = new URL(rawUrl);
    return {
      configured: true,
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
      port: url.port || null,
      database: url.pathname ? url.pathname.replace(/^\//, '') : null,
      params: Array.from(url.searchParams.keys()).sort(),
    };
  } catch {
    return { configured: true, parseable: false };
  }
}

module.exports = {
  withDefaultDatabaseTimeouts,
  getSafeDatabaseUrlInfo,
};
