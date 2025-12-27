'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ✅ Comprobante (imagen) + fecha de pago para la "billetera informativa"
    await queryInterface.addColumn('Transactions', 'comprobanteUrl', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Transactions', 'fechaPago', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Transactions', 'comprobanteUrl');
    await queryInterface.removeColumn('Transactions', 'fechaPago');
  }
};
