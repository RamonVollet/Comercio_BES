// ===========================================
// Middleware - Upload de Imagens
// ===========================================
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Verificar se Cloudinary esta configurado
const cloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let cloudinary = null;
if (cloudinaryConfigured) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Sempre usar disco local para multer; Cloudinary e feito no controller
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `comercio-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens JPG, PNG e WebP sao permitidas'));
    }
  }
});

// Funcao para enviar ao Cloudinary (chamada no controller apos multer salvar localmente)
async function uploadToCloudinary(filePath) {
  if (!cloudinaryConfigured || !cloudinary) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'comercio-bes',
      transformation: [
        { width: 800, height: 600, crop: 'limit', quality: 'auto' }
      ]
    });

    // Remover arquivo local apos upload para Cloudinary
    fs.unlinkSync(filePath);

    return result.secure_url;
  } catch (err) {
    console.error('Erro ao enviar para Cloudinary:', err.message);
    return null;
  }
}

module.exports = { upload, uploadToCloudinary, cloudinaryConfigured };
