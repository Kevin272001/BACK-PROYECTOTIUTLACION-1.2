"use strict";

const {
  Transaction,
  Trabajo,
  User,
} = require("../models");

const { crearNotificacion } = require("../methods/notificar");

async function notificarPago({ empleadorId, trabajadorId, monto, trabajoId, servicioId, estado }) {
  try {
    if (estado === "pendiente") {
      await crearNotificacion(empleadorId, {
        titulo: "Pago pendiente",
        mensaje: `Tienes un pago pendiente de $${Number(monto).toFixed(2)}.`,
        trabajoId: trabajoId || null,
      });
      await crearNotificacion(trabajadorId, {
        titulo: "Pago en proceso",
        mensaje: `Se generó un pago pendiente de $${Number(monto).toFixed(2)}.`,
        trabajoId: trabajoId || null,
      });
    } else if (estado === "pagado") {
      await crearNotificacion(empleadorId, {
        titulo: "Pago registrado",
        mensaje: `Se registró un pago de $${Number(monto).toFixed(2)}.`,
        trabajoId: trabajoId || null,
      });
      await crearNotificacion(trabajadorId, {
        titulo: "Pago recibido",
        mensaje: `Recibiste un pago de $${Number(monto).toFixed(2)}.`,
        trabajoId: trabajoId || null,
      });
    }
  } catch (_) {}
}

