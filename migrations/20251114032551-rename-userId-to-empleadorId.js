'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("perfiles_empleadores");

    // 🔍 Solo renombrar SI existe la columna userId
    if (table.userId) {
      await queryInterface.renameColumn(
        "perfiles_empleadores",
        "userId",
        "empleadorId"
      );
      console.log("✔ userId renombrado a empleadorId");
    } else {
      console.log("⚠ La columna userId no existe, se omite el rename");
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("perfiles_empleadores");

    if (table.empleadorId) {
      await queryInterface.renameColumn(
        "perfiles_empleadores",
        "empleadorId",
        "userId"
      );
    }
  },
};
