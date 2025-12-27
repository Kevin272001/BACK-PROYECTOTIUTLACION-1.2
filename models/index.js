"use strict";
require("dotenv").config();
const Sequelize = require("sequelize");

// ==========================================================
// 🔹 Conexión con PostgreSQL
// ==========================================================
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

// ==========================================================
// 🔹 Objeto principal db
// ==========================================================
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ==========================================================
// 🔹 Importar MODELOS (SERVX ORIGINAL)
// ==========================================================
db.User = require("./User")(sequelize, Sequelize.DataTypes);
db.Trabajador = require("./trabajador")(sequelize, Sequelize.DataTypes);
db.PerfilLaboral = require("./perfilLaboral")(sequelize, Sequelize.DataTypes);
db.Perfil = require("./Perfil")(sequelize, Sequelize.DataTypes);
db.Servicio = require("./Servicio")(sequelize, Sequelize.DataTypes);

// ==========================================================
// 🔹 Importar MODELOS (EMPLEADOR)
// ==========================================================
db.Empleador = require("../empleador/models/empleador")(sequelize, Sequelize.DataTypes);
db.Trabajo = require("../empleador/models/trabajo")(sequelize, Sequelize.DataTypes);
db.PerfilEmpleador = require("../empleador/models/perfilEmpleador")(sequelize, Sequelize.DataTypes);
db.Postulacion = require("../empleador/models/postulacion")(sequelize, Sequelize.DataTypes);

// ==========================================================
// 🔹 Importar MODELO DE NOTIFICACIONES (UNIFICADO)
// ==========================================================
db.Notificacion = require("./Notificacion")(sequelize, Sequelize.DataTypes);

// ==========================================================
// 🔹 Importar MODELO Solicitud del Trabajador
// ==========================================================
db.SolicitudTrabajo = require("./SolicitudTrabajo")(sequelize, Sequelize.DataTypes);

// ==========================================================
// 🔹 Importar modelo de billetera
// ==========================================================
db.Transaction = require("./transaction")(sequelize, Sequelize.DataTypes);

// ==========================================================
// 🔹 ASOCIACIONES (SERVX)
// ==========================================================

// Usuario → Servicios (1:N)
db.User.hasMany(db.Servicio, { foreignKey: "userId", as: "servicios" });
db.Servicio.belongsTo(db.User, { foreignKey: "userId", as: "autorServicio" });

// Usuario → Trabajador (1:1)
db.User.hasOne(db.Trabajador, { foreignKey: "userId", as: "trabajador" });
db.Trabajador.belongsTo(db.User, { foreignKey: "userId", as: "dueño" });

// Usuario → Perfil Laboral
db.User.hasOne(db.PerfilLaboral, { foreignKey: "userId", as: "perfilLaboral" });
db.PerfilLaboral.belongsTo(db.User, { foreignKey: "userId", as: "usuarioPerfilLaboral" });

// Usuario → Perfil Profesional
db.User.hasOne(db.Perfil, { foreignKey: "userId", as: "perfil" });
db.Perfil.belongsTo(db.User, { foreignKey: "userId", as: "usuarioPerfil" });

// ==========================================================
// 🔹 ASOCIACIONES (EMPLEADOR)
// ==========================================================
db.User.hasOne(db.Empleador, { foreignKey: "userId", as: "empleador" });
db.Empleador.belongsTo(db.User, { foreignKey: "userId", as: "usuarioEmpleador" });

db.Empleador.hasMany(db.Trabajo, { foreignKey: "empleadorId", as: "trabajos" });
db.Trabajo.belongsTo(db.Empleador, { foreignKey: "empleadorId", as: "empleador" });

db.Empleador.hasOne(db.PerfilEmpleador, { foreignKey: "empleadorId", as: "perfilEmpleador" });
db.PerfilEmpleador.belongsTo(db.Empleador, { foreignKey: "empleadorId", as: "usuarioDelPerfil" });

// ==========================================================
// ✅ ASOCIACIONES: SERVICIO ↔ POSTULACION (empleador → trabajador)
// ==========================================================
//
// Esto permite que cuando consultes servicios, puedas traer:
// servicio.postulaciones[]
//
// ⚠️ NO ponemos Postulacion.belongsTo(Servicio, as:'servicio')
// porque esa relación YA está en empleador/models/postulacion.js
// con alias "servicioPostulado" para NO chocar con nada.
// ==========================================================

// Servicio → Postulaciones (1:N)
db.Servicio.hasMany(db.Postulacion, {
  foreignKey: "servicioId",
  as: "postulaciones",
});

// ==========================================================
// ✅ ASOCIACIONES: TRABAJO ↔ POSTULACION (trabajador → empleador)
// ==========================================================
//
// Útil si luego quieres ver postulaciones por trabajo.
// El belongsTo(Trabajo, as:"trabajo") ya está en el modelo Postulacion.
// ==========================================================
db.Trabajo.hasMany(db.Postulacion, {
  foreignKey: "trabajoId",
  as: "postulaciones",
});

// ==========================================================
// 🔹 ASOCIACIONES (SOLICITUDES TRABAJADOR)
// ==========================================================
db.User.hasMany(db.SolicitudTrabajo, { foreignKey: "userId", as: "solicitudes" });
db.Trabajo.hasMany(db.SolicitudTrabajo, { foreignKey: "trabajoId", as: "solicitudesDeTrabajo" });
db.SolicitudTrabajo.belongsTo(db.Trabajo, { foreignKey: "trabajoId", as: "trabajoDelSolicitante" });

// ==========================================================
// 🔹 ASOCIACIONES (BILLETERA)
// ==========================================================
db.User.hasMany(db.Transaction, { foreignKey: "userId", as: "transacciones" });
db.Transaction.belongsTo(db.User, { foreignKey: "userId", as: "usuarioTransaccion" });

// ==========================================================
// 🔹 Ejecutar associate() de cada modelo
// ==========================================================
Object.keys(db).forEach((modelName) => {
  if (db[modelName] && db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// ==========================================================
// 🔹 Exportar db
// ==========================================================
module.exports = db;
