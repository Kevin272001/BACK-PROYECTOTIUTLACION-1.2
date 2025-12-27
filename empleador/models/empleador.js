"use strict";

module.exports = (sequelize, DataTypes) => {
  const Empleador = sequelize.define(
    "Empleador",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      nombre: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // ==========================================================
      // ✅ PERFIL BÁSICO (para NATURAL / JURÍDICA)
      // ==========================================================
      // Estos campos permiten guardar lo que el usuario ingresa
      // en el registro (persona natural / empresa) y luego
      // mostrarlo/editarlo en "Mi Perfil" sin tocar notificaciones
      // ni el login.

      // Usar STRING en lugar de ENUM para evitar problemas de ALTER
      // en Postgres cuando se usa sequelize.sync({ alter: true }).
      tipoEmpleador: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "NATURAL",
      },

      empresa: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      ruc: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      responsable: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      telefono: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      direccion: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Foto opcional (si en algún punto la usan)
      foto_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // ✅ Récord policial (PDF o imagen)
      record_policial_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "empleadores",
      timestamps: true,
    }
  );

  // ==========================================================
  // 🔥 RELACIÓN CORRECTA
  // Cada Empleador pertenece a 1 usuario
  // ==========================================================
  Empleador.associate = (models) => {
    Empleador.belongsTo(models.User, {
      foreignKey: "userId",
      as: "usuario",
    });
  };

  return Empleador;
};
