"use strict";

const fs = require("fs");
const path = require("path");
const { PerfilEmpleador, Empleador, User } = require("../../models");

// ==========================================================
// 🔹 OBTENER NOMBRE DEL EMPLEADOR POR userId
// ==========================================================
exports.obtenerNombre = async (req, res) => {
  try {
    const { userId } = req.params;

    const empleador = await Empleador.findOne({
      where: { userId },
      include: [{ model: User, attributes: ["nombre"] }],
    });

    if (!empleador) {
      return res.status(404).json({ message: "Empleador no encontrado" });
    }

    return res.json({
      userId,
      nombre: empleador.User?.nombre || "Sin nombre",
    });
  } catch (error) {
    console.error("❌ Error al obtener nombre:", error);
    return res
      .status(500)
      .json({ message: "Error interno", error: error.message });
  }
};

// ==========================================================
// 🔹 CREAR PERFIL DEL EMPLEADOR (EXTENDIDO)
// ==========================================================
exports.crearPerfil = async (req, res) => {
  try {
    const {
      empleadorId,
      ubicacion,
      categoria,
      experiencia,
      biografia,
      habilidades,

      // 💳 bancario
      banco,
      tipoCuenta,
      numeroCuenta,
      titularCuenta,
      cedulaTitular,

      // 🔹 NUEVOS
      tipoEmpleador,
      empresaNombre,
      ruc,
    } = req.body;

    const idNum = parseInt(empleadorId, 10);
    if (isNaN(idNum) || idNum <= 0)
      return res.status(400).json({ message: "ID de empleador inválido" });

    const empleador = await Empleador.findByPk(idNum);
    if (!empleador)
      return res.status(404).json({ message: "El empleador no existe" });

    const existePerfil = await PerfilEmpleador.findOne({
      where: { empleadorId: idNum },
    });
    if (existePerfil)
      return res.status(400).json({ message: "El perfil ya existe, usa PUT" });

    // ===============================
    // Parseo habilidades
    // ===============================
    let habilidadesArray = [];
    if (habilidades) {
      try {
        habilidadesArray = JSON.parse(habilidades);
      } catch {}
    }

    // ===============================
    // Carpetas
    // ===============================
    const carpetaCV = path.join(__dirname, "../../uploads/empleador/cv");
    const carpetaFoto = path.join(__dirname, "../../uploads/empleador/foto");
    const carpetaRecord = path.join(
      __dirname,
      "../../uploads/empleador/record"
    );

    const carpetaQR = path.join(__dirname, "../../uploads/banco");

    fs.mkdirSync(carpetaCV, { recursive: true });
    fs.mkdirSync(carpetaFoto, { recursive: true });
    fs.mkdirSync(carpetaRecord, { recursive: true });
    fs.mkdirSync(carpetaQR, { recursive: true });

    let cvUrl = null;
    let fotoUrl = null;
    let recordPolicialUrl = null;
    let qrCuentaUrl = null;

    // ===============================
    // CV
    // ===============================
    if (req.files?.cv?.length > 0) {
      const cvName = `cv_${idNum}_${Date.now()}.pdf`;
      fs.writeFileSync(path.join(carpetaCV, cvName), req.files.cv[0].buffer);
      cvUrl = `/uploads/empleador/cv/${cvName}`;
    }

    // ===============================
    // FOTO
    // ===============================
    if (req.files?.foto?.length > 0) {
      const fotoName = `foto_${idNum}_${Date.now()}.jpg`;
      fs.writeFileSync(
        path.join(carpetaFoto, fotoName),
        req.files.foto[0].buffer
      );
      fotoUrl = `/uploads/empleador/foto/${fotoName}`;
    }

    // ===============================
    // 🔥 RECORD POLICIAL (PDF)
    // ===============================
    if (req.files?.recordPolicial?.length > 0) {
      const recordName = `record_${idNum}_${Date.now()}.pdf`;
      fs.writeFileSync(
        path.join(carpetaRecord, recordName),
        req.files.recordPolicial[0].buffer
      );
      recordPolicialUrl = `/uploads/empleador/record/${recordName}`;
    } else {
      return res.status(400).json({
        message: "Debe subir el récord policial en PDF",
      });
    }

    // ===============================
    // ✅ QR CUENTA (imagen)
    // ===============================
    if (req.files?.qrCuenta?.length > 0) {
      const qrName = `qr_${idNum}_${Date.now()}.jpg`;
      fs.writeFileSync(path.join(carpetaQR, qrName), req.files.qrCuenta[0].buffer);
      qrCuentaUrl = `/uploads/banco/${qrName}`;
    }

    const perfil = await PerfilEmpleador.create({
      empleadorId: idNum,
      ubicacion,
      categoria,
      experiencia: experiencia ? parseInt(experiencia, 10) : 0,
      biografia,
      habilidades: habilidadesArray,
      cvUrl,
      fotoUrl,

      // 🔹 NUEVOS CAMPOS
      tipoEmpleador: tipoEmpleador || "NATURAL",
      empresaNombre: tipoEmpleador === "JURIDICA" ? empresaNombre : null,
      ruc: tipoEmpleador === "JURIDICA" ? ruc : null,
      recordPolicialUrl,

      // 💳 bancario
      banco: banco || null,
      tipoCuenta: tipoCuenta || null,
      numeroCuenta: numeroCuenta || null,
      titularCuenta: titularCuenta || null,
      cedulaTitular: cedulaTitular || null,
      qrCuentaUrl,
      estadoVerificacion: "pendiente",
    });

    res.status(201).json({
      message: "Perfil creado correctamente",
      perfil,
    });
  } catch (error) {
    console.error("❌ Error al crear perfil:", error);
    return res.status(500).json({
      message: "Error al crear perfil",
      error: error.message,
    });
  }
};

