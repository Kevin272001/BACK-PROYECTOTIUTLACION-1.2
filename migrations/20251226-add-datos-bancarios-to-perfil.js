"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "perfil";

    await queryInterface.sequelize.transaction(async (t) => {
      const table = await queryInterface.describeTable(tableName, { transaction: t });

      const addIfMissing = async (col, def) => {
        if (!table[col]) {
          await queryInterface.addColumn(tableName, col, def, { transaction: t });
        }
      };

      await addIfMissing("banco", {
        type: Sequelize.STRING,
        allowNull: true,
      });

      await addIfMissing("tipoCuenta", {
        type: Sequelize.STRING,
        allowNull: true,
      });

      await addIfMissing("numeroCuenta", {
        type: Sequelize.STRING,
        allowNull: true,
      });

      await addIfMissing("titularCuenta", {
        type: Sequelize.STRING,
        allowNull: true,
      });

      await addIfMissing("cedulaTitular", {
        type: Sequelize.STRING,
        allowNull: true,
      });

      await addIfMissing("qrCuentaUrl", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    });
  },

  async down(queryInterface) {
    const tableName = "perfil";

    await queryInterface.sequelize.transaction(async (t) => {
      const table = await queryInterface.describeTable(tableName, { transaction: t });

      const removeIfExists = async (col) => {
        if (table[col]) {
          await queryInterface.removeColumn(tableName, col, { transaction: t });
        }
      };

      await removeIfExists("qrCuentaUrl");
      await removeIfExists("cedulaTitular");
      await removeIfExists("titularCuenta");
      await removeIfExists("numeroCuenta");
      await removeIfExists("tipoCuenta");
      await removeIfExists("banco");
    });
  },
};
