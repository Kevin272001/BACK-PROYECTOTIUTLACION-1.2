"use strict";

const db = require("../models");
const { Notificacion, User, Trabajo, Empleador } = db;

/* ==========================================================
   🔹 Crear notificación MANUAL (POST desde el front)
   ========================================================== */
exports.crearNotificacionManual = async (req, res) => {
  try {
    const { userId, titulo, mensaje, trabajoId, empleadorId } = req.body;

    if (!userId || !titulo || !mensaje) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const nueva = await Notificacion.create({
      userId,
      titulo,
      mensaje,
      trabajoId: trabajoId || null,
      empleadorId: empleadorId || null,
      leido: false,
    });

    return res.json(nueva);

  } catch (error) {
    console.error("❌ ERROR CREAR NOTIFICACIÓN MANUAL:", error);
    return res.status(500).json({ message: "Error creando notificación" });
  }
};

/* ==========================================================
   🔹 Crear notificación AUTOMÁTICA (usable desde otros módulos)
   ========================================================== */
exports.crearNotificacion = async (userId, data) => {
  try {
    const { titulo, mensaje, trabajoId, empleadorId } = data;

    return await Notificacion.create({
      userId,
      trabajoId: trabajoId || null,
      empleadorId: empleadorId || null,
      titulo,
      mensaje,
      leido: false,
    });

  } catch (err) {
    console.error("❌ ERROR CREAR NOTIFICACIÓN AUTOMÁTICA:", err);
  }
};

/* ==========================================================
   🔹 Obtener notificaciones del usuario (empleador o trabajador)
   ========================================================== */
exports.getNotificacionesUsuario = async (req, res) => {
  try {
    const { userId } = req.params;

    const notificaciones = await Notificacion.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: "usuarioNotificacion",
          attributes: ["id", "nombre", "email"], // ← FOTO QUITADA
        },
        {
          model: Trabajo,
          as: "trabajo",
          attributes: ["id", "titulo"],
        },
        {
          model: Empleador,
          as: "empleador",
          attributes: ["id", "userId"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json(notificaciones);

  } catch (error) {
    console.error("❌ ERROR GET NOTIFICACIONES:", error);
    res.status(500).json({ message: "Error obteniendo notificaciones" });
  }
};

/* ==========================================================
   🔹 Marcar notificación como leída
   ========================================================== */
exports.marcarNotificacionLeida = async (req, res) => {
  try {
    const { id } = req.params;

    const noti = await Notificacion.findByPk(id);
    if (!noti) {
      return res.status(404).json({ message: "Notificación no existe" });
    }

    noti.leido = true;
    await noti.save();

    return res.json({ message: "Notificación marcada como leída" });

  } catch (error) {
    console.error("❌ ERROR MARCAR COMO LEÍDA:", error);
    res.status(500).json({ message: "Error marcando notificación" });
  }
};
