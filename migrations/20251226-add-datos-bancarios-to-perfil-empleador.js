"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("perfiles_empleadores", "banco", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("perfiles_empleadores", "tipoCuenta", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("perfiles_empleadores", "numeroCuenta", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("perfiles_empleadores", "titularCuenta", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("perfiles_empleadores", "cedulaTitular", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("perfiles_empleadores", "qrCuentaUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("perfiles_empleadores", "qrCuentaUrl");
    await queryInterface.removeColumn("perfiles_empleadores", "cedulaTitular");
    await queryInterface.removeColumn("perfiles_empleadores", "titularCuenta");
    await queryInterface.removeColumn("perfiles_empleadores", "numeroCuenta");
    await queryInterface.removeColumn("perfiles_empleadores", "tipoCuenta");
    await queryInterface.removeColumn("perfiles_empleadores", "banco");
  },
};
