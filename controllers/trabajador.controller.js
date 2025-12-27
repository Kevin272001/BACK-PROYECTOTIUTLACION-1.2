const { User, Trabajador } = require('../models');

module.exports = {

  // =====================================================
  // OBTENER TRABAJADOR POR userId
  // =====================================================
  async obtenerPorUser(req, res) {
    try {
      const { userId } = req.params;

      const trabajador = await Trabajador.findOne({
        where: { userId },
        include: [
          { model: User, as: 'usuario', attributes: ['id', 'nombre', 'email', 'rol'] }
        ]
      });

      if (!trabajador) {
        return res.status(404).json({ error: "El trabajador no existe." });
      }

      res.json(trabajador);
    } catch (error) {
      console.error("Error obtener trabajador:", error);
      res.status(500).json({ error: "Error interno al obtener el trabajador." });
    }
  },

  // =====================================================
  // CREAR TRABAJADOR
  // =====================================================
  async crear(req, res) {
    try {
      const { telefono, direccion, categoria, experiencia, descripcion, horario, fotoPerfil, userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "Falta el userId." });
      }

      const existe = await Trabajador.findOne({ where: { userId } });
      if (existe) {
        return res.status(400).json({ error: "El usuario ya tiene un perfil de trabajador." });
      }

      const trabajador = await Trabajador.create({
        telefono,
        direccion,
        categoria,
        experiencia,
        descripcion,
        horario,
        fotoPerfil,
        userId
      });

      res.status(201).json({ mensaje: "Trabajador creado correctamente", trabajador });
    } catch (error) {
      console.error("Error crear trabajador:", error);
      res.status(500).json({ error: "Error interno al crear trabajador." });
    }
  },

  // =====================================================
  // ACTUALIZAR TRABAJADOR
  // =====================================================
  async actualizar(req, res) {
    try {
      const { userId } = req.params;
      const datos = req.body;

      const trabajador = await Trabajador.findOne({ where: { userId } });

      if (!trabajador) {
        return res.status(404).json({ error: "El trabajador no existe." });
      }

      await trabajador.update(datos);

      res.json({
        mensaje: "Trabajador actualizado correctamente",
        trabajador
      });
    } catch (error) {
      console.error("Error actualizar trabajador:", error);
      res.status(500).json({ error: "Error interno al actualizar trabajador." });
    }
  },

  // =====================================================
  // ELIMINAR TRABAJADOR
  // =====================================================
  async eliminar(req, res) {
    try {
      const { userId } = req.params;

      const trabajador = await Trabajador.findOne({ where: { userId } });

      if (!trabajador) {
        return res.status(404).json({ error: "El trabajador no existe." });
      }

      await trabajador.destroy();

      res.json({ mensaje: "Perfil de trabajador eliminado correctamente." });
    } catch (error) {
      console.error("Error eliminar trabajador:", error);
      res.status(500).json({ error: "Error interno al eliminar trabajador." });
    }
  },

  // =====================================================
  // LISTAR TODOS LOS TRABAJADORES
  // =====================================================
  async listar(req, res) {
    try {
      const trabajadores = await Trabajador.findAll({
        include: [
          { model: User, as: 'usuario', attributes: ['id', 'nombre', 'email', 'rol'] }
        ]
      });

      res.json(trabajadores);
    } catch (error) {
      console.error("Error listar trabajadores:", error);
      res.status(500).json({ error: "Error interno al listar trabajadores." });
    }
  }

};
////
const { trabajador, user, perfilLaboral } = require("../models");

module.exports.buscarPerfiles = async (req, res) => {
  try {
    const { categoria, experiencia } = req.query;

    const where = {};
    if (categoria) where.categoria = categoria;
    if (experiencia) where.experiencia = experiencia;

    const trabajadores = await trabajador.findAll({
      where,
      include: [
        {
          model: user,
          attributes: ["id", "nombre", "email"]
        },
        {
          model: perfilLaboral
        }
      ]
    });

    res.json(trabajadores);
  } catch (error) {
    console.error("❌ Error buscar perfiles:", error);
    res.status(500).json({ mensaje: "Error al buscar perfiles" });
  }
};
