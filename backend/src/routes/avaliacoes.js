// ===========================================
// Rotas - Avaliacoes
// ===========================================
const express = require('express');
const router = express.Router();
const { auth, authOptional } = require('../middleware/auth');
const ctrl = require('../controllers/avaliacoesController');

// Publicas
router.get('/:comercioSlug', ctrl.listarPorComercio);

// Avaliar (autenticado opcional - permite anonimo)
router.post('/:comercioSlug', authOptional, ctrl.criar);

// Excluir (autenticado, dono ou admin)
router.delete('/:id', auth, ctrl.excluir);

module.exports = router;
