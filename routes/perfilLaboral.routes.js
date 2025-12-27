"use strict";

const express = require("express");
const router = express.Router();
const perfilController = require("../controllers/perfilLaboral.controller");
const authMiddleware = require("../middlewares/auth");

// ✅ NUEVO: middleware multer para subir récord policial
const uploadRecord = require("../middlewares/uploadRecordPolicial");

// ===============================================================
// 🔹 CREAR perfil laboral (TRABAJADOR)
// POST /api/perfil-laboral
// multipart/form-data: fields + file(recordPolicial)
// ===============================================================
router.post(
  "/",
  authMiddleware,
  uploadRecord.single("recordPolicial"),
  perfilController.crearPerfilLaboral
);

// ===============================================================
// 🔹 Verificar si ya tiene perfil (USADO POR FLUTTER)
// GET /api/perfil-laboral/mine
// ===============================================================
router.get("/mine", authMiddleware, perfilController.verificarPerfilExistente);

// ===============================================================
// 🔹 Obtener MI perfil laboral (del trabajador autenticado)
// GET /api/perfil-laboral
// ===============================================================
router.get("/", authMiddleware, perfilController.obtenerPerfilDelTrabajador);

// ===============================================================
// 🔹 Actualizar perfil laboral
// PUT /api/perfil-laboral
// multipart opcional (si no mandas file, no cambia el record)
// ===============================================================
router.put(
  "/",
  authMiddleware,
  uploadRecord.single("recordPolicial"),
  perfilController.actualizarPerfilLaboral
);

// ===============================================================
// 🔹 Obtener TODOS los perfiles laborales de trabajadores
// GET /api/perfil-laboral/todos
// ===============================================================
router.get("/todos", perfilController.obtenerTodosPerfilesLaborales);

module.exports = router;
