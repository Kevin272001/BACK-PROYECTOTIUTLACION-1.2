'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {

      // Usuario dueño de la transacción (para consultas)
      Transaction.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'usuario'
      });

      // Quién paga
      Transaction.belongsTo(models.User, {
        foreignKey: 'origenUserId',
        as: 'origen'
      });

      // Quién recibe
      Transaction.belongsTo(models.User, {
        foreignKey: 'destinoUserId',
        as: 'destino'
      });
    }
  }

  Transaction.init(
    {
      // Dueño de la transacción (empleador o trabajador)
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      // Quién paga
      origenUserId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      // Quién recibe
      destinoUserId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      monto: {
        type: DataTypes.FLOAT,
        allowNull: false
      },

      // ingreso | gasto
      tipo: {
        type: DataTypes.ENUM('ingreso', 'gasto'),
        allowNull: false
      },

      descripcion: {
        type: DataTypes.STRING
      },

      // Trabajo o servicio relacionado
      servicioId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      trabajoId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },


      // ✅ Evidencia del pago (imagen) + fecha (billetera informativa)
      comprobanteUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fechaPago: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Estado del pago
      estado: {
        type: DataTypes.ENUM('pendiente', 'pagado', 'revertido'),
        defaultValue: 'pagado'
      }
    },
    {
      sequelize,
      modelName: 'Transaction',
      tableName: 'Transactions'
    }
  );

  return Transaction;
};