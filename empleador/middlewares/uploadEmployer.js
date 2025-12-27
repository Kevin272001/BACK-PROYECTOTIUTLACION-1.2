const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ======================================================
// ✅ Subida de archivos del empleador (foto + récord policial)
// - foto: imágenes (jpg/png/webp)
// - recordPolicial: PDF o imagen
// Se guardan en: uploads/empleadores/
// ======================================================

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'empleadores');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function safeOriginalName(name = '') {
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const base = file.fieldname === 'foto' ? 'foto' : 'record_policial';
    const rand = Math.floor(Math.random() * 1e9);
    cb(null, `${base}_${Date.now()}_${rand}${ext || ''}`);
  },
});

const fileFilter = (req, file, cb) => {
  const isImage = (file.mimetype || '').startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';

  // foto: solo imagen
  if (file.fieldname === 'foto') {
    if (isImage) return cb(null, true);
    return cb(new Error('La foto debe ser una imagen (JPG/PNG/WebP)'), false);
  }

  // recordPolicial: pdf o imagen
  if (file.fieldname === 'recordPolicial') {
    if (isImage || isPdf) return cb(null, true);
    return cb(new Error('El récord policial debe ser PDF o imagen'), false);
  }

  // cualquier otro campo: rechazamos
  return cb(new Error('Campo de archivo no permitido'), false);
};

module.exports = multer({ storage, fileFilter });
