"use strict";

const express = require("express");
const router = express.Router();

const perfilController = require("../controllers/perfilLaboral.controller");
const authMiddleware = require("../middlewares/auth");

// ✅ multer SOLO para subir archivo de récord policial
const uploadRecord = require("../middlewares/uploadRecordPolicial");

// ===============================================================
// 🔹 CREAR perfil laboral (TRABAJADOR) - JSON normal (NO ROMPE)
// POST /api/perfil-laboral
// body: JSON (sin archivo)
// ===============================================================
router.post("/", authMiddleware, perfilController.crearPerfilLaboral);

// ===============================================================
// 🔹 Verificar si ya tiene perfil (USADO POR FLUTTER)
// ✅ OJO: tu controller responde { exists: true/false }
// GET /api/perfil-laboral/mine
// ===============================================================
router.get("/mine", authMiddleware, perfilController.verificarPerfilExistente);

// ===============================================================
// 🔹 Obtener MI perfil laboral (del trabajador autenticado)
// GET /api/perfil-laboral
// ===============================================================
router.get("/", authMiddleware, perfilController.obtenerPerfilDelTrabajador);

// ===============================================================
// 🔹 ACTUALIZAR perfil laboral - JSON normal (NO ROMPE)
// PUT /api/perfil-laboral
// body: JSON (sin archivo)
// ===============================================================
router.put("/", authMiddleware, perfilController.actualizarPerfilLaboral);

// ===============================================================
// ✅ SUBIR / REEMPLAZAR RÉCORD POLICIAL (archivo)
// POST /api/perfil-laboral/record
// form-data: recordPolicial (file)
// ===============================================================
router.post(
  "/record",
  authMiddleware,
  uploadRecord.single("recordPolicial"),
  perfilController.subirRecordPolicial
);

// ===============================================================
// 🔹 Obtener TODOS los perfiles laborales de trabajadores
// GET /api/perfil-laboral/todos
// ===============================================================
router.get("/todos", perfilController.obtenerTodosPerfilesLaborales);

module.exports = router;
