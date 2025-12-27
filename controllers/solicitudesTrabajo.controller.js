const { SolicitudTrabajo, Trabajo, Empleador } = require("../models");
const { crearNotificacion } = require("../methods/notificar");

module.exports = {
  // ======================================================
  // 🔹 Crear solicitud (TRABAJADOR se postula)
  // ======================================================
  async crear(req, res) {
    try {
      const { trabajoId, userId, mensaje } = req.body;

      if (!trabajoId || !userId) {
        return res.status(400).json({ error: "Faltan datos" });
      }

      // Verificar si ya existe postulación
      const existe = await SolicitudTrabajo.findOne({
        where: { trabajoId, userId },
      });

      if (existe) {
        return res.status(400).json({ error: "Ya estás postulado" });
      }

      // Crear solicitud
      const nueva = await SolicitudTrabajo.create({
        trabajoId,
        userId,
        mensaje: mensaje || "",
        estado: "pendiente",
      });

      // =======================
      // 🔔 NOTIFICAR AL EMPLEADOR
      // =======================
      const trabajo = await Trabajo.findByPk(trabajoId);
      if (!trabajo) {
        return res.status(404).json({ error: "Trabajo no existe" });
      }

      const empleador = await Empleador.findByPk(trabajo.empleadorId);

      if (empleador) {
        await crearNotificacion(empleador.userId, {
          titulo: "Nueva postulación recibida",
          mensaje: `Un trabajador se ha postulado a tu trabajo: "${trabajo.titulo}".`,
          trabajoId: trabajo.id,       // 🔥 CLAVE
          empleadorId: empleador.id,
        });
      }

      return res.json(nueva);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al crear solicitud" });
    }
  },

  // ======================================================
  // 🔹 Obtener mis solicitudes (TRABAJADOR)
  // ======================================================
  async listarMisSolicitudes(req, res) {
    try {
      const { userId } = req.params;

      const solicitudes = await SolicitudTrabajo.findAll({
        where: { userId },
        include: [
          {
            model: Trabajo,
            as: "trabajoAsociado", // 🔥 MISMO alias del modelo
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      return res.json(solicitudes);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al obtener solicitudes" });
    }
  },

  // ======================================================
  // 🔹 ACEPTAR solicitud (EMPLEADOR)
  // ======================================================
  async aceptar(req, res) {
    try {
      const { id } = req.params;

      const solicitud = await SolicitudTrabajo.findByPk(id);
      if (!solicitud) {
        return res.status(404).json({ error: "Solicitud no existe" });
      }

      solicitud.estado = "aceptada";
      await solicitud.save();

      // Obtener trabajo para mensaje correcto
      const trabajo = await Trabajo.findByPk(solicitud.trabajoId);

      // 🔔 NOTIFICAR AL TRABAJADOR
      await crearNotificacion(solicitud.userId, {
        titulo: "Postulación aceptada",
        mensaje: trabajo
          ? `Tu postulación al trabajo "${trabajo.titulo}" fue aceptada.`
          : "Tu postulación fue aceptada.",
        trabajoId: solicitud.trabajoId, // 🔥 CLAVE
      });

      return res.json({
        mensaje: "Solicitud aceptada",
        solicitud,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al aceptar solicitud" });
    }
  },

  // ======================================================
  // 🔹 RECHAZAR solicitud (EMPLEADOR)
  // ======================================================
  async rechazar(req, res) {
    try {
      const { id } = req.params;

      const solicitud = await SolicitudTrabajo.findByPk(id);
      if (!solicitud) {
        return res.status(404).json({ error: "Solicitud no existe" });
      }

      solicitud.estado = "rechazada";
      await solicitud.save();

      const trabajo = await Trabajo.findByPk(solicitud.trabajoId);

      // 🔔 NOTIFICAR AL TRABAJADOR
      await crearNotificacion(solicitud.userId, {
        titulo: "Postulación rechazada",
        mensaje: trabajo
          ? `Tu postulación al trabajo "${trabajo.titulo}" fue rechazada.`
          : "Tu postulación fue rechazada.",
        trabajoId: solicitud.trabajoId, // 🔥 CLAVE
      });

      return res.json({
        mensaje: "Solicitud rechazada",
        solicitud,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al rechazar solicitud" });
    }
  },
};
