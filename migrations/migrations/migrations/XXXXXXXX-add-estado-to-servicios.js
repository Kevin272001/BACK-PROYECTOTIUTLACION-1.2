"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("servicios", "estado", {
      type: Sequelize.ENUM("activo", "expirado"),
      allowNull: false,
      defaultValue: "activo",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("servicios", "estado");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_servicios_estado";'
    );
  },
};
