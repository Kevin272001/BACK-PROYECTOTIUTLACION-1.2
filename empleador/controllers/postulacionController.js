"use strict";

const db = require("../../models");
const { Postulacion, User, Trabajo, Empleador, Servicio } = db;
const { crearNotificacion } = require("../../methods/notificar");

module.exports = {
  // ======================================================
  // ✅ CREAR POSTULACIÓN (TRABAJO o SERVICIO)
  // ======================================================
  async crear(req, res) {
    try {
      const { trabajoId, servicioId, userId, mensaje } = req.body;

      // ✅ ahora: userId obligatorio + (trabajoId o servicioId)
      if (!userId || (!trabajoId && !servicioId)) {
        return res.status(400).json({
          error: "userId y (trabajoId o servicioId) son obligatorios",
        });
      }

      // ✅ no permitir ambos a la vez
      if (trabajoId && servicioId) {
        return res.status(400).json({
          error: "Envía solo trabajoId o solo servicioId, no ambos",
        });
      }

      // ✅ validar usuario postulante
      const postulanteUser = await User.findByPk(userId);
      if (!postulanteUser) {
        return res.status(404).json({ error: "El usuario postulante no existe" });
      }

      // ======================================================
      // ✅ CASO A: Postulación a TRABAJO (trabajador → empleador)
      // ======================================================
      if (trabajoId) {
        // Evitar duplicadas
        const existe = await Postulacion.findOne({
          where: { trabajoId, userId },
        });

        if (existe) {
          return res.status(400).json({ error: "Ya postulaste a este trabajo" });
        }

        // Validar trabajo
        const trabajo = await Trabajo.findByPk(trabajoId);
        if (!trabajo) {
          return res.status(404).json({ error: "El trabajo no existe" });
        }

        // Validar empleador del trabajo
        if (!trabajo.empleadorId) {
          return res.status(400).json({
            error: "Este trabajo no tiene empleador asignado",
          });
        }

        const empleador = await Empleador.findByPk(trabajo.empleadorId);
        if (!empleador) {
          return res.status(404).json({ error: "El empleador no existe" });
        }

        // Crear postulación
        const nueva = await Postulacion.create({
          trabajoId,
          servicioId: null,
          userId,
          mensaje: mensaje || "",
          estado: "pendiente",
        });

        // Notificar al empleador (dueño del trabajo)
        await crearNotificacion(
          empleador.userId,
          "Nueva postulación recibida",
          `El trabajador ${
            postulanteUser.nombre || "Trabajador"
          } se postuló al trabajo "${trabajo.titulo}".`
        );

        return res.status(201).json({ ok: true, postulacion: nueva });
      }

      // ======================================================
      // ✅ CASO B: Postulación a SERVICIO (empleador → trabajador)
      // ======================================================
      if (servicioId) {
        // Evitar duplicadas
        const existe = await Postulacion.findOne({
          where: { servicioId, userId },
        });

        if (existe) {
          return res.status(400).json({ error: "Ya postulaste a este servicio" });
        }

        // Validar servicio
        const servicio = await Servicio.findByPk(servicioId);
        if (!servicio) {
          return res.status(404).json({ error: "El servicio no existe" });
        }

        // ✅ dueño del servicio (trabajador)
        const trabajadorUserId = servicio.userId;
        if (!trabajadorUserId) {
          return res.status(400).json({
            error: "Este servicio no tiene userId asignado",
          });
        }

        // Crear postulación
        const nueva = await Postulacion.create({
          trabajoId: null,
          servicioId,
          userId,
          mensaje: mensaje || "",
          estado: "pendiente",
        });

        // Notificar al trabajador (dueño del servicio)
        await crearNotificacion(
          trabajadorUserId,
          "Nueva postulación a tu servicio",
          `El empleador ${
            postulanteUser.nombre || "Empleador"
          } se postuló a tu servicio "${servicio.titulo}".`
        );

        return res.status(201).json({ ok: true, postulacion: nueva });
      }

      return res.status(400).json({ error: "Solicitud inválida" });
    } catch (error) {
      console.error("❌ Error al crear postulación:", error);
      return res.status(500).json({ error: "Error al crear postulación" });
    }
  },

  // ======================================================
  // 🔹 LISTAR POSTULACIONES DE UN TRABAJO (EMPLEADOR)
  // ======================================================
  async porTrabajo(req, res) {
    try {
      const { trabajoId } = req.params;

      const lista = await Postulacion.findAll({
        where: { trabajoId },
        include: [
          {
            model: User,
            as: "postulante",
            attributes: ["id", "nombre", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      const postulaciones = lista.map((p) => ({
        id: p.id,
        estado: p.estado,
        mensaje: p.mensaje,
        createdAt: p.createdAt,
        postulante: p.postulante
          ? {
              userId: p.postulante.id,
              nombre: p.postulante.nombre,
              email: p.postulante.email,
            }
          : null,
      }));

      return res.json({ postulaciones });
    } catch (error) {
      console.error("❌ Error al listar postulaciones (porTrabajo):", error);
      return res.status(500).json({ error: "Error al obtener postulaciones" });
    }
  },

  // ======================================================
  // ✅ LISTAR POSTULACIONES DE UN SERVICIO (TRABAJADOR)
  // ======================================================
  async porServicio(req, res) {
    try {
      const { servicioId } = req.params;

      const lista = await Postulacion.findAll({
        where: { servicioId },
        include: [
          {
            model: User,
            as: "postulante",
            attributes: ["id", "nombre", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      const postulaciones = lista.map((p) => ({
        id: p.id,
        estado: p.estado,
        mensaje: p.mensaje,
        createdAt: p.createdAt,
        postulante: p.postulante
          ? {
              userId: p.postulante.id,
              nombre: p.postulante.nombre,
              email: p.postulante.email,
            }
          : null,
      }));

      return res.json({ postulaciones });
    } catch (error) {
      console.error("❌ Error al listar postulaciones (porServicio):", error);
      return res.status(500).json({ error: "Error al obtener postulaciones" });
    }
  },

  // ======================================================
  // 🔹 LISTAR POSTULACIONES POR USUARIO (TRABAJADOR o EMPLEADOR)
  // ======================================================
  async porUsuario(req, res) {
    try {
      const { userId } = req.params;

      const postulaciones = await Postulacion.findAll({
        where: { userId },
        include: [
          {
            model: Trabajo,
            as: "trabajo",
            attributes: ["id", "titulo", "estado", "createdAt"],
            required: false,
          },
          {
            model: Servicio,
            as: "servicioPostulado", // ✅ ALIAS CORRECTO
            attributes: [
              "id",
              "titulo",
              "categoria",
              "ubicacion",
              "presupuesto",
              "createdAt",
            ],
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      return res.json({ postulaciones });
    } catch (error) {
      console.error("❌ Error al listar postulaciones del usuario:", error);
      return res
        .status(500)
        .json({ error: "Error al obtener postulaciones del usuario" });
    }
  },

  // ======================================================
  // 🔹 CAMBIAR ESTADO (aceptado / rechazado)
  // ======================================================
  async cambiarEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const estadosValidos = ["pendiente", "aceptado", "rechazado"];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: "Estado inválido" });
      }

      const post = await Postulacion.findByPk(id);
      if (!post) {
        return res.status(404).json({ error: "Postulación no encontrada" });
      }

      post.estado = estado;
      await post.save();

      // 🔔 Notificar al postulante
      await crearNotificacion(
        post.userId,
        "Estado de tu postulación",
        `Tu postulación fue ${estado}.`
      );

      return res.json({ ok: true, postulacion: post });
    } catch (error) {
      console.error("❌ Error al cambiar estado:", error);
      return res.status(500).json({ error: "Error al cambiar estado" });
    }
  },
};
