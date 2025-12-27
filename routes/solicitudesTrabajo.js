const express = require("express");
const router = express.Router();
const controller = require("../controllers/solicitudesTrabajo.controller");

// Crear solicitud
router.post("/", controller.crear);

// Mis solicitudes
router.get("/mias/:userId", controller.listarMisSolicitudes);

// Empleador acepta
router.put("/aceptar/:id", controller.aceptar);

// Empleador rechaza
router.put("/rechazar/:id", controller.rechazar);

module.exports = router;
