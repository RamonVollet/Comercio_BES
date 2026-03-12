// ===========================================
// Controller - Upload de Imagens
// ===========================================
const { uploadToCloudinary, cloudinaryConfigured } = require('../middleware/upload');
const path = require('path');

// POST /api/upload
async function uploadImagem(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    let url;
    if (cloudinaryConfigured) {
      // Enviar para Cloudinary e retornar URL
      const cloudinaryUrl = await uploadToCloudinary(req.file.path);
      if (cloudinaryUrl) {
        url = cloudinaryUrl;
      } else {
        url = `/uploads/${req.file.filename}`;
      }
    } else {
      // Upload local
      url = `/uploads/${req.file.filename}`;
    }

    res.status(201).json({
      message: 'Imagem enviada com sucesso',
      url,
      filename: req.file.filename,
      storage: cloudinaryConfigured ? 'cloudinary' : 'local'
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/upload/multiplo
async function uploadMultiplo(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const urls = [];

    for (const file of req.files) {
      if (cloudinaryConfigured) {
        const cloudinaryUrl = await uploadToCloudinary(file.path);
        urls.push(cloudinaryUrl || `/uploads/${file.filename}`);
      } else {
        urls.push(`/uploads/${file.filename}`);
      }
    }

    res.status(201).json({
      message: `${urls.length} imagens enviadas com sucesso`,
      urls,
      storage: cloudinaryConfigured ? 'cloudinary' : 'local'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadImagem, uploadMultiplo };
