// ===========================================
// Comercio BES - Servidor Express
// ===========================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const comerciosRoutes = require('./routes/comercios');
const categoriasRoutes = require('./routes/categorias');
const avaliacoesRoutes = require('./routes/avaliacoes');
const uploadRoutes = require('./routes/upload');
const estatisticasRoutes = require('./routes/estatisticas');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware Global ---

// Seguranca
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://res.cloudinary.com", "blob:"],
      connectSrc: ["'self'", "http://localhost:3000", "https://unpkg.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  // Strict-Transport-Security
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  // X-Frame-Options
  frameguard: { action: 'deny' },
  // X-Content-Type-Options: nosniff (habilitado por padrao no Helmet)
  noSniff: true,
  // Referrer-Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // X-XSS-Protection (legacy, mas ainda util)
  xssFilter: true,
  // Cross-Origin policies
  crossOriginResourcePolicy: { policy: "same-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginEmbedderPolicy: false // desabilitar para permitir carregamento de fontes/imagens externas
}));

// Permissions-Policy (Helmet nao configura isso por padrao)
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  next();
});

// CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL || '').split(',').map(u => u.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:8080'];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sem origin (curl, mobile apps, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Bloqueado pelo CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // maximo 100 requisicoes por IP
  message: { error: 'Muitas requisicoes. Tente novamente em 15 minutos.' }
});
app.use('/api/', limiter);

// Rate limit mais restrito para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});
app.use('/api/auth/', authLimiter);

// Rate limit para avaliacoes (prevenir spam)
const avaliacoesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Muitas avaliacoes enviadas. Tente novamente em 15 minutos.' }
});
app.use('/api/avaliacoes/', avaliacoesLimiter);

// Rate limit para estatisticas (prevenir abuso)
const statsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60,
  message: { error: 'Muitos eventos registrados. Tente novamente em breve.' }
});
app.use('/api/estatisticas/registrar', statsLimiter);

// Body parsing
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Servir arquivos estaticos do painel admin (protegido por auth via cookie/token)
// Em producao, requer autenticacao. Em dev, permite acesso livre.
app.use('/admin', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Verificar token no query param ou header (para acesso ao admin)
    const jwt = require('jsonwebtoken');
    const token = req.query.token || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
    if (!token) {
      return res.status(401).json({ error: 'Acesso nao autorizado. Use ?token=SEU_JWT_TOKEN' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      if (decoded.tipo !== 'admin') {
        return res.status(403).json({ error: 'Acesso restrito a administradores' });
      }
      next();
    } catch {
      return res.status(401).json({ error: 'Token invalido ou expirado' });
    }
  } else {
    next();
  }
}, express.static(path.join(__dirname, '..', 'admin')));

// Servir uploads locais (com cross-origin resource policy para imagens)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// --- Rotas da API ---
app.use('/api/auth', authRoutes);
app.use('/api/comercios', comerciosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/avaliacoes', avaliacoesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/estatisticas', estatisticasRoutes);

// Rota raiz da API
app.get('/api', (req, res) => {
  res.json({
    nome: 'Comercio BES API',
    versao: '1.0.0',
    descricao: 'API REST do guia comercial de Boa Esperanca do Sul',
    endpoints: {
      auth: '/api/auth',
      comercios: '/api/comercios',
      categorias: '/api/categorias',
      avaliacoes: '/api/avaliacoes',
      upload: '/api/upload',
      estatisticas: '/api/estatisticas',
      admin: '/admin'
    }
  });
});

// --- Error Handler ---
app.use(errorHandler);

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`\n=== Comercio BES API ===`);
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`API:    http://localhost:${PORT}/api`);
  console.log(`Admin:  http://localhost:${PORT}/admin`);
  console.log(`Env:    ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================\n`);
});

module.exports = app;
