'use strict';

const express = require('express');
const router = express.Router();

// ==========================================================
// 🔹 Legacy system (aún utilizado)
// ==========================================================
const action = require('../methods/actions');

// ==========================================================
// 🔹 RUTAS SERVX (MODERNAS)
// ==========================================================
const userRoutes = require('./user.routes');
const trabajadorRoutes = require('./trabajador.routes');
const perfilLaboralRoutes = require('./perfilLaboral.routes');
const perfilRoutes = require('./perfil.routes');
const servicioRoutes = require('./servicio.routes');
const transactionRoutes = require('./transaction.routes');

// ==========================================================
// 🔹 RUTAS MÓDULO EMPLEADOR
// ==========================================================
const empleadorRoutes = require('../empleador/routes/empleador.routes');
const perfilEmpleadorRoutes = require('../empleador/routes/perfilEmpleadorRoutes');
const trabajoRoutes = require('../empleador/routes/trabajo.routes');
const postulacionRoutes = require('../empleador/routes/postulacion.routes');

// ==========================================================
// 🔹 RUTAS DE NOTIFICACIONES
// ==========================================================
const notificacionRoutes = require('./notificacion.routes');

// ==========================================================
// 🔹 RUTAS PRINCIPALES (SIN /api AQUÍ)
// ==========================================================
router.use('/users', userRoutes);
router.use('/trabajador', trabajadorRoutes);
router.use('/perfil-laboral', perfilLaboralRoutes);
router.use('/perfil', perfilRoutes);
router.use('/servicios', servicioRoutes);
router.use('/transactions', transactionRoutes);

// ==========================================================
// 🔹 RUTAS EMPLEADOR
// ==========================================================
router.use('/empleadores', empleadorRoutes);
router.use('/perfil-empleador', perfilEmpleadorRoutes);
router.use('/trabajos', trabajoRoutes);
router.use('/postulaciones', postulacionRoutes);

// ==========================================================
// 🔹 NOTIFICACIONES
// ==========================================================
router.use('/notificaciones', notificacionRoutes);

// ==========================================================
// 🔹 LEGACY ROUTES (NO TOCAR)
// ✅ WRAPPERS para que NUNCA explote al arrancar por undefined
// ==========================================================
router.post('/register', (req, res) => action.addNew(req, res));
router.post('/login', (req, res) => action.authenticate(req, res));
router.get('/getinfo', (req, res) => action.getinfo(req, res));

router.post('/addpost', (req, res) => action.addPost(req, res));
router.get('/getallpost', (req, res) => action.getAllPost(req, res));
router.get('/getpostbyid/:id', (req, res) => action.getPostbyId(req, res));
router.get('/getpostbyauthorid/:id', (req, res) => action.getPostbyAuthorId(req, res));
router.get('/searchpost/:title', (req, res) => action.searchPost(req, res));
router.put('/updatepost/:id', (req, res) => action.updatePost(req, res));
router.delete('/deletepost/:id', (req, res) => action.deletePost(req, res));

// ==========================================================
// 🔹 TEST
// ==========================================================
router.get('/', (req, res) => res.send('THIS IS HOME'));
router.get('/dashboard', (req, res) => res.send('THIS IS DASHBOARD'));

module.exports = router;
