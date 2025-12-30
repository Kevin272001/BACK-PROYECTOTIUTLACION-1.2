"use strict";

const express = require("express");
const router = express.Router();

const perfilController = require("../controllers/perfilLaboral.controller");
const authMiddleware = require("../middlewares/auth");
const uploadRecord = require("../middlewares/uploadRecordPolicial");

// ✅ SOLO usa multer si el request es multipart/form-data
function maybeUploadRecord(req, res, next) {
  const ct = req.headers["content-type"] || "";
  if (ct.includes("multipart/form-data")) {
    return uploadRecord.single("recordPolicial")(req, res, next);
  }
  return next();
}

// ===============================================================
// 🔹 CREAR perfil laboral (TRABAJADOR)
// POST /api/perfil-laboral
// ✅ Acepta:
// - JSON (recomendado)
// - multipart (si algún día quieres enviar file aquí)
// ===============================================================
router.post("/", authMiddleware, maybeUploadRecord, perfilController.crearPerfilLaboral);

// ===============================================================
// 🔹 Verificar si ya tiene perfil (USADO POR FLUTTER)
// GET /api/perfil-laboral/mine
// ===============================================================
router.get("/mine", authMiddleware, perfilController.verificarPerfilExistente);

// ===============================================================
// 🔹 Obtener MI perfil laboral
// GET /api/perfil-laboral
// ===============================================================
router.get("/", authMiddleware, perfilController.obtenerPerfilDelTrabajador);

// ===============================================================
// 🔹 Actualizar perfil laboral
// PUT /api/perfil-laboral
// ✅ Acepta JSON normal también
// ===============================================================
router.put("/", authMiddleware, maybeUploadRecord, perfilController.actualizarPerfilLaboral);

// ===============================================================
// ✅ SUBIR / REEMPLAZAR RÉCORD POLICIAL (RECOMENDADO)
// POST /api/perfil-laboral/record
// multipart/form-data: recordPolicial(file)
// ===============================================================
router.post(
  "/record",
  authMiddleware,
  uploadRecord.single("recordPolicial"),
  perfilController.subirRecordPolicial
);

// ===============================================================
// 🔹 Obtener TODOS los perfiles laborales
// GET /api/perfil-laboral/todos
// ===============================================================
router.get("/todos", perfilController.obtenerTodosPerfilesLaborales);

module.exports = router;
