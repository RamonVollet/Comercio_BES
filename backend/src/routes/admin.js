const express = require('express');
const router = express.Router();
const { auth, requireCapability } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

// Somente usuários com capability 'users.manage' (admins)
router.get('/usuarios', auth, requireCapability('users.manage'), ctrl.listarUsuarios);

// Somente usuários com capability 'stores.moderate' (admins)
router.patch('/lojas/:id/status', auth, requireCapability('stores.moderate'), ctrl.atualizarStatusLoja);

module.exports = router;
