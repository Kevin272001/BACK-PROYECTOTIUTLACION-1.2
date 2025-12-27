"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Notificacion extends Model {
    static associate(models) {
      
      // 🔹 Usuario dueño de la notificación (quien la recibe)
      Notificacion.belongsTo(models.User, {
        as: "usuarioNotificacion",
        foreignKey: "userId",
      });

      // 🔹 Trabajo relacionado a la notificación
      Notificacion.belongsTo(models.Trabajo, {
        as: "trabajo",
        foreignKey: "trabajoId",
      });

      // 🔹 Empleador relacionado (cuando la notificación es para él)
      Notificacion.belongsTo(models.Empleador, {
        as: "empleador",
        foreignKey: "empleadorId",
      });
    }
  }

  Notificacion.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      trabajoId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Puede ser null si no aplica
      },
      empleadorId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Puede ser null si es para trabajador
      },
      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mensaje: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      leido: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Notificacion",
      tableName: "notificaciones",
      timestamps: true,
    }
  );

  return Notificacion;
};
