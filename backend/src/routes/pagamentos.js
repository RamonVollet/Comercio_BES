// ===========================================
// Rotas - Pagamentos (Mercado Pago)
// ===========================================
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/pagamentosController');

// Criar pagamento (cliente autenticado)
router.post('/criar', auth, ctrl.criarPagamento);

// Webhook do Mercado Pago (publico - chamado pelo MP)
router.post('/webhook', ctrl.webhook);

// Consultar pagamento (autenticado)
router.get('/:pedidoCodigo', auth, ctrl.consultarPagamento);

module.exports = router;
