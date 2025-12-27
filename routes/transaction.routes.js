const express = require("express");
const router = express.Router();

const controller = require("../controllers/transaction.controller");
const auth = require("../middlewares/auth"); // middleware JWT
const uploadComprobante = require("../middlewares/uploadComprobantePago");

// ======================================================
// 🔥 EMPLEADOR PAGA → TRABAJADOR RECIBE (PAGO REAL)
// ======================================================
// Crea 2 transacciones:
// - gasto (empleador)
// - ingreso (trabajador)
router.post("/", auth, controller.crear);

// ======================================================
// 🧾 CREAR SOLICITUD DE PAGO (PENDIENTE)
// ======================================================
router.post("/solicitar", auth, controller.solicitar);

// ======================================================
// ✅ CONFIRMAR PAGO PENDIENTE
// ======================================================
router.post("/confirmar", auth, uploadComprobante.single("comprobante"), controller.confirmar);

// ======================================================
// 🔹 MIS PAGOS PENDIENTES
// ======================================================
router.get("/pendientes", auth, controller.pendientes);

// ======================================================
// 💳 RECARGA / PAYPAL SIMULADO (SIN TRABAJADOR)
// ======================================================
router.post("/recarga", auth, controller.recarga);

// ======================================================
// 🔹 MIS TRANSACCIONES (según token)
// Empleador → ve gastos
// Trabajador → ve ingresos
// ======================================================
router.get("/mine", auth, controller.misTransacciones);

// ======================================================
// 🔹 HISTORIAL TOTAL (ADMIN / DEBUG)
// ⚠️ luego puedes protegerlo por rol
// ======================================================
router.get("/all", auth, controller.todas);

module.exports = router;