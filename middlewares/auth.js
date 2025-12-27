'use strict';

const jwt = require('jwt-simple');
require('dotenv').config();

module.exports = (req, res, next) => {
  const header = req.headers['authorization'];

  if (!header) {
    return res.status(401).json({ success: false, msg: 'No se proporcionó token' });
  }

  const token = header.replace('Bearer ', '');

  try {
    const decoded = jwt.decode(token, process.env.SECRET);

    req.user = decoded; // 👈 Aquí guardamos el usuario

    next();
  } catch (error) {
    console.error('❌ Error al validar token:', error);
    return res.status(401).json({ success: false, msg: 'Token inválido' });
  }
};
