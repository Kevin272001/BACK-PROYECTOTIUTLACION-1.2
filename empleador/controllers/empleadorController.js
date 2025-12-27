'use strict';

const { Empleador } = require('../../models');

// ==========================================================
// 🔹 LISTAR TODOS LOS EMPLEADORES
//    GET /api/empleadores
// ==========================================================
exports.getAll = async (req, res) => {
  try {
    const data = await Empleador.findAll();
    return res.json({ empleadores: data });
  } catch (e) {
    console.error('❌ Error al listar empleadores:', e);
    return res.status(500).json({ error: "Error al listar empleadores" });
  }
};

// ==========================================================
// 🔹 OBTENER EMPLEADOR POR userId
//    GET /api/empleadores/:userId
// ==========================================================
exports.obtener = async (req, res) => {
  try {
    const empleador = await Empleador.findOne({
      where: { userId: req.params.userId }
    });

    if (!empleador) {
      return res.status(404).json({ error: "No encontrado" });
    }

    return res.json({ empleador });
  } catch (e) {
    console.error('❌ Error al obtener empleador:', e);
    return res.status(500).json({ error: "Error al obtener empleador" });
  }
};

// ==========================================================
// 🔹 REGISTRAR EMPLEADOR (solo DATOS + FOTO)
//    POST /api/empleadores
// ==========================================================
exports.registrar = async (req, res) => {
  try {
    const { userId, empresa, ruc, responsable, telefono, direccion } = req.body;

    // VALIDACIÓN
    if (!userId || !empresa || !ruc || !responsable || !telefono || !direccion) {
      return res.status(400).json({
        error: "Faltan campos obligatorios en el body"
      });
    }

    // Archivos (si vienen)
    // Multer con .fields() deja req.files = { foto: [..], recordPolicial: [..] }
    const fotoFile = req.files?.foto?.[0] || null;
    const recordFile = req.files?.recordPolicial?.[0] || null;

    const foto_url = fotoFile ? `/uploads/empleadores/${fotoFile.filename}` : null;
    const record_policial_url = recordFile
      ? `/uploads/empleadores/${recordFile.filename}`
      : null;

    // CREAR EMPLEADOR
    const nuevo = await Empleador.create({
      userId,
      empresa,
      ruc,
      responsable,
      telefono,
      direccion,
      foto_url,
      record_policial_url,
    });

    return res.status(201).json({
      message: "Empleador registrado correctamente",
      empleador: nuevo
    });

  } catch (e) {
    console.error('❌ Error al registrar empleador:', e);
    return res.status(500).json({ error: "Error al registrar empleador" });
  }
};

// ==========================================================
// ✅ ACTUALIZAR ARCHIVOS (FOTO / RÉCORD) (USANDO TOKEN)
//    PUT /api/empleadores/me/archivos
// ==========================================================
exports.actualizarMisArchivos = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, msg: 'Token inválido' });
    }

    let empleador = await Empleador.findOne({ where: { userId } });
    if (!empleador) {
      empleador = await Empleador.create({ userId, nombre: req.user?.nombre || '' });
    }

    const fotoFile = req.files?.foto?.[0] || null;
    const recordFile = req.files?.recordPolicial?.[0] || null;

    const updateData = {};
    if (fotoFile) updateData.foto_url = `/uploads/empleadores/${fotoFile.filename}`;
    if (recordFile) {
      updateData.record_policial_url = `/uploads/empleadores/${recordFile.filename}`;
    }

    await empleador.update(updateData);

    return res.json({ message: 'Archivos actualizados ✅', empleador });
  } catch (e) {
    console.error('❌ Error al actualizar archivos empleador:', e);
    return res.status(500).json({ error: 'Error al actualizar archivos' });
  }
};

// ==========================================================
// 🔹 ELIMINAR EMPLEADOR
//    DELETE /api/empleadores/:id
// ==========================================================
exports.eliminar = async (req, res) => {
  try {
    const empleador = await Empleador.findByPk(req.params.id);

    if (!empleador) {
      return res.status(404).json({ error: "No encontrado" });
    }

    await empleador.destroy();

    return res.json({ message: "Eliminado correctamente" });

  } catch (e) {
    console.error('❌ Error al eliminar empleador:', e);
    return res.status(500).json({ error: "Error al eliminar" });
  }
};

// ==========================================================
// ✅ MI PERFIL (USANDO TOKEN)
//    GET /api/empleadores/me
// ==========================================================
exports.obtenerMiPerfil = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, msg: 'Token inválido' });
    }

    let empleador = await Empleador.findOne({ where: { userId } });

    // Si por alguna razón no existe, lo creamos mínimo (no rompe nada)
    if (!empleador) {
      empleador = await Empleador.create({ userId, nombre: req.user?.nombre || '' });
    }

    return res.json({ empleador });
  } catch (e) {
    console.error('❌ Error al obtener mi perfil:', e);
    return res.status(500).json({ error: 'Error al obtener mi perfil' });
  }
};

// ==========================================================
// ✅ ACTUALIZAR MI PERFIL (USANDO TOKEN)
//    PUT /api/empleadores/me
// ==========================================================
exports.actualizarMiPerfil = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, msg: 'Token inválido' });
    }

    const {
      tipoEmpleador,
      nombre,
      empresa,
      ruc,
      responsable,
      telefono,
      direccion,
    } = req.body;

    let empleador = await Empleador.findOne({ where: { userId } });
    if (!empleador) {
      empleador = await Empleador.create({ userId, nombre: req.user?.nombre || '' });
    }

    // Solo actualizamos lo que venga (sin obligar campos)
    await empleador.update({
      tipoEmpleador: tipoEmpleador ?? empleador.tipoEmpleador,
      nombre: nombre ?? empleador.nombre,
      empresa: empresa ?? empleador.empresa,
      ruc: ruc ?? empleador.ruc,
      responsable: responsable ?? empleador.responsable,
      telefono: telefono ?? empleador.telefono,
      direccion: direccion ?? empleador.direccion,
    });

    return res.json({ message: 'Perfil actualizado correctamente', empleador });
  } catch (e) {
    console.error('❌ Error al actualizar mi perfil:', e);
    return res.status(500).json({ error: 'Error al actualizar mi perfil' });
  }
};
