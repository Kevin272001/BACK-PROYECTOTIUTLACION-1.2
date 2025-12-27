const { Perfil, PerfilLaboral } = require("../models");

// ====================================================
// GET /api/perfil/mine
// ====================================================
exports.mine = async (req, res) => {
  try {
    // 1️⃣ Buscar perfil guardado (tabla perfil)
    let perfil = await Perfil.findOne({
      where: { userId: req.user.id },
    });

    // 2️⃣ Si NO existe → tomar datos iniciales de perfiles_laborales
    if (!perfil) {
      const base = await PerfilLaboral.findOne({
        where: { userId: req.user.id },
      });

      if (!base) {
        return res.json({}); 
      }

      // devolver solo lo necesario
      return res.json({
        nombreCompleto: base.nombreCompleto,
        telefono: base.telefono,
        categoria: base.categoria,
        direccion: base.direccion,
        experiencia: base.experiencia,
        descripcion: "",
        habilidades: [],
        fotoPerfil: null,
        cv: null
      });
    }

    // 3️⃣ Si existe perfil en tabla `perfil`, devolverlo COMPLETO
    return res.json(perfil);

  } catch (err) {
    console.log("ERROR PERFIL:", err);
    return res.status(500).json({ error: "Error obteniendo perfil" });
  }
};

// ====================================================
// GET /api/perfil/public/:userId
// - Devuelve datos bancarios (simulado) para pagos
// ====================================================
exports.publico = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ error: "userId inválido" });
    }

    const perfil = await Perfil.findOne({ where: { userId } });
    if (!perfil) {
      return res.status(404).json({ error: "Perfil no encontrado" });
    }

    return res.json({
      userId,
      nombreCompleto: perfil.nombreCompleto || "",
      banco: perfil.banco || null,
      tipoCuenta: perfil.tipoCuenta || null,
      numeroCuenta: perfil.numeroCuenta || null,
      titularCuenta: perfil.titularCuenta || null,
      cedulaTitular: perfil.cedulaTitular || null,
      qrCuentaUrl: perfil.qrCuentaUrl || null,
    });
  } catch (err) {
    console.log("ERROR PERFIL PUBLICO:", err);
    return res.status(500).json({ error: "Error obteniendo datos" });
  }
};

// ====================================================
// PUT /api/perfil
// ====================================================
exports.actualizar = async (req, res) => {
  try {
    let perfil = await Perfil.findOne({ where: { userId: req.user.id } });

    // 1️⃣ Si NO existe perfil → CREARLO
    if (!perfil) {
      perfil = await Perfil.create({
        userId: req.user.id,
        ...req.body,
      });
      return res.json({ perfil });
    }

    // 2️⃣ Si existe → ACTUALIZAR
    await perfil.update(req.body);

    return res.json({ perfil });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error actualizando perfil" });
  }
};

// ====================================================
// POST /api/perfil/qr
// - Sube imagen QR y guarda la ruta en qrCuentaUrl
// ====================================================
exports.subirQr = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Debes subir una imagen QR (campo: qr)" });
    }

    // Asegurar que exista perfil
    let perfil = await Perfil.findOne({ where: { userId: req.user.id } });
    if (!perfil) {
      perfil = await Perfil.create({ userId: req.user.id });
    }

    // req.file.path viene absoluto; guardamos URL relativa para servir estático
    // server.js ya expone /uploads
    const rel = "/uploads/banco/" + req.file.filename;
    perfil.qrCuentaUrl = rel;
    await perfil.save();

    return res.json({ ok: true, qrCuentaUrl: rel, perfil });
  } catch (err) {
    console.log("ERROR SUBIR QR PERFIL:", err);
    return res.status(500).json({ error: "Error subiendo QR" });
  }
};
