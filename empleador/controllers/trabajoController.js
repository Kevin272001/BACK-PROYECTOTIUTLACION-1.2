"use strict";

const {
  Trabajo,
  Empleador,
  User,
  Trabajador,
  Notificacion,
  SolicitudTrabajo,
  Postulacion,
  Transaction,
} = require("../../models");
const { Op } = require("sequelize");
const { crearNotificacion } = require("../../methods/notificar");

// ======================================================
// 🔥 Helper: crear solicitud de pago (transacciones pendientes)
// - Crea 2 transacciones (gasto/ingreso) con estado "pendiente"
// - Notifica a empleador y trabajador
// ======================================================
async function crearSolicitudPagoPorTrabajo(trabajo) {
  try {
    if (!trabajo?.id) return;

    // 1) Empleador (User)
    const empleador = trabajo.empleadorId
      ? await Empleador.findByPk(trabajo.empleadorId)
      : null;
    const empleadorUserId = empleador?.userId;

    // 2) Trabajador (User) = postulacion aceptada
    const postAceptada = await Postulacion.findOne({
      where: { trabajoId: trabajo.id, estado: "aceptado" },
    });
    const trabajadorUserId = postAceptada?.userId;

    if (!empleadorUserId || !trabajadorUserId) {
      // No hay a quién cobrar/pagar
      return;
    }

    // 3) Monto (desde salario)
    const raw = trabajo.salario ? String(trabajo.salario) : "";
    const monto = parseFloat(raw.replace(/[^0-9.]/g, ""));
    if (!monto || monto <= 0) {
      // Si no hay monto, igual notifica
      await crearNotificacion(empleadorUserId, {
        titulo: "Trabajo finalizado",
        mensaje: `El trabajo \"${trabajo.titulo}\" fue finalizado. (Falta definir monto para el pago)` ,
        trabajoId: trabajo.id,
      });
      await crearNotificacion(trabajadorUserId, {
        titulo: "Trabajo finalizado",
        mensaje: `Finalizaste el trabajo \"${trabajo.titulo}\". (Falta definir monto para el pago)` ,
        trabajoId: trabajo.id,
      });
      return;
    }

    // 4) Evitar duplicar si ya existe pendiente
    const yaPendiente = await Transaction.findOne({
      where: {
        userId: empleadorUserId,
        trabajoId: trabajo.id,
        tipo: "gasto",
        estado: "pendiente",
      },
    });
    if (!yaPendiente) {
      await Transaction.create({
        userId: empleadorUserId,
        origenUserId: empleadorUserId,
        destinoUserId: trabajadorUserId,
        monto,
        tipo: "gasto",
        descripcion: `Pago pendiente por trabajo: ${trabajo.titulo}`,
        trabajoId: trabajo.id,
        estado: "pendiente",
      });
      await Transaction.create({
        userId: trabajadorUserId,
        origenUserId: empleadorUserId,
        destinoUserId: trabajadorUserId,
        monto,
        tipo: "ingreso",
        descripcion: `Pago pendiente por trabajo: ${trabajo.titulo}`,
        trabajoId: trabajo.id,
        estado: "pendiente",
      });
    }

    // 5) Notificaciones
    await crearNotificacion(empleadorUserId, {
      titulo: "Trabajo finalizado - Pago pendiente",
      mensaje: `El trabajo \"${trabajo.titulo}\" fue finalizado. Tienes un pago pendiente de $${monto.toFixed(2)}.`,
      trabajoId: trabajo.id,
    });
    await crearNotificacion(trabajadorUserId, {
      titulo: "Trabajo finalizado - Esperando pago",
      mensaje: `Finalizaste \"${trabajo.titulo}\". El empleador debe pagarte $${monto.toFixed(2)}.`,
      trabajoId: trabajo.id,
    });
  } catch (e) {
    console.log("⚠ Error creando solicitud de pago:", e);
  }
}

