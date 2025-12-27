"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Tabla: perfil (trabajador)
    await queryInterface.addColumn("perfil", "banco", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("perfil", "tipoCuenta", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("perfil", "numeroCuenta", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("perfil", "titularCuenta", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("perfil", "cedulaTitular", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("perfil", "qrCuentaUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("perfil", "qrCuentaUrl");
    await queryInterface.removeColumn("perfil", "cedulaTitular");
    await queryInterface.removeColumn("perfil", "titularCuenta");
    await queryInterface.removeColumn("perfil", "numeroCuenta");
    await queryInterface.removeColumn("perfil", "tipoCuenta");
    await queryInterface.removeColumn("perfil", "banco");
  },
};
