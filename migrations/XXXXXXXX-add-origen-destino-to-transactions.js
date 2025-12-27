'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // ======================================================
    // 1️⃣ AGREGAR COLUMNAS PERMITIENDO NULL (SIN FK AÚN)
    // ======================================================
    await queryInterface.addColumn('Transactions', 'origenUserId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('Transactions', 'destinoUserId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('Transactions', 'estado', {
      type: Sequelize.ENUM('pendiente', 'pagado', 'revertido'),
      defaultValue: 'pagado',
    });

    // ======================================================
    // 2️⃣ LIMPIAR TRANSACCIONES HUÉRFANAS
    // (userId que NO existe en Users)
    // ======================================================
    await queryInterface.sequelize.query(`
      DELETE FROM "Transactions"
      WHERE "userId" NOT IN (SELECT id FROM "Users")
    `);

    // ======================================================
    // 3️⃣ RELLENAR DATOS EXISTENTES (SELF → SELF)
    // ======================================================
    await queryInterface.sequelize.query(`
      UPDATE "Transactions"
      SET "origenUserId" = "userId",
          "destinoUserId" = "userId"
      WHERE "origenUserId" IS NULL
    `);

    // ======================================================
    // 4️⃣ AHORA SÍ: AGREGAR FOREIGN KEYS
    // ======================================================
    await queryInterface.addConstraint('Transactions', {
      fields: ['origenUserId'],
      type: 'foreign key',
      name: 'fk_transactions_origen_user',
      references: {
        table: 'Users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    });

    await queryInterface.addConstraint('Transactions', {
      fields: ['destinoUserId'],
      type: 'foreign key',
      name: 'fk_transactions_destino_user',
      references: {
        table: 'Users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    });

    // ======================================================
    // 5️⃣ FORZAR NOT NULL (YA ES SEGURO)
    // ======================================================
    await queryInterface.changeColumn('Transactions', 'origenUserId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.changeColumn('Transactions', 'destinoUserId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'Transactions',
      'fk_transactions_origen_user'
    );
    await queryInterface.removeConstraint(
      'Transactions',
      'fk_transactions_destino_user'
    );

    await queryInterface.removeColumn('Transactions', 'origenUserId');
    await queryInterface.removeColumn('Transactions', 'destinoUserId');
    await queryInterface.removeColumn('Transactions', 'estado');
  },
};
