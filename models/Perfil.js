'use strict';

module.exports = (sequelize, DataTypes) => {
  const Perfil = sequelize.define("Perfil", {
    nombreCompleto: DataTypes.STRING,
    telefono: DataTypes.STRING,
    direccion: DataTypes.STRING,
    categoria: DataTypes.STRING,
    experiencia: DataTypes.INTEGER,
    descripcion: DataTypes.TEXT,
    habilidades: DataTypes.JSON,
    fotoPerfil: DataTypes.STRING,
    cv: DataTypes.STRING,

    // =============================
    // 💳 DATOS BANCARIOS (SIMULADO)
    // =============================
    banco: DataTypes.STRING,
    tipoCuenta: DataTypes.STRING, // ahorros / corriente
    numeroCuenta: DataTypes.STRING,
    titularCuenta: DataTypes.STRING,
    cedulaTitular: DataTypes.STRING,
    qrCuentaUrl: DataTypes.STRING, // ruta del QR en /uploads
  }, {
    tableName: "perfil",   // 🔥 AQUÍ SE CREA LA TABLA NUEVA
    timestamps: true
  });

  return Perfil;
};
