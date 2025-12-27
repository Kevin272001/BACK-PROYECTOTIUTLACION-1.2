"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PerfilEmpleador extends Model {
    static associate(models) {
      PerfilEmpleador.belongsTo(models.Empleador, {
        foreignKey: "empleadorId",
        as: "empleadorInfo",
        onDelete: "CASCADE",
      });
    }
  }

  PerfilEmpleador.init(
    {
      empleadorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      // ===== CAMPOS EXISTENTES =====
      ubicacion: DataTypes.STRING,
      categoria: DataTypes.STRING,
      experiencia: DataTypes.INTEGER,
      biografia: DataTypes.TEXT,
      habilidades: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      fotoUrl: DataTypes.STRING,
      cvUrl: DataTypes.STRING,

      // ===== NUEVOS CAMPOS =====
      tipoEmpleador: {
        type: DataTypes.ENUM("NATURAL", "JURIDICA"),
        allowNull: false,
        defaultValue: "NATURAL",
      },

      empresaNombre: DataTypes.STRING,
      ruc: DataTypes.STRING,

      recordPolicialUrl: DataTypes.STRING,

      // =============================
      // 💳 DATOS BANCARIOS (SIMULADO)
      // =============================
      banco: DataTypes.STRING,
      tipoCuenta: DataTypes.STRING,
      numeroCuenta: DataTypes.STRING,
      titularCuenta: DataTypes.STRING,
      cedulaTitular: DataTypes.STRING,
      qrCuentaUrl: DataTypes.STRING,

      estadoVerificacion: {
        type: DataTypes.ENUM("pendiente", "aprobado", "rechazado"),
        defaultValue: "pendiente",
      },
    },
    {
      sequelize,
      modelName: "PerfilEmpleador",
      tableName: "perfiles_empleadores",
      timestamps: true,
    }
  );

  return PerfilEmpleador;
};
