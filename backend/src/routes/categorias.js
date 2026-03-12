// ===========================================
// Rotas - Categorias
// ===========================================
const express = require('express');
const router = express.Router();
const { auth, requireTipo } = require('../middleware/auth');
const ctrl = require('../controllers/categoriasController');

// Publicas
router.get('/', ctrl.listar);

// Admin only
router.post('/', auth, requireTipo('admin'), ctrl.criar);
router.put('/:id', auth, requireTipo('admin'), ctrl.atualizar);
router.delete('/:id', auth, requireTipo('admin'), ctrl.excluir);

module.exports = router;
