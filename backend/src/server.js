// ===========================================
// Comercio BES - Servidor Express
// ===========================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : '*',
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

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estaticos do painel admin
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// Servir uploads locais (fallback quando Cloudinary nao esta configurado)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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
