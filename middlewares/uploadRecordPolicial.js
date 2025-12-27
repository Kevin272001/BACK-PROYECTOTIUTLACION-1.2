"use strict";

const multer = require("multer");

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Formato no permitido. Usa PDF/JPG/PNG"), false);
  }
  cb(null, true);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
