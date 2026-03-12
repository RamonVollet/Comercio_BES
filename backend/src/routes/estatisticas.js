// ===========================================
// Rotas - Estatisticas
// ===========================================
const express = require('express');
const router = express.Router();
const { auth, requireTipo } = require('../middleware/auth');
const ctrl = require('../controllers/estatisticasController');

// Publica (registrar evento)
router.post('/registrar', ctrl.registrar);

// Protegida (dono ou admin)
router.get('/:comercioSlug', auth, requireTipo('comerciante', 'admin'), ctrl.buscarPorComercio);

// Admin - visao geral
router.get('/', auth, requireTipo('admin'), ctrl.geral);

module.exports = router;
