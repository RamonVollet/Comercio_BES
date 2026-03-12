// ===========================================
// Rotas - Comercios
// ===========================================
const express = require('express');
const router = express.Router();
const { auth, requireTipo } = require('../middleware/auth');
const ctrl = require('../controllers/comerciosController');

// Publicas
router.get('/', ctrl.listar);
router.get('/:slug', ctrl.buscarPorSlug);

// Protegidas (comerciante ou admin)
router.post('/', auth, requireTipo('comerciante', 'admin'), ctrl.criar);
router.put('/:slug', auth, requireTipo('comerciante', 'admin'), ctrl.atualizar);
router.delete('/:slug', auth, requireTipo('comerciante', 'admin'), ctrl.excluir);

// Produtos (catalogo)
router.post('/:slug/produtos', auth, requireTipo('comerciante', 'admin'), ctrl.adicionarProduto);
router.put('/:slug/produtos/:produtoId', auth, requireTipo('comerciante', 'admin'), ctrl.atualizarProduto);
router.delete('/:slug/produtos/:produtoId', auth, requireTipo('comerciante', 'admin'), ctrl.excluirProduto);

// Promocoes
router.put('/:slug/promocao', auth, requireTipo('comerciante', 'admin'), ctrl.definirPromocao);
router.delete('/:slug/promocao', auth, requireTipo('comerciante', 'admin'), ctrl.removerPromocao);

module.exports = router;