// ======================================================
// 🔐 ENUMS CENTRALIZADOS (ANTI-ERRORES)
// ======================================================
const ESTADOS_TRABAJO = {
  ACTIVO: "activo",
  PAUSADO: "pausado",
  FINALIZADO: "finalizado",
};

// ======================================================
// ✅ Helper: validar / normalizar fecha límite
// - Acepta: "YYYY-MM-DD" (recomendado)
// - Devuelve: string "YYYY-MM-DD" o null
// ======================================================
function normalizarFechaLimite(fechaLimite) {
  if (fechaLimite === undefined || fechaLimite === null || fechaLimite === "") {
    return null;
  }

  const s = String(fechaLimite).trim();
  // formato esperado YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return { error: "fechaLimite debe tener formato YYYY-MM-DD" };
  }

  const dt = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) {
    return { error: "fechaLimite inválida" };
  }

  return s;
}

// ======================================================
// ✅ Helper: asegurar que exista Empleador para un userId
// - Si el usuario tiene rol "empleador" y no existe en tabla Empleador,
//   lo creamos automáticamente (para que no explote el POST /trabajos)
// ======================================================
async function asegurarEmpleador(userId) {
  // 1) Buscar empleador existente
  let empleador = await Empleador.findOne({ where: { userId } });
  if (empleador) return empleador;

  // 2) Verificar que el usuario exista y sea rol empleador
  const user = await User.findByPk(userId);
  if (!user) {
    return null; // luego respondemos 400 con mensaje claro
  }

  // En tu tabla users se ve rol = "empleador" / "trabajador"
  if (user.rol !== "empleador") {
    return "NO_ES_EMPLEADOR";
  }

  // 3) Crear empleador automático con defaults seguros
  // (empresa/ruc/telefono vacíos para no romper)
  empleador = await Empleador.create({
    userId,
    empresa: "",
    ruc: "",
    telefono: "",
  });

  return empleador;
}

