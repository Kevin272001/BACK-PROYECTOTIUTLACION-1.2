"use strict";

const express = require("express");
const router = express.Router();

const postulacionController = require("../controllers/postulacionController");

// ======================================================
// ✅ Crear postulación (TRABAJO o SERVICIO)
// Body:
//  - userId obligatorio
//  - enviar SOLO uno: trabajoId o servicioId
// ======================================================
router.post("/", postulacionController.crear);

// ======================================================
// 🔹 Listar postulaciones de un TRABAJO
// ======================================================
router.get("/trabajo/:trabajoId", postulacionController.porTrabajo);

// ======================================================
// ✅ NUEVO: Listar postulaciones de un SERVICIO
// (para que "Mis Publicaciones" vea las postulaciones)
// ======================================================
router.get("/servicio/:servicioId", postulacionController.porServicio);

// ======================================================
// 🔥 Listar postulaciones de un usuario (TRABAJADOR o EMPLEADOR)
// ======================================================
router.get("/usuario/:userId", postulacionController.porUsuario);

// ======================================================
// 🔹 Cambiar estado (pendiente / aceptado / rechazado)
// Body: { estado: "aceptado" | "rechazado" | "pendiente" }
// ======================================================
router.patch("/:id/estado", postulacionController.cambiarEstado);

module.exports = router;
