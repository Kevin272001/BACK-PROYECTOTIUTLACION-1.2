"use strict";

const { Notificacion } = require("../models");

/**
 * Crear una notificación para un usuario.
 *
 * @param {number} userId - ID del usuario que recibirá la notificación.
 * @param {string} titulo - Título de la notificación.
 * @param {string} mensaje - Mensaje principal.
 * @param {object} dataExtra - Datos adicionales (postulante, trabajo, etc.) en formato JSON.
 * @returns {Promise<object|null>} - La notificación creada o null si falla.
 */
/**
 * ✅ Compatibilidad:
 *  - Firma antigua: crearNotificacion(userId, titulo, mensaje)
 *  - Firma nueva (la que se estaba usando en varios módulos):
 *      crearNotificacion(userId, { titulo, mensaje, trabajoId, empleadorId })
 */
async function crearNotificacion(userId, tituloOrData, mensaje, _dataExtra = {}) {
  if (!userId) {
    console.warn("⚠️ crearNotificacion: userId no recibido");
    return null;
  }

  try {
    // ✅ Si viene como objeto
    if (tituloOrData && typeof tituloOrData === "object") {
      const data = tituloOrData;
      const nueva = await Notificacion.create({
        userId,
        titulo: data.titulo,
        mensaje: data.mensaje,
        trabajoId: data.trabajoId || null,
        empleadorId: data.empleadorId || null,
        leido: false,
      });
      return nueva;
    }

    // ✅ Firma antigua
    const nueva = await Notificacion.create({
      userId,
      titulo: tituloOrData,
      mensaje: mensaje || "",
      trabajoId: null,
      empleadorId: null,
      leido: false,
    });

    return nueva;

  } catch (error) {
    console.error("❌ Error crearNotificacion:", error);
    return null;
  }
}

module.exports = {
  crearNotificacion,
};
