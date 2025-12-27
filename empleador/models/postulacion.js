"use strict";

module.exports = (sequelize, DataTypes) => {
  const Postulacion = sequelize.define(
    "Postulacion",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      // quien postula (empleador o trabajador)
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      // ✅ Postulación a TRABAJO (trabajador → empleador)
      // ahora puede ser null porque también habrá postulaciones a servicios
      trabajoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      // ✅ Postulación a SERVICIO (empleador → trabajador)
      servicioId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      mensaje: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      estado: {
        type: DataTypes.ENUM("pendiente", "aceptado", "rechazado"),
        defaultValue: "pendiente",
      },
    },
    {
      tableName: "postulaciones",
      timestamps: true,
    }
  );

  Postulacion.associate = (models) => {
    // ======================================================
    // 👤 Postulante (User)
    // ======================================================
    Postulacion.belongsTo(models.User, {
      as: "postulante",
      foreignKey: "userId",
    });

    // ======================================================
    // 💼 Relación con Trabajo (si aplica)
    // ======================================================
    Postulacion.belongsTo(models.Trabajo, {
      as: "trabajo", // ✅ ok, no choca normalmente
      foreignKey: "trabajoId",
    });

    // ======================================================
    // 🧰 Relación con Servicio (si aplica)
    // ⚠️ IMPORTANTE: alias ÚNICO para que no choque
    // ======================================================
    Postulacion.belongsTo(models.Servicio, {
      as: "servicioPostulado", // ✅ NO uses "servicio"
      foreignKey: "servicioId",
    });
  };

  return Postulacion;
};