module.exports = {

  // ======================================================
  // 🔥 EMPLEADOR PAGA → TRABAJADOR RECIBE (PAGO POR TRABAJO)
  // ======================================================
  async crear(req, res) {
    try {
      const {
        empleadorId,   // 👉 USER ID del empleador
        trabajadorId,  // 👉 USER ID del trabajador
        monto,
        descripcion,
        servicioId,
        trabajoId,
      } = req.body;

      // =============================
      // 🔒 VALIDACIONES BÁSICAS
      // =============================
      if (!empleadorId || !trabajadorId || !monto) {
        return res.status(400).json({
          error: "empleadorId, trabajadorId y monto son obligatorios",
        });
      }

      if (monto <= 0) {
        return res.status(400).json({
          error: "El monto debe ser mayor a 0",
        });
      }

      // =============================
      // 🔎 VALIDAR TRABAJO
      // =============================
      if (trabajoId) {
        const trabajo = await Trabajo.findByPk(trabajoId);

        if (!trabajo) {
          return res.status(400).json({
            error: "El trabajo no existe",
          });
        }

        if (trabajo.estado !== "finalizado") {
          return res.status(400).json({
            error: "El trabajo aún no está finalizado",
          });
        }
      }

      // ======================================================
      // ✅ VALIDAR EMPLEADOR (USER)
      // ======================================================
      const empleadorUser = await User.findByPk(empleadorId);
      if (!empleadorUser) {
        return res.status(400).json({
          error: "El empleador no existe",
        });
      }

      // ======================================================
      // ✅ VALIDAR TRABAJADOR (USER)
      // ======================================================
      const trabajadorUser = await User.findByPk(trabajadorId);
      if (!trabajadorUser) {
        return res.status(400).json({
          error: "El trabajador no existe",
        });
      }

      // ✅ Si ya hay transacciones pendientes para este trabajo/servicio,
      // en vez de duplicar, las marcamos como pagadas.
      let gasto = await Transaction.findOne({
        where: {
          userId: empleadorUser.id,
          origenUserId: empleadorUser.id,
          destinoUserId: trabajadorUser.id,
          tipo: "gasto",
          trabajoId: trabajoId || null,
          servicioId: servicioId || null,
          estado: "pendiente",
        },
      });
      let ingreso = await Transaction.findOne({
        where: {
          userId: trabajadorUser.id,
          origenUserId: empleadorUser.id,
          destinoUserId: trabajadorUser.id,
          tipo: "ingreso",
          trabajoId: trabajoId || null,
          servicioId: servicioId || null,
          estado: "pendiente",
        },
      });

      if (gasto && ingreso) {
        // Si se está marcando como pagado directamente (sin flujo de confirmar),
        // no tenemos comprobante; dejamos null.
        const comprobanteUrl = null;
        const fechaPago = new Date();
        await gasto.update({
          monto,
          descripcion: descripcion || gasto.descripcion,
          estado: "pagado",
          comprobanteUrl,
          fechaPago,
        });
        await ingreso.update({
          monto,
          estado: "pagado",
          comprobanteUrl,
          fechaPago,
        });
      } else {
        // 1️⃣ GASTO DEL EMPLEADOR
        gasto = await Transaction.create({
          userId: empleadorUser.id,
          origenUserId: empleadorUser.id,
          destinoUserId: trabajadorUser.id,
          monto,
          tipo: "gasto",
          descripcion: descripcion || "Pago por trabajo",
          servicioId: servicioId || null,
          trabajoId: trabajoId || null,
          estado: "pagado",
        });

        // 2️⃣ INGRESO DEL TRABAJADOR
        ingreso = await Transaction.create({
          userId: trabajadorUser.id,
          origenUserId: empleadorUser.id,
          destinoUserId: trabajadorUser.id,
          monto,
          tipo: "ingreso",
          descripcion: "Pago recibido por trabajo",
          servicioId: servicioId || null,
          trabajoId: trabajoId || null,
          estado: "pagado",
        });
      }

      // 🔔 Notificar pago
      await notificarPago({
        empleadorId: empleadorUser.id,
        trabajadorId: trabajadorUser.id,
        monto,
        trabajoId,
        servicioId,
        estado: "pagado",
      });

      return res.json({
        ok: true,
        gasto,
        ingreso,
      });

    } catch (error) {
      console.error("❌ Error al crear pago:", error);
      return res.status(500).json({
        error: "Error al procesar el pago",
      });
    }
  },

  // ======================================================
  // 🧾 CREAR SOLICITUD DE PAGO (PENDIENTE)
  // ======================================================
  async solicitar(req, res) {
    try {
      const { empleadorId, trabajadorId, monto, descripcion, servicioId, trabajoId } = req.body;

      if (!empleadorId || !trabajadorId || !monto) {
        return res.status(400).json({ error: "empleadorId, trabajadorId y monto son obligatorios" });
      }
      if (monto <= 0) {
        return res.status(400).json({ error: "El monto debe ser mayor a 0" });
      }

      // Evitar duplicar
      const ya = await Transaction.findOne({
        where: {
          userId: empleadorId,
          origenUserId: empleadorId,
          destinoUserId: trabajadorId,
          tipo: "gasto",
          trabajoId: trabajoId || null,
          servicioId: servicioId || null,
          estado: "pendiente",
        },
      });

      if (!ya) {
        await Transaction.create({
          userId: empleadorId,
          origenUserId: empleadorId,
          destinoUserId: trabajadorId,
          monto,
          tipo: "gasto",
          descripcion: descripcion || "Pago pendiente",
          servicioId: servicioId || null,
          trabajoId: trabajoId || null,
          estado: "pendiente",
        });
        await Transaction.create({
          userId: trabajadorId,
          origenUserId: empleadorId,
          destinoUserId: trabajadorId,
          monto,
          tipo: "ingreso",
          descripcion: descripcion || "Pago pendiente",
          servicioId: servicioId || null,
          trabajoId: trabajoId || null,
          estado: "pendiente",
        });
      }

      await notificarPago({ empleadorId, trabajadorId, monto, trabajoId, servicioId, estado: "pendiente" });

      return res.json({ ok: true, message: "Solicitud de pago creada" });
    } catch (error) {
      console.error("❌ Error al solicitar pago:", error);
      return res.status(500).json({ error: "Error al solicitar pago" });
    }
  },

  // ======================================================
  // ✅ CONFIRMAR PAGO DE SOLICITUD PENDIENTE
  // ======================================================
  async confirmar(req, res) {
    try {
      const { empleadorId, trabajadorId, trabajoId, servicioId, monto, descripcion } = req.body;
      // ✅ Comprobante opcional (imagen) desde multipart/form-data
      let comprobanteUrl = null;
      if (req.file && req.file.filename) {
        comprobanteUrl = "/uploads/comprobantes/" + req.file.filename;
      }
      const fechaPago = new Date();

      if (!empleadorId || !trabajadorId || (!trabajoId && !servicioId)) {
        return res.status(400).json({ error: "empleadorId, trabajadorId y trabajoId/servicioId son obligatorios" });
      }

      const whereBase = {
        origenUserId: empleadorId,
        destinoUserId: trabajadorId,
        trabajoId: trabajoId || null,
        servicioId: servicioId || null,
      };

      const gasto = await Transaction.findOne({ where: { ...whereBase, userId: empleadorId, tipo: "gasto", estado: "pendiente" } });
      const ingreso = await Transaction.findOne({ where: { ...whereBase, userId: trabajadorId, tipo: "ingreso", estado: "pendiente" } });

      if (gasto && ingreso) {
        const m = monto ? Number(monto) : Number(gasto.monto);
        await gasto.update({ monto, descripcion: descripcion || gasto.descripcion, estado: "pagado", comprobanteUrl, fechaPago });
        await ingreso.update({ monto, estado: "pagado", comprobanteUrl, fechaPago });

        await notificarPago({ empleadorId, trabajadorId, monto: m, trabajoId, servicioId, estado: "pagado" });

        return res.json({ ok: true, message: "Pago confirmado", gasto, ingreso });
      }

      // fallback: crea pago normal
      req.body.monto = monto || 0;
      return module.exports.crear(req, res);
    } catch (error) {
      console.error("❌ Error al confirmar pago:", error);
      return res.status(500).json({ error: "Error al confirmar pago" });
    }
  },

  // ======================================================
  // 🔹 MIS PENDIENTES (por token)
  // ======================================================
  async pendientes(req, res) {
    try {
      const userId = req.user.id;
      const transacciones = await Transaction.findAll({
        where: { userId, estado: "pendiente" },
        order: [["createdAt", "DESC"]],
        include: [
          { model: User, as: "origen", attributes: ["id", "nombre", "email"] },
          { model: User, as: "destino", attributes: ["id", "nombre", "email"] },
        ],
      });
      return res.json(transacciones);
    } catch (error) {
      console.error("❌ Error al obtener pendientes:", error);
      return res.status(500).json({ error: "Error al obtener pendientes" });
    }
  },

  // ======================================================
  // 💳 RECARGA PAYPAL SIMULADA
  // ======================================================
  async recarga(req, res) {
    try {
      const { monto, descripcion } = req.body;
      const userId = req.user.id; // ✅ USER ID

      if (!monto || monto <= 0) {
        return res.status(400).json({
          error: "monto válido es obligatorio",
        });
      }

      const transaccion = await Transaction.create({
        userId,
        origenUserId: userId,
        destinoUserId: userId,
        monto,
        tipo: "gasto",
        descripcion: descripcion || "Recarga PayPal (simulada)",
        estado: "pagado",
      });

      return res.json({
        ok: true,
        transaccion,
      });

    } catch (error) {
      console.error("❌ Error en recarga:", error);
      return res.status(500).json({
        error: "Error al procesar recarga",
      });
    }
  },

  // ======================================================
  // 🔹 MIS TRANSACCIONES
  // ======================================================
  async misTransacciones(req, res) {
    try {
      const userId = req.user.id;

      const transacciones = await Transaction.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
      });

      return res.json(transacciones);

    } catch (error) {
      console.error("❌ Error al obtener transacciones:", error);
      return res.status(500).json({
        error: "Error al obtener transacciones",
      });
    }
  },

  // ======================================================
  // 🔹 HISTORIAL TOTAL (ADMIN / DEBUG)
  // ======================================================
  async todas(req, res) {
    try {
      const transacciones = await Transaction.findAll({
        order: [["createdAt", "DESC"]],
      });

      return res.json(transacciones);

    } catch (error) {
      console.error("❌ Error al obtener historial:", error);
      return res.status(500).json({
        error: "Error al obtener datos",
      });
    }
  },
};