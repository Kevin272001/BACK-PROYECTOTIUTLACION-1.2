"use strict";

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, "..", "uploads", "banco");
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Evita caracteres raros y espacios
    const original = (file.originalname || "qr.png").replace(/[^\w.\-]/g, "_");
    cb(null, `qr_${Date.now()}_${original}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || "").toLowerCase();

  // ✅ Extensiones permitidas
  const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];

  // ✅ Mimetypes permitidos (incluyo image/jpg por compatibilidad)
  const allowedMime = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  // Si el mimetype viene vacío o raro, igual validamos por extensión (caso Android)
  const mimeOk = allowedMime.includes(file.mimetype);
  const extOk = allowedExt.includes(ext);

  if (!extOk && !mimeOk) {
    return cb(
      new Error("Formato no permitido. Usa JPG/JPEG/PNG/WEBP"),
      false
    );
  }

  cb(null, true);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
