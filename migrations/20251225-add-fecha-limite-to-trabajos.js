"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("trabajos");

    // ✅ Agregar columna si no existe
    if (!table.fechaLimite) {
      await queryInterface.addColumn("trabajos", "fechaLimite", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
      console.log("✔ Columna fechaLimite agregada a trabajos");
    } else {
      console.log("⚠ La columna fechaLimite ya existe, se omite");
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("trabajos");

    if (table.fechaLimite) {
      await queryInterface.removeColumn("trabajos", "fechaLimite");
    }
  },
};
