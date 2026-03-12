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

// Protegidas
router.get('/perfil', auth, ctrl.perfil);
router.put('/perfil', auth, ctrl.atualizarPerfil);

module.exports = router;
