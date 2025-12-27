'use strict';

const {
  User,
  Trabajador,
  Empleador,
  PerfilLaboral,
  PerfilEmpleador
} = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'TU_SECRETO_JWT_AQUI';

module.exports = {

  // =====================================================
  // REGISTRO (NO SE TOCA)
  // =====================================================
  async registrar(req, res) {
    try {
      let {
        nombre,
        email,
        password,
        rol,
        telefono,
        direccion,
        categoria,
        experiencia,
        descripcion,
        empresa,
        ruc
      } = req.body;

      if (!rol) rol = 'trabajador';

      if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      const existe = await User.findOne({ where: { email } });
      if (existe) {
        return res.status(400).json({ error: 'Correo ya registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        nombre,
        email,
        password: hashedPassword,
        rol,
      });

      let trabajador = null;
      let empleador = null;

      if (rol === 'trabajador') {
        trabajador = await Trabajador.create({
          nombre,
          telefono: telefono || '',
          direccion: direccion || '',
          categoria: categoria || '',
          experiencia: experiencia || '',
          descripcion: descripcion || '',
          horario: '',
          userId: user.id,
        });
      }

      if (rol === 'empleador') {
        empleador = await Empleador.create({
          nombre,
          empresa: empresa || '',
          ruc: ruc || '',
          telefono: telefono || '',
          userId: user.id,
        });
      }

      return res.status(200).json({
        mensaje: 'Usuario registrado correctamente',
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
        },
        trabajador,
        empleador,
      });

    } catch (error) {
      console.error('ERROR REGISTER:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // =====================================================
  // LOGIN (CORRECTO Y DEFINITIVO)
  // =====================================================
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.json({
          success: false,
          msg: 'Faltan credenciales',
        });
      }

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(400).json({ error: 'Contraseña incorrecta' });
      }

      const token = jwt.sign(
        { id: user.id, rol: user.rol },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      // ===============================
      // 🔹 BUSCAR PERFIL SEGÚN ROL
      // ===============================
      let empleadorData = null;
      let trabajadorData = null;
      let perfilCompleto = false;

      if (user.rol === 'empleador') {
        const empleador = await Empleador.findOne({
          where: { userId: user.id },
        });

        if (empleador) {
          empleadorData = { id: empleador.id };

          const perfil = await PerfilEmpleador.findOne({
            where: { empleadorId: empleador.id },
          });

          perfilCompleto = !!perfil;
        }
      }

      if (user.rol === 'trabajador') {
        const trabajador = await Trabajador.findOne({
          where: { userId: user.id },
        });

        if (trabajador) {
          trabajadorData = { id: trabajador.id };

          const perfil = await PerfilLaboral.findOne({
            where: { userId: user.id },
          });

          perfilCompleto = !!perfil;
        }
      }

      // ===============================
      // 🔥 RESPUESTA FINAL
      // ===============================
      return res.json({
        success: true,
        msg: 'Inicio de sesión exitoso',
        token,
        rol: user.rol,
        perfilCompleto,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
        },
        empleador: empleadorData,
        trabajador: trabajadorData,
      });

    } catch (error) {
      console.error('ERROR LOGIN:', error);
      return res.status(500).json({ error: 'Error en login' });
    }
  },

};
