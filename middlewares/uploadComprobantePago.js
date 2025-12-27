"use strict";

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, "..", "uploads", "comprobantes");
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const original = (file.originalname || "comprobante")
      .replace(/[^\w.\-]/g, "_"); // limpia caracteres raros
    cb(null, `comprobante_${Date.now()}_${original}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || "").toLowerCase();

  // ✅ Extensiones permitidas (comprobante puede ser imagen o PDF)
  const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

  // ✅ Mimetypes permitidos
  const allowedMime = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  const mimeOk = allowedMime.includes(file.mimetype);
  const extOk = allowedExt.includes(ext);

  // ✅ Caso Android/Flutter: a veces viene como application/octet-stream
  // Si la extensión es válida, lo aceptamos igual.
  if (!extOk && !mimeOk) {
    return cb(
      new Error("Formato no permitido. Usa JPG/JPEG/PNG/WEBP o PDF"),
      false
    );
  }

  cb(null, true);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
