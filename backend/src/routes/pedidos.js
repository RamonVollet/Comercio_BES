// ===========================================
// Rotas - Pedidos
// ===========================================
const express = require('express');
const router = express.Router();
const { auth, requireTipo } = require('../middleware/auth');
const ctrl = require('../controllers/pedidosController');

// Resumo (comerciante/admin) - ANTES de /:codigo para nao conflitar
router.get('/resumo', auth, requireTipo('comerciante', 'admin'), ctrl.resumo);

// Criar pedido (cliente autenticado)
router.post('/', auth, ctrl.criar);

// Listar pedidos (todos os tipos autenticados)
router.get('/', auth, ctrl.listar);

// Detalhes do pedido
router.get('/:codigo', auth, ctrl.buscarPorCodigo);

// Atualizar status (comerciante/admin/cliente para cancelar)
router.put('/:codigo/status', auth, ctrl.atualizarStatus);

module.exports = router;
