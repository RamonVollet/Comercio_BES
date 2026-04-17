// ===========================================
// Middleware - Autenticacao JWT + Cookie + CSRF + RBAC
// ===========================================
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getCapabilities } = require('../rbac/capabilities');

// ---------------------------------------------------------------------------
// auth — valida JWT em cookie httpOnly OU header Authorization: Bearer
// Popula: req.userId, req.userTipo, req.user
// ---------------------------------------------------------------------------
function auth(req, res, next) {
  // Tenta cookie primeiro (novo padrão), depois Bearer (compat legada)
  const token =
    (req.cookies && req.cookies.access_token) ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso nao fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.userId = decoded.id;
    req.userTipo = decoded.tipo;
    req.user = decoded; // { id, email, tipo, activeStoreId? }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faca login novamente.' });
    }
    return res.status(401).json({ error: 'Token invalido' });
  }
}

// ---------------------------------------------------------------------------
// authByCookie — igual a auth, mas aceita SOMENTE cookie (para rotas SPA)
// Redireciona para /login em vez de retornar JSON 401
// ---------------------------------------------------------------------------
function authByCookie(req, res, next) {
  const token = req.cookies && req.cookies.access_token;

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.userId = decoded.id;
    req.userTipo = decoded.tipo;
    req.user = decoded;
    next();
  } catch {
    return res.redirect('/login');
  }
}

// ---------------------------------------------------------------------------
// requireTipo — mantido para compatibilidade com rotas legadas
// ---------------------------------------------------------------------------
function requireTipo(...tipos) {
  return (req, res, next) => {
    if (!tipos.includes(req.userTipo)) {
      return res.status(403).json({ error: 'Acesso negado. Permissao insuficiente.' });
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// requireCapability — verifica capability específica (capability-first RBAC)
// Loga negações para observabilidade
// ---------------------------------------------------------------------------
function requireCapability(cap) {
  return (req, res, next) => {
    const caps = getCapabilities(req.userTipo);
    if (!caps.includes(cap)) {
      console.warn(
        `[RBAC] 403 capability denied | userId=${req.userId} cap=${cap} route=${req.path}`
      );
      return res.status(403).json({ error: 'Acesso negado', required: cap });
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// csrfGuard — CSRF double-submit: compara cookie csrf_token com header X-CSRF-Token
// Aplica apenas a métodos mutantes (POST/PUT/PATCH/DELETE)
// ---------------------------------------------------------------------------
const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function csrfGuard(req, res, next) {
  if (CSRF_SAFE_METHODS.has(req.method)) return next();

  const cookieCsrf = req.cookies && req.cookies.csrf_token;
  const headerCsrf = req.headers['x-csrf-token'];

  if (!cookieCsrf || !headerCsrf) {
    return res.status(403).json({ error: 'CSRF token ausente' });
  }

  // Comparação em tempo constante para evitar timing attacks
  try {
    const cookieBuf = Buffer.from(cookieCsrf, 'utf8');
    const headerBuf = Buffer.from(headerCsrf, 'utf8');
    const valid =
      cookieBuf.length === headerBuf.length &&
      crypto.timingSafeEqual(cookieBuf, headerBuf);
    if (!valid) {
      return res.status(403).json({ error: 'CSRF token invalido' });
    }
  } catch {
    return res.status(403).json({ error: 'CSRF token invalido' });
  }

  next();
}

// ---------------------------------------------------------------------------
// authOptional — nao bloqueia; extrai userId/tipo se disponivel
// ---------------------------------------------------------------------------
function authOptional(req, res, next) {
  const token =
    (req.cookies && req.cookies.access_token) ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      req.userId = decoded.id;
      req.userTipo = decoded.tipo;
      req.user = decoded;
    } catch {
      // Token inválido — segue sem autenticação
    }
  }
  next();
}

module.exports = {
  auth,
  authByCookie,
  requireTipo,
  requireCapability,
  csrfGuard,
  authOptional,
};
