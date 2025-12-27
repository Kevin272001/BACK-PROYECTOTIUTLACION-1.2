"use strict";

module.exports = (sequelize, DataTypes) => {
  const Trabajo = sequelize.define(
    "Trabajo",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      // 🔵 Usuario que creó el trabajo (opcional)
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      // 🟠 Empleador que publica el trabajo
      empleadorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "empleadores",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      descripcion: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      salario: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      ubicacion: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      categoria: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // 📅 Fecha límite para postular / vigencia del trabajo
      // (YYYY-MM-DD)
      fechaLimite: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      // 🟡 Estado general del trabajo
      estado: {
        type: DataTypes.ENUM("activo", "pausado", "finalizado"),
        allowNull: false,
        defaultValue: "activo",
      },

      // ✅ Resultado final (SOLO cuando está finalizado)
      estadoFinal: {
        type: DataTypes.ENUM("exitoso", "malo"),
        allowNull: true,
      },
    },
    {
      tableName: "trabajos",
      timestamps: true,
    }
  );

  Trabajo.associate = (models) => {
    // Relaciones futuras
  };

  return Trabajo;
};
