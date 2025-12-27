'use strict';

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');
const path = require('path');
require('dotenv').config();

// ==========================================================
// 🔹 Router principal (ÚNICO)
// ==========================================================
const routes = require('./routes/index'); // TODAS las rutas están ahí

// ==========================================================
// 🔹 Sequelize
// ==========================================================
const { sequelize } = require('./models');

const app = express();

// ==========================================================
// 🔹 Middlewares globales
// ==========================================================
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan('dev'));

// Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================================
// 🔹 Passport JWT
// ==========================================================
app.use(passport.initialize());
require('./config/passport')(passport);

// ==========================================================
// 🔹 RUTAS (SOLO UNA VEZ, SIN DUPLICAR)
// ==========================================================
 app.use('/api', routes);


// ==========================================================
// 🔹 Sincronizar modelos con la base de datos
// ==========================================================
sequelize.sync({ alter: true })
  .then(() => console.log('✅ Tablas sincronizadas correctamente'))
  .catch(err => console.error('❌ Error sincronizando tablas:', err));

// ==========================================================
// 🔹 Conexión con PostgreSQL
// ==========================================================
sequelize.authenticate()
  .then(() => console.log('✅ Conectado correctamente a PostgreSQL'))
  .catch(err => console.error('❌ Error al conectar a PostgreSQL:', err));

// ==========================================================
// 🔹 Iniciar Servidor
// ==========================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
