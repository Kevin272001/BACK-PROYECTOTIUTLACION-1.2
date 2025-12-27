'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tabla real usada por el modelo: "empleadores"
    await queryInterface.addColumn('empleadores', 'record_policial_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('empleadores', 'record_policial_url');
  },
};
