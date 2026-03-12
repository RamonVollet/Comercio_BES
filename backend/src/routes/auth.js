// ===========================================
// Rotas - Autenticacao
// ===========================================
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

// Publicas
router.post('/registro', ctrl.registro);
router.post('/login', ctrl.login);

// Protegidas - Perfil
router.get('/perfil', auth, ctrl.perfil);
router.put('/perfil', auth, ctrl.atualizarPerfil);

// Protegidas - Enderecos de entrega
router.get('/enderecos', auth, ctrl.listarEnderecos);
router.post('/enderecos', auth, ctrl.criarEndereco);
router.put('/enderecos/:id', auth, ctrl.atualizarEndereco);
router.delete('/enderecos/:id', auth, ctrl.excluirEndereco);

module.exports = router;
