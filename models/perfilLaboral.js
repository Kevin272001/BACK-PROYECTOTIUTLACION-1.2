"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PerfilLaboral extends Model {
    static associate(models) {
      // ❗ NO DEFINIMOS belongsTo AQUÍ
      // La asociación está en models/index.js
    }
  }

  PerfilLaboral.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      // ✅ NUEVO: tipo de persona (mejor STRING para no romper sync alter)
      tipoPersona: {
        type: DataTypes.STRING, // "NATURAL" | "JURIDICA"
        allowNull: false,
        defaultValue: "NATURAL",
      },

      nombreCompleto: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      cedulaRuc: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      telefono: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      nombreComercial: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      categoria: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      descripcion: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      direccion: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      horario: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      experiencia: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      // ✅ NUEVO: URL del récord policial guardado
      recordPolicialUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "PerfilLaboral",
      tableName: "perfiles_laborales",
      timestamps: true,
    }
  );

  return PerfilLaboral;
};
