'use strict';

const { User, Trabajador, Empleador, Post } = require('../models');
const jwt = require('jwt-simple');
const bcrypt = require('bcrypt');
require('dotenv').config();

const functions = {

  // =====================================================
  // 📌 REGISTRO DE USUARIO (FIX DEFINITIVO – COMO ANTES)
  // =====================================================
  addNew: async function (req, res) {
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
        ruc,
        responsable
      } = req.body;

      // 🔥 COMPATIBILIDAD TOTAL CON EL FRONT ANTIGUO
      // Si no mandan rol → trabajador (como antes)
      if (!rol) {
        rol = 'trabajador';
      }

      // Validación mínima (como antes)
      if (!nombre || !email || !password) {
        return res.json({
          success: false,
          msg: 'Faltan campos obligatorios',
        });
      }

      // Verificar email duplicado
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.json({
          success: false,
          msg: 'El correo ya está registrado',
        });
      }

      // Crear usuario
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        nombre,
        email,
        password: hashedPassword,
        rol,
      });

      // =====================
      // CREAR PERFIL SEGÚN ROL
      // =====================
      if (rol === 'trabajador') {
        await Trabajador.create({
          nombre,
          telefono: telefono || '',
          direccion: direccion || '',
          categoria: categoria || '',
          experiencia: experiencia || '',
          descripcion: descripcion || '',
          horario: '',
          userId: newUser.id,
        });
      }

      if (rol === 'empleador') {
        // Tipo: si mandan empresa o ruc asumimos Jurídica, caso contrario Natural
        const hasEmpresa = typeof empresa === 'string' && empresa.trim() !== '';
        const hasRuc = typeof ruc === 'string' && ruc.trim() !== '';
        const tipoEmpleador = (hasEmpresa || hasRuc) ? 'JURIDICA' : 'NATURAL';

        await Empleador.create({
          nombre,
          telefono: telefono || '',
          direccion: direccion || '',

          tipoEmpleador,
          empresa: empresa || '',
          ruc: ruc || '',
          responsable: responsable || '',
          userId: newUser.id,
        });
      }

      return res.json({
        success: true,
        msg: 'Usuario registrado exitosamente',
        user: newUser,
      });

    } catch (error) {
      console.error('❌ Error en addNew:', error);
      return res.status(500).json({
        success: false,
        msg: 'Error al registrar usuario',
      });
    }
  },

  // =====================================================
  // 📌 LOGIN (SIN TOCAR – FUNCIONA)
  // =====================================================
  authenticate: async function (req, res) {
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
        return res.status(403).json({
          success: false,
          msg: 'Usuario no encontrado',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(403).json({
          success: false,
          msg: 'Contraseña incorrecta',
        });
      }

      const payload = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      };

      const token = jwt.encode(payload, process.env.SECRET);

      // Perfil completo solo para trabajador
      let perfilCompleto = false;
      if (user.rol === 'trabajador') {
        const trabajador = await Trabajador.findOne({
          where: { userId: user.id },
        });
        perfilCompleto = !!trabajador;
      }

      return res.json({
        success: true,
        msg: 'Inicio de sesión exitoso',
        token,
        user: payload,
        rol: user.rol,
        perfilCompleto,
      });

    } catch (error) {
      console.error('❌ Error en authenticate:', error);
      return res.status(500).json({
        success: false,
        msg: 'Error al autenticar usuario',
      });
    }
  },

  // =====================================================
  // 📌 INFO DE USUARIO
  // =====================================================
  getinfo: function (req, res) {
    try {
      if (
        req.headers.authorization &&
        req.headers.authorization.split(' ')[0] === 'Bearer'
      ) {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.decode(token, process.env.SECRET);

        return res.json({
          success: true,
          msg: `Hola ${decodedToken.nombre}`,
          user: decodedToken,
        });
      }

      return res.json({
        success: false,
        msg: 'No se proporcionó token',
      });

    } catch (error) {
      console.error('❌ Error en getinfo:', error);
      return res.status(401).json({
        success: false,
        msg: 'Token inválido',
      });
    }
  },

  // =====================================================
  // 📌 POSTS (LEGACY – NO TOCADO)
  // =====================================================
  addPost: async function (req, res) {
    try {
      const { title, body, author, author_id } = req.body;

      if (!title || !body || !author || !author_id) {
        return res.json({
          success: false,
          msg: 'Por favor, ingrese todos los campos',
        });
      }

      const newPost = await Post.create({
        title,
        body,
        author,
        author_id,
      });

      return res.json({
        success: true,
        msg: 'Post guardado exitosamente',
        post: newPost,
      });

    } catch (error) {
      console.error('❌ Error en addPost:', error);
      return res.status(500).json({
        success: false,
        msg: 'Error al guardar post',
      });
    }
  },

  getAllPost: async function (req, res) {
    try {
      const posts = await Post.findAll();
      return res.json(posts);
    } catch (error) {
      console.error('❌ Error en getAllPost:', error);
      return res.status(500).json({
        success: false,
        msg: 'Error al obtener posts',
      });
    }
  },

};

module.exports = functions;
