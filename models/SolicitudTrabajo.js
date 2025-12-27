"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SolicitudTrabajo extends Model {
    static associate(models) {

      // ⚠ belongsTo hacia User — NO se pone aquí
      // Sequelize lo genera automáticamente con User.hasMany()

      // 🔥 ÚNICO belongsTo hacia Trabajo
      SolicitudTrabajo.belongsTo(models.Trabajo, {
        foreignKey: "trabajoId",
        as: "trabajoAsociado",     // 🔥 alias NUEVO Y 100% ÚNICO
      });
    }
  }

  SolicitudTrabajo.init(
    {
      mensaje: DataTypes.TEXT,
      estado: {
        type: DataTypes.ENUM("pendiente", "aceptada", "rechazada"),
        defaultValue: "pendiente",
      },
      userId: DataTypes.INTEGER,
      trabajoId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "SolicitudTrabajo",
      tableName: "SolicitudTrabajos",
    }
  );

  return SolicitudTrabajo;
};