module.exports = {
  // ======================================================
  // 🔹 Crear trabajo (OFERTA)
  // ======================================================
  async crear(req, res) {
    try {
      const {
        titulo,
        descripcion,
        salario,
        ubicacion,
        categoria,
        fechaLimite,
        userId,
      } =
        req.body;

      // Validaciones básicas
      if (!titulo || !descripcion || !userId) {
        return res.status(400).json({
          error: "titulo, descripcion y userId son obligatorios",
        });
      }

      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        return res.status(400).json({
          error: "userId inválido",
        });
      }

      // ✅ Asegurar empleador (AUTO-CREACIÓN SI ROL=empleador)
      const empleador = await asegurarEmpleador(userIdNum);

      if (empleador === "NO_ES_EMPLEADOR") {
        return res.status(400).json({
          error: "Este usuario no es empleador (rol trabajador no puede crear trabajos)",
        });
      }

      if (!empleador) {
        return res.status(400).json({
          error: "Usuario no encontrado o no se pudo asociar como empleador",
        });
      }

      // ✅ validar fecha límite
      const fechaLimiteNorm = normalizarFechaLimite(fechaLimite);
      if (fechaLimiteNorm && fechaLimiteNorm.error) {
        return res.status(400).json({ error: fechaLimiteNorm.error });
      }

      const nuevo = await Trabajo.create({
        titulo,
        descripcion,
        salario: salario ? salario.toString() : "",
        ubicacion: ubicacion || "",
        categoria: categoria || "",
        fechaLimite: fechaLimiteNorm || null,
        estado: ESTADOS_TRABAJO.ACTIVO,
        empleadorId: empleador.id,
      });

      // 🔔 Notificar a todos los trabajadores
      try {
        const trabajadores = await Trabajador.findAll({
          attributes: ["userId"],
        });

        for (const t of trabajadores) {
          await crearNotificacion(t.userId, {
            titulo: "Nuevo trabajo disponible",
            mensaje: `Se publicó un nuevo trabajo: "${titulo}".`,
            trabajoId: nuevo.id,
          });
        }
      } catch (err) {
        console.log("⚠ Error creando notificaciones:", err);
      }

      return res.status(201).json({
        message: "Trabajo creado correctamente",
        trabajo: nuevo,
      });
    } catch (error) {
      console.error("❌ Error al crear trabajo:", error);
      return res.status(500).json({
        error: "Error al crear trabajo",
      });
    }
  },

  // ======================================================
  // 🔹 Obtener TODOS los trabajos con filtros
  // ======================================================
  async listar(req, res) {
    try {
      const { estado, categoria, buscar } = req.query;
      const where = {};

      if (estado) where.estado = estado;
      if (categoria) where.categoria = categoria;

      if (buscar) {
        where[Op.or] = [
          { titulo: { [Op.iLike]: `%${buscar}%` } },
          { descripcion: { [Op.iLike]: `%${buscar}%` } },
        ];
      }

      const trabajos = await Trabajo.findAll({
        where,
        include: [
          {
            model: Empleador,
            as: "empleador",
            include: [
              {
                model: User,
                as: "usuarioEmpleador",
                attributes: ["id", "nombre", "email"],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.json(trabajos);
    } catch (error) {
      console.error("❌ Error al listar trabajos:", error);
      res.status(500).json({ error: "Error al listar trabajos" });
    }
  },

  // ======================================================
  // 🔹 Listar trabajos de un empleador
  // ======================================================
  async listarPorEmpleador(req, res) {
    try {
      const { userId } = req.params;
      const userIdNum = Number(userId);

      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        return res.status(400).json({ error: "userId inválido" });
      }

      const empleador = await Empleador.findOne({ where: { userId: userIdNum } });
      if (!empleador) return res.json({ trabajos: [] });

      const trabajos = await Trabajo.findAll({
        where: { empleadorId: empleador.id },
        order: [["createdAt", "DESC"]],
      });

      res.json({ trabajos });
    } catch (error) {
      console.error("❌ Error al listar trabajos del empleador:", error);
      res.status(500).json({ error: "Error al listar trabajos del empleador" });
    }
  },

  // ======================================================
  // 🔹 Obtener trabajo por ID
  // ======================================================
  async obtenerUno(req, res) {
    try {
      const { id } = req.params;

      const trabajo = await Trabajo.findByPk(id, {
        include: [
          {
            model: Empleador,
            as: "empleador",
            include: [
              {
                model: User,
                as: "usuarioEmpleador",
                attributes: ["id", "nombre", "email"],
              },
            ],
          },
        ],
      });

      if (!trabajo) {
        return res.status(404).json({ error: "Trabajo no encontrado" });
      }

      res.json(trabajo);
    } catch (error) {
      console.error("❌ Error al obtener trabajo:", error);
      res.status(500).json({ error: "Error al obtener trabajo" });
    }
  },

  // ======================================================
  // 🔹 Actualizar trabajo
  // ======================================================
  async actualizar(req, res) {
    try {
      const { id } = req.params;

      const trabajo = await Trabajo.findByPk(id);
      if (!trabajo) {
        return res.status(404).json({ error: "Trabajo no encontrado" });
      }

      // ✅ si viene fechaLimite, validar
      if (Object.prototype.hasOwnProperty.call(req.body, "fechaLimite")) {
        const fechaLimiteNorm = normalizarFechaLimite(req.body.fechaLimite);
        if (fechaLimiteNorm && fechaLimiteNorm.error) {
          return res.status(400).json({ error: fechaLimiteNorm.error });
        }
        req.body.fechaLimite = fechaLimiteNorm;
      }

      await trabajo.update(req.body);

      res.json({
        message: "Trabajo actualizado correctamente",
        trabajo,
      });
    } catch (error) {
      console.error("❌ Error al actualizar trabajo:", error);
      res.status(500).json({ error: "Error al actualizar trabajo" });
    }
  },

  // ======================================================
  // 🔹 Cambiar estado del trabajo
  // ======================================================
  async cambiarEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!estado) {
        return res.status(400).json({ error: "estado es requerido" });
      }

      if (!Object.values(ESTADOS_TRABAJO).includes(estado)) {
        return res.status(400).json({ error: "Estado inválido" });
      }

      const trabajo = await Trabajo.findByPk(id);
      if (!trabajo) {
        return res.status(404).json({ error: "Trabajo no encontrado" });
      }

      trabajo.estado = estado;
      await trabajo.save();

      res.json({
        message: "Estado actualizado correctamente",
        trabajo,
      });
    } catch (error) {
      console.error("❌ Error al cambiar estado:", error);
      res.status(500).json({ error: "Error al cambiar estado" });
    }
  },

  // ======================================================
  // 🔥 FINALIZAR TRABAJO AVANZADO
  // ======================================================
  async finalizarTrabajo(req, res) {
    try {
      const { id } = req.params;
      const { resultado } = req.body;

      if (!["exitoso", "malo"].includes(resultado)) {
        return res.status(400).json({ error: "Resultado inválido" });
      }

      const trabajo = await Trabajo.findByPk(id);
      if (!trabajo) {
        return res.status(404).json({ error: "Trabajo no encontrado" });
      }

      trabajo.estado = ESTADOS_TRABAJO.FINALIZADO;
      trabajo.resultado = resultado;
      await trabajo.save();

      // 🔥 Crear pago pendiente + notificar
      await crearSolicitudPagoPorTrabajo(trabajo);

      return res.json({
        message: "Trabajo finalizado correctamente",
        trabajo,
      });
    } catch (error) {
      console.error("❌ Error al finalizar trabajo:", error);
      res.status(500).json({ error: "Error al finalizar trabajo" });
    }
  },

  // ======================================================
  // ✅ FINALIZAR TRABAJO SIMPLE
  // ======================================================
  async finalizarTrabajoSimple(req, res) {
    try {
      const { id } = req.params;

      const trabajo = await Trabajo.findByPk(id);
      if (!trabajo) {
        return res.status(404).json({ error: "Trabajo no encontrado" });
      }

      if (trabajo.estado === ESTADOS_TRABAJO.FINALIZADO) {
        return res.status(400).json({
          error: "El trabajo ya está finalizado",
        });
      }

      trabajo.estado = ESTADOS_TRABAJO.FINALIZADO;
      await trabajo.save();

      // 🔥 Crear pago pendiente + notificar
      await crearSolicitudPagoPorTrabajo(trabajo);

      return res.json({
        message: "✅ Trabajo finalizado correctamente",
        trabajo,
      });
    } catch (error) {
      console.error("❌ Error al finalizar trabajo simple:", error);
      res.status(500).json({ error: "Error al finalizar trabajo" });
    }
  },

  // ======================================================
  // 🔥 ELIMINAR TRABAJO (CORREGIDO DEFINITIVAMENTE)
  // ======================================================
  async eliminar(req, res) {
    try {
      const { id } = req.params;

      const trabajo = await Trabajo.findByPk(id);
      if (!trabajo) {
        return res.status(404).json({ error: "Trabajo no encontrado" });
      }

      // 🧹 1️⃣ Eliminar postulaciones
      await Postulacion.destroy({
        where: { trabajoId: id },
      });

      // 🧹 2️⃣ Eliminar solicitudes
      await SolicitudTrabajo.destroy({
        where: { trabajoId: id },
      });

      // 🗑 3️⃣ Eliminar trabajo
      await trabajo.destroy();

      return res.json({
        ok: true,
        message: "Trabajo eliminado correctamente",
      });
    } catch (error) {
      console.error("❌ Error al eliminar trabajo:", error);
      return res.status(500).json({
        error: "Error al eliminar trabajo",
      });
    }
  },
};
