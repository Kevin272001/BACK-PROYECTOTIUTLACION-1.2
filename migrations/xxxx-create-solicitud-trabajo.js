"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("SolicitudTrabajos", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      trabajoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      mensaje: {
        type: Sequelize.TEXT,
      },

      estado: {
        type: Sequelize.ENUM("pendiente", "aceptada", "rechazada"),
        defaultValue: "pendiente",
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("SolicitudTrabajos");
  },
};
