const express = require("express");
const router = express.Router();

const trabajoController = require("../controllers/trabajoController.js");

// ===========================================================
// 🔹 Crear trabajo (empleador crea oferta)
// ===========================================================
router.post("/", trabajoController.crear);

// ===========================================================
// 🔹 Listar trabajos con filtros
//     GET /api/trabajos?estado=activo&categoria=algo&buscar=texto
// ===========================================================
router.get("/", trabajoController.listar);

// ===========================================================
// 🔹 Listar trabajos del EMPLEADOR (usando userId del usuario)
//     GET /api/trabajos/mios/:userId
// ===========================================================
router.get("/mios/:userId", trabajoController.listarPorEmpleador);

// ===========================================================
// 🔹 Obtener trabajo por ID
//     GET /api/trabajos/:id
// ===========================================================
router.get("/:id", trabajoController.obtenerUno);

// ===========================================================
// 🔹 Actualizar trabajo
//     PUT /api/trabajos/:id
// ===========================================================
router.put("/:id", trabajoController.actualizar);

// ===========================================================
// 🔹 Cambiar estado (activo/pausado/finalizado)
//     PATCH /api/trabajos/:id/estado
// ===========================================================
router.patch("/:id/estado", trabajoController.cambiarEstado);

// ===========================================================
// 🔹 Finalizar trabajo AVANZADO (exitoso / malo)
//     POST /api/trabajos/:id/finalizar
// ===========================================================
router.post("/:id/finalizar", trabajoController.finalizarTrabajo);

// ===========================================================
// ✅ Finalizar trabajo SIMPLE (SIN resultado, SIN pagos)
//     PUT /api/trabajos/:id/finalizar-simple
// ===========================================================
router.put(
  "/:id/finalizar-simple",
  trabajoController.finalizarTrabajoSimple
);

// ===========================================================
// 🔹 Eliminar trabajo
//     DELETE /api/trabajos/:id
// ===========================================================
router.delete("/:id", trabajoController.eliminar);

module.exports = router;
