const express = require("express");
const router = express.Router();
const servicioCtrl = require("../controllers/servicio.controller");

// ======================================================
// ✅ DEBUG (PRIMERO PARA QUE NO CHOQUE CON /:servicioId/...)
// ======================================================

// Ver IDs disponibles (últimos 30)
router.get("/debug/ids", servicioCtrl.debugIds);

// Ver un servicio por ID
router.get("/debug/:id", servicioCtrl.debugById);

// ======================================================
// ✅ SERVICIOS
// ======================================================

// Crear servicio
router.post("/", servicioCtrl.crear);

// Feed general (activos + <24h)
router.get("/", servicioCtrl.listar);

// Mis servicios del trabajador + postulaciones (activos + <24h)
router.get("/mis/:userId", servicioCtrl.listarMisServicios);

// ✅ NUEVO: Obtener servicio por ID (para Flutter "Ver perfil")
// GET /api/servicios/:id
router.get("/:id", servicioCtrl.obtenerPorId);

// Editar servicio
router.put("/:id", servicioCtrl.editar);

// Eliminar servicio
router.delete("/:id", servicioCtrl.eliminar);

// ======================================================
// ✅ POSTULACIONES A SERVICIO (EMPLEADOR → TRABAJADOR)
// ======================================================

// Crear postulación a un servicio
router.post("/:servicioId/postulaciones", servicioCtrl.crearPostulacionServicio);

// ✅ NUEVO: LISTAR postulaciones de un servicio
// GET /api/servicios/:servicioId/postulaciones
router.get("/:servicioId/postulaciones", servicioCtrl.listarPostulacionesServicio);

// Cambiar estado de postulación (aceptar / rechazar)
router.patch(
  "/postulaciones/:id/estado",
  servicioCtrl.cambiarEstadoPostulacionServicio
);

// ✅ Compatibilidad: si tu Flutter está usando PUT, déjalo también
router.put(
  "/postulaciones/:id/estado",
  servicioCtrl.cambiarEstadoPostulacionServicio
);

module.exports = router;
