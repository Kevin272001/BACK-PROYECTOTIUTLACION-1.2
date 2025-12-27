const router = require("express").Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/perfil.controller");
const uploadQr = require("../middlewares/uploadQrCuenta");

router.get("/mine", auth, controller.mine);
// 🔎 Ver datos bancarios públicos del trabajador (para que el empleador pague)
router.get("/public/:userId", auth, controller.publico);
router.put("/", auth, controller.actualizar);

// ✅ Subir QR de cuenta bancaria (trabajador)
router.post("/qr", auth, uploadQr.single("qr"), controller.subirQr);

module.exports = router;