// ==========================================================
// 🔹 ACTUALIZAR PERFIL DEL EMPLEADOR (EXTENDIDO)
// ==========================================================
exports.actualizarPerfil = async (req, res) => {
  try {
    const { empleadorId } = req.params;

    const perfil = await PerfilEmpleador.findOne({
      where: { empleadorId },
    });
    if (!perfil)
      return res.status(404).json({ message: "Perfil no encontrado" });

    // ===============================
    // Parsear habilidades
    // ===============================
    let habilidadesArray = perfil.habilidades;
    if (req.body.habilidades) {
      try {
        habilidadesArray = JSON.parse(req.body.habilidades);
      } catch {}
    }

    const carpetaCV = path.join(__dirname, "../../uploads/empleador/cv");
    const carpetaFoto = path.join(__dirname, "../../uploads/empleador/foto");
    const carpetaRecord = path.join(
      __dirname,
      "../../uploads/empleador/record"
    );
    const carpetaQR = path.join(__dirname, "../../uploads/banco");

    fs.mkdirSync(carpetaCV, { recursive: true });
    fs.mkdirSync(carpetaFoto, { recursive: true });
    fs.mkdirSync(carpetaRecord, { recursive: true });
    fs.mkdirSync(carpetaQR, { recursive: true });

    // ===============================
    // Archivos
    // ===============================
    if (req.files?.cv?.length > 0) {
      const cvName = `cv_${empleadorId}_${Date.now()}.pdf`;
      fs.writeFileSync(
        path.join(carpetaCV, cvName),
        req.files.cv[0].buffer
      );
      perfil.cvUrl = `/uploads/empleador/cv/${cvName}`;
    }

    if (req.files?.foto?.length > 0) {
      const fotoName = `foto_${empleadorId}_${Date.now()}.jpg`;
      fs.writeFileSync(
        path.join(carpetaFoto, fotoName),
        req.files.foto[0].buffer
      );
      perfil.fotoUrl = `/uploads/empleador/foto/${fotoName}`;
    }

    if (req.files?.recordPolicial?.length > 0) {
      const recordName = `record_${empleadorId}_${Date.now()}.pdf`;
      fs.writeFileSync(
        path.join(carpetaRecord, recordName),
        req.files.recordPolicial[0].buffer
      );
      perfil.recordPolicialUrl = `/uploads/empleador/record/${recordName}`;
      perfil.estadoVerificacion = "pendiente"; // vuelve a revisión
    }

    // ===============================
    // ✅ QR cuenta bancaria
    // ===============================
    if (req.files?.qrCuenta?.length > 0) {
      const qrName = `qr_${empleadorId}_${Date.now()}.jpg`;
      fs.writeFileSync(
        path.join(carpetaQR, qrName),
        req.files.qrCuenta[0].buffer
      );
      perfil.qrCuentaUrl = `/uploads/banco/${qrName}`;
    }

    // ===============================
    // Campos normales
    // ===============================
    perfil.ubicacion = req.body.ubicacion ?? perfil.ubicacion;
    perfil.categoria = req.body.categoria ?? perfil.categoria;
    perfil.experiencia = req.body.experiencia
      ? parseInt(req.body.experiencia, 10)
      : perfil.experiencia;
    perfil.biografia = req.body.biografia ?? perfil.biografia;
    perfil.habilidades = habilidadesArray;

    // ===============================
    // NUEVOS
    // ===============================
    perfil.tipoEmpleador = req.body.tipoEmpleador ?? perfil.tipoEmpleador;
    perfil.empresaNombre =
      perfil.tipoEmpleador === "JURIDICA"
        ? req.body.empresaNombre ?? perfil.empresaNombre
        : null;
    perfil.ruc =
      perfil.tipoEmpleador === "JURIDICA"
        ? req.body.ruc ?? perfil.ruc
        : null;

    // ===============================
    // 💳 Bancario
    // ===============================
    perfil.banco = req.body.banco ?? perfil.banco;
    perfil.tipoCuenta = req.body.tipoCuenta ?? perfil.tipoCuenta;
    perfil.numeroCuenta = req.body.numeroCuenta ?? perfil.numeroCuenta;
    perfil.titularCuenta = req.body.titularCuenta ?? perfil.titularCuenta;
    perfil.cedulaTitular = req.body.cedulaTitular ?? perfil.cedulaTitular;

    await perfil.save();

    res.json({
      message: "Perfil actualizado correctamente",
      perfil,
    });
  } catch (error) {
    console.error("❌ Error al actualizar perfil:", error);
    return res.status(500).json({
      message: "Error al actualizar perfil",
      error: error.message,
    });
  }
};
