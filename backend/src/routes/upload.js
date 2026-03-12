// ===========================================
// Rotas - Upload de Imagens
// ===========================================
const express = require('express');
const router = express.Router();
const { auth, requireTipo } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const ctrl = require('../controllers/uploadController');

// Upload unico (comerciante ou admin)
router.post('/',
  auth,
  requireTipo('comerciante', 'admin'),
  upload.single('imagem'),
  ctrl.uploadImagem
);

// Upload multiplo (ate 5 imagens)
router.post('/multiplo',
  auth,
  requireTipo('comerciante', 'admin'),
  upload.array('imagens', 5),
  ctrl.uploadMultiplo
);

module.exports = router;
