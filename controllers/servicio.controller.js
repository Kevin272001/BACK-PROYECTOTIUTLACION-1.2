"use strict";

const db = require("../models");
const { Op } = require("sequelize");
const { crearNotificacion } = require("../methods/notificar");

const { Servicio, Postulacion, User } = db;

module.exports = {
  // =====================================================
  // 🟢 CREAR SERVICIO
  // POST /api/servicios
  // =====================================================
  async crear(req, res) {
    try {
      const nuevo = await Servicio.create({
        titulo: req.body.titulo,
        categoria: req.body.categoria,
        descripcion: req.body.descripcion,
        ubicacion: req.body.ubicacion,
        presupuesto: req.body.presupuesto,
        userId: req.body.userId || null,
        estado: "activo",
      });

      return res.status(201).json({ ok: true, servicio: nuevo });
    } catch (error) {
      console.error("❌ Error crear servicio:", error);
      return res.status(500).json({ error: "Error creando el servicio" });
    }
  },

  // =====================================================
  // ✅ NUEVO: OBTENER SERVICIO POR ID (para Flutter "Ver perfil")
  // GET /api/servicios/:id
  // =====================================================
  async obtenerPorId(req, res) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ error: "ID inválido" });

      const servicio = await Servicio.findByPk(id, {
        // traemos también el userId (dueño = trabajador)
        attributes: [
          "id",
          "titulo",
          "categoria",
          "descripcion",
          "ubicacion",
          "presupuesto",
          "estado",
          "userId",
          "createdAt",
          "updatedAt",
        ],
      });

      if (!servicio) {
        return res.status(404).json({ error: "Servicio no existe" });
      }

      // ✅ Devolvemos trabajadorId para que Flutter lo detecte sí o sí
      return res.json({
        ok: true,
        servicio,
        trabajadorId: servicio.userId, // dueño del servicio
      });
    } catch (error) {
      console.error("❌ Error obtenerPorId:", error);
      return res.status(500).json({ error: "Error obteniendo el servicio" });
    }
  },

  // =====================================================
  // 📄 LISTAR SERVICIOS
  // GET /api/servicios
  // GET /api/servicios?userId=123
  // =====================================================
  async listar(req, res) {
    try {
      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const userId = req.query.userId ? Number(req.query.userId) : null;

      // 🔹 MIS SERVICIOS (con postulaciones)
      if (userId) {
        const servicios = await Servicio.findAll({
          where: {
            userId,
            estado: "activo",
            createdAt: { [Op.gte]: hace24h },
          },
          include: [
            {
              model: Postulacion,
              as: "postulaciones",
              required: false,
              include: [
                {
                  model: User,
                  as: "postulante",
                  attributes: ["id", "nombre", "email"],
                },
              ],
            },
          ],
          order: [
            ["id", "DESC"],
            [{ model: Postulacion, as: "postulaciones" }, "createdAt", "DESC"],
          ],
        });

        return res.json(servicios);
      }

      // 🔹 FEED GENERAL
      const servicios = await Servicio.findAll({
        where: {
          estado: "activo",
          createdAt: { [Op.gte]: hace24h },
        },
        order: [["id", "DESC"]],
      });

      return res.json(servicios);
    } catch (error) {
      console.error("❌ Error listar servicios:", error);
      return res.status(500).json({ error: "Error listando servicios" });
    }
  },

  // =====================================================
  // 📄 LISTAR MIS SERVICIOS (COMPATIBILIDAD)
  // GET /api/servicios/mis/:userId
  // =====================================================
  async listarMisServicios(req, res) {
    try {
      const { userId } = req.params;
      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const servicios = await Servicio.findAll({
        where: {
          userId: Number(userId),
          estado: "activo",
          createdAt: { [Op.gte]: hace24h },
        },
        include: [
          {
            model: Postulacion,
            as: "postulaciones",
            required: false,
            include: [
              {
                model: User,
                as: "postulante",
                attributes: ["id", "nombre", "email"],
              },
            ],
          },
        ],
        order: [
          ["id", "DESC"],
          [{ model: Postulacion, as: "postulaciones" }, "createdAt", "DESC"],
        ],
      });

      return res.json(servicios);
    } catch (error) {
      console.error("❌ Error listarMisServicios:", error);
      return res.status(500).json({ error: "Error listando mis servicios" });
    }
  },

  // =====================================================
  // 📨 CREAR POSTULACIÓN
  // POST /api/servicios/:servicioId/postulaciones
  // =====================================================
  async crearPostulacionServicio(req, res) {
    try {
      // ✅ tolerante: si tu router usa :id en vez de :servicioId
      const raw = req.params.servicioId ?? req.params.id;
      const servicioId = Number(raw);

      const userId = Number(req.body.userId);
      const { mensaje } = req.body;

      console.log("🟦 crearPostulacionServicio params:", req.params, "body:", req.body);

      if (!servicioId || !userId) {
        return res.status(400).json({
          error: "servicioId y userId son obligatorios",
        });
      }

      // ✅ FIX REAL: buscar servicio sin romper si NO existe columna servicioId/servicio_id
      const orWhere = [{ id: servicioId }];

      // Solo agrega condiciones si esos campos existen en el MODELO
      if (Servicio?.rawAttributes?.servicioId) {
        orWhere.push({ servicioId });
      }
      if (Servicio?.rawAttributes?.servicio_id) {
        orWhere.push({ servicio_id: servicioId });
      }

      const servicio = await Servicio.findOne({
        where: { [Op.or]: orWhere },
      });

      if (!servicio) {
        // 🔎 DEBUG: imprime ids reales (para que veas si 17 existe en ESA BD)
        const ultimos = await Servicio.findAll({
          attributes: ["id"],
          order: [["id", "DESC"]],
          limit: 10,
        });

        console.log("❌ Servicio NO encontrado:", servicioId, "Últimos ids:", ultimos.map((x) => x.id));

        return res.status(404).json({ error: "Servicio no existe" });
      }

      // ✅ SIEMPRE usa el id real del servicio encontrado
      const servicioRealId = Number(servicio.id);

      const existe = await Postulacion.findOne({
        where: { servicioId: servicioRealId, userId },
      });

      if (existe) {
        return res.status(400).json({
          error: "Ya postulaste a este servicio",
        });
      }

      const postulante = await User.findByPk(userId);
      if (!postulante) {
        return res.status(404).json({
          error: "Usuario postulante no existe",
        });
      }

      const nueva = await Postulacion.create({
        servicioId: servicioRealId,
        userId,
        mensaje: mensaje || "",
        estado: "pendiente",
      });

      // 🔔 Notificar al dueño del servicio
      if (servicio.userId) {
        await crearNotificacion(
          servicio.userId,
          "Nueva postulación a tu servicio",
          `${postulante.nombre || "Un usuario"} se postuló a tu servicio "${servicio.titulo}".`
        );
      }

      return res.status(201).json({ ok: true, postulacion: nueva });
    } catch (error) {
      console.error("❌ Error crear postulación:", error);
      return res.status(500).json({ error: "Error al crear postulación" });
    }
  },

  // =====================================================
  // ✅ NUEVO: LISTAR POSTULACIONES DE UN SERVICIO
  // GET /api/servicios/:servicioId/postulaciones
  // =====================================================
  async listarPostulacionesServicio(req, res) {
    try {
      const servicioId = Number(req.params.servicioId);

      if (!servicioId) {
        return res.status(400).json({ error: "servicioId inválido" });
      }

      // validar que exista servicio
      const servicio = await Servicio.findByPk(servicioId);
      if (!servicio) {
        return res.status(404).json({ error: "Servicio no existe" });
      }

      const postulaciones = await Postulacion.findAll({
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

      return res.json(postulaciones);
    } catch (error) {
      console.error("❌ Error listarPostulacionesServicio:", error);
      return res.status(500).json({ error: "Error listando postulaciones" });
    }
  },

  // =====================================================
  // 🔁 CAMBIAR ESTADO POSTULACIÓN
  // PATCH | PUT /api/servicios/postulaciones/:id/estado
  // =====================================================
  async cambiarEstadoPostulacionServicio(req, res) {
    try {
      const id = Number(req.params.id);
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
      console.error("❌ Error cambiar estado:", error);
      return res.status(500).json({ error: "Error al cambiar estado" });
    }
  },

  // =====================================================
  // ✏ EDITAR SERVICIO
  // PUT /api/servicios/:id
  // =====================================================
  async editar(req, res) {
    try {
      const id = Number(req.params.id);

      const servicio = await Servicio.findOne({
        where: { id, estado: "activo" },
      });

      if (!servicio) {
        return res.status(404).json({
          error: "Servicio no encontrado o expirado",
        });
      }

      await servicio.update({
        titulo: req.body.titulo,
        categoria: req.body.categoria,
        descripcion: req.body.descripcion,
        ubicacion: req.body.ubicacion,
        presupuesto: req.body.presupuesto,
      });

      return res.json({ ok: true, servicio });
    } catch (error) {
      console.error("❌ Error editar servicio:", error);
      return res.status(500).json({ error: "Error editando servicio" });
    }
  },

  // =====================================================
  // ❌ ELIMINAR SERVICIO
  // DELETE /api/servicios/:id
  // =====================================================
  async eliminar(req, res) {
    try {
      const id = Number(req.params.id);

      const servicio = await Servicio.findByPk(id);
      if (!servicio) {
        return res.status(404).json({
          error: "Servicio no encontrado",
        });
      }

      await servicio.destroy();

      return res.json({
        ok: true,
        mensaje: "Servicio eliminado",
      });
    } catch (error) {
      console.error("❌ Error eliminar servicio:", error);
      return res.status(500).json({ error: "Error eliminando servicio" });
    }
  },

  // =====================================================
  // 🧪 DEBUG: VER IDS DISPONIBLES (últimos 30)
  // GET /api/servicios/debug/ids
  // =====================================================
  async debugIds(req, res) {
    try {
      const servicios = await Servicio.findAll({
        attributes: ["id", "titulo", "estado", "createdAt", "userId"],
        order: [["id", "DESC"]],
        limit: 30,
      });

      return res.json({ total: servicios.length, servicios });
    } catch (error) {
      console.error("❌ debugIds:", error);
      return res.status(500).json({ error: "Error debugIds" });
    }
  },

  // =====================================================
  // 🧪 DEBUG: VER SERVICIO POR ID
  // GET /api/servicios/debug/:id
  // =====================================================
  async debugById(req, res) {
    try {
      const id = Number(req.params.id);

      const servicio = await Servicio.findByPk(id);
      if (!servicio) {
        return res.status(404).json({ error: "Servicio no existe" });
      }

      return res.json({ servicio });
    } catch (error) {
      console.error("❌ debugById:", error);
      return res.status(500).json({ error: "Error debugById" });
    }
  },
};
