"use strict";

const { User, Trabajador, PerfilLaboral } = require("../models");

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
          { model: User, as: "usuario", attributes: ["id", "nombre", "email", "rol"] },
          // Si tienes PerfilLaboral asociado al trabajador, lo puedes incluir:
          // { model: PerfilLaboral, as: "perfilLaboral" },
        ],
      });

      if (!trabajador) {
        return res.status(404).json({ error: "El trabajador no existe." });
      }

      return res.json(trabajador);
    } catch (error) {
      console.error("Error obtener trabajador:", error);
      return res.status(500).json({ error: "Error interno al obtener el trabajador." });
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
        userId,
      });

      return res.status(201).json({ mensaje: "Trabajador creado correctamente", trabajador });
    } catch (error) {
      console.error("Error crear trabajador:", error);
      return res.status(500).json({ error: "Error interno al crear trabajador." });
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

      return res.json({
        mensaje: "Trabajador actualizado correctamente",
        trabajador,
      });
    } catch (error) {
      console.error("Error actualizar trabajador:", error);
      return res.status(500).json({ error: "Error interno al actualizar trabajador." });
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

      return res.json({ mensaje: "Perfil de trabajador eliminado correctamente." });
    } catch (error) {
      console.error("Error eliminar trabajador:", error);
      return res.status(500).json({ error: "Error interno al eliminar trabajador." });
    }
  },

  // =====================================================
  // LISTAR TODOS LOS TRABAJADORES (con usuario)
  // =====================================================
  async listar(req, res) {
    try {
      const trabajadores = await Trabajador.findAll({
        include: [{ model: User, as: "usuario", attributes: ["id", "nombre", "email", "rol"] }],
      });

      return res.json(trabajadores);
    } catch (error) {
      console.error("Error listar trabajadores:", error);
      return res.status(500).json({ error: "Error interno al listar trabajadores." });
    }
  },

  // =====================================================
  // BUSCAR PERFILES (lo que usa tu pantalla BuscarPerfiles)
  // ✅ Devuelve nombre/email en RAÍZ para que Flutter use t.nombre y t.email
  // =====================================================
  async buscarPerfiles(req, res) {
    try {
      const { categoria, experiencia } = req.query;

      const where = {};
      if (categoria) where.categoria = categoria;
      if (experiencia) where.experiencia = experiencia;

      const trabajadores = await Trabajador.findAll({
        where,
        include: [
          {
            model: User,
            as: "usuario", // ✅ IMPORTANTE: tu relación usa alias "usuario"
            attributes: ["id", "nombre", "email", "rol"],
          },
          // Si existe esta relación en tu proyecto, la puedes dejar:
          // { model: PerfilLaboral, as: "perfilLaboral", required: false },
        ],
        order: [["createdAt", "DESC"]],
      });

      // ✅ Flatten: nombre/email también arriba (para tu Flutter actual)
      const data = trabajadores.map((t) => {
        const plain = t.get({ plain: true });
        return {
          ...plain,
          nombre: plain.usuario?.nombre || "",
          email: plain.usuario?.email || "",
        };
      });

      return res.json(data);
    } catch (error) {
      console.error("❌ Error buscar perfiles:", error);
      return res.status(500).json({ mensaje: "Error al buscar perfiles" });
    }
  },
};
