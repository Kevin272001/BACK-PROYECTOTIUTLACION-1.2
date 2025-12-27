"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("perfils", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      userId: {
        type: Sequelize.INTEGER,
        references: { model: "users", key: "id" }, // ✔ CORREGIDO
        onDelete: "CASCADE",
      },

      nombreCompleto: { type: Sequelize.STRING, allowNull: false },
      telefono: { type: Sequelize.STRING },
      direccion: { type: Sequelize.STRING },
      categoria: { type: Sequelize.STRING },
      experiencia: { type: Sequelize.INTEGER, defaultValue: 0 },
      habilidades: { type: Sequelize.JSON, defaultValue: [] },
      fotoPerfil: { type: Sequelize.STRING },
      cv: { type: Sequelize.STRING },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("perfils");
  },
};
