// ===========================================
// Middleware - Autenticacao JWT
// ===========================================
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware que exige autenticacao
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acesso nao fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userTipo = decoded.tipo;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faca login novamente.' });
    }
    return res.status(401).json({ error: 'Token invalido' });
  }
}

// Middleware que exige tipo especifico de usuario
function requireTipo(...tipos) {
  return (req, res, next) => {
    if (!tipos.includes(req.userTipo)) {
      return res.status(403).json({
        error: 'Acesso negado. Permissao insuficiente.'
      });
    }
    next();
  };
}

// Middleware opcional - nao bloqueia, mas extrai userId se disponivel
function authOptional(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      req.userTipo = decoded.tipo;
    } catch (err) {
      // Token invalido, segue sem autenticacao
    }
  }

  next();
}

module.exports = { auth, requireTipo, authOptional };
