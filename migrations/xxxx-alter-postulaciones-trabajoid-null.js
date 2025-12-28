'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) permitir NULL en trabajoId (y servicioId también por seguridad)
    await queryInterface.changeColumn('postulaciones', 'trabajoId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.changeColumn('postulaciones', 'servicioId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // 2) (opcional pero recomendado) asegurar que SOLO UNO sea no-null
    // Nota: esto falla si ya tienes filas viejas con ambos null o ambos llenos.
    await queryInterface.sequelize.query(`
      ALTER TABLE "postulaciones"
      DROP CONSTRAINT IF EXISTS "postulaciones_trabajo_o_servicio_ck";
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "postulaciones"
      ADD CONSTRAINT "postulaciones_trabajo_o_servicio_ck"
      CHECK (
        (CASE WHEN "trabajoId" IS NULL THEN 0 ELSE 1 END) +
        (CASE WHEN "servicioId" IS NULL THEN 0 ELSE 1 END)
        = 1
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "postulaciones"
      DROP CONSTRAINT IF EXISTS "postulaciones_trabajo_o_servicio_ck";
    `);

    // ojo: esto puede fallar si ya tienes datos con trabajoId null
    await queryInterface.changeColumn('postulaciones', 'trabajoId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  }
};
