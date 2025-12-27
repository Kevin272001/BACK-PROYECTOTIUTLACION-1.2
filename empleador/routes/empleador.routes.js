const express = require('express');
const router = express.Router();

// ✅ auth legacy (jwt-simple) – no toca login/notificaciones
const auth = require('../../middlewares/auth');

const upload = require("../middlewares/uploadEmployer");
const empleadorController = require("../controllers/empleadorController");

// ===============================================================
// 🔹 GET /api/empleadores  -> Lista todos los empleadores
// ===============================================================
router.get('/', empleadorController.getAll);

// ===============================================================
// ✅ MI PERFIL (usa token)
//    GET /api/empleadores/me
//    PUT /api/empleadores/me
// ===============================================================
router.get('/me', auth, empleadorController.obtenerMiPerfil);
router.put('/me', auth, empleadorController.actualizarMiPerfil);

// ✅ Actualizar archivos (foto / récord policial)
router.put(
  '/me/archivos',
  auth,
  upload.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'recordPolicial', maxCount: 1 },
  ]),
  empleadorController.actualizarMisArchivos
);

// ===============================================================
// 🔹 GET /api/empleadores/:userId  -> Obtiene un empleador por userId
// ===============================================================
router.get('/:userId', empleadorController.obtener);

// ===============================================================
// 🔹 POST /api/empleadores  -> Registrar empleador con foto
// ===============================================================
router.post(
  '/',
  upload.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'recordPolicial', maxCount: 1 },
  ]),
  empleadorController.registrar
);

// ===============================================================
// 🔹 DELETE /api/empleadores/:id -> Eliminar empleador
// ===============================================================
router.delete('/:id', empleadorController.eliminar);

module.exports = router;
