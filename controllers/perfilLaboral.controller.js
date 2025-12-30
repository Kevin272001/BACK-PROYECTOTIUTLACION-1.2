"use strict";

const path = require("path");
const fs = require("fs");
const { PerfilLaboral } = require("../models");

// =======================================================
// 📂 Carpeta uploads para records policiales
// =======================================================
const UPLOADS_DIR = path.join(__dirname, "..", "uploads", "trabajadores", "records");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// =======================================================
// 🧩 Guardar récord policial (PDF/IMG) en disco
// =======================================================
function guardarRecordPolicial(file, userId) {
  const ext = path.extname(file.originalname || "");
  const nombre = `record_policial_${userId}_${Date.now()}${ext}`;
  const ruta = path.join(UPLOADS_DIR, nombre);

  fs.writeFileSync(ruta, file.buffer);

  return `/uploads/trabajadores/records/${nombre}`;
}

// =======================================================
// 🔹 1. Crear perfil laboral (✅ record opcional)
// =======================================================
exports.crearPerfilLaboral = async (req, res) => {
  try {
    const userId = req.user.id; // viene del token

    const {
      nombreCompleto,
      cedulaRuc,
      telefono,
      nombreComercial,
      categoria,
      descripcion,
      direccion,
      horario,
      experiencia,
      tipoPersona, // ✅ NUEVO
    } = req.body;

    // Verificar si ya existe un perfil para este usuario
    const existente = await PerfilLaboral.findOne({ where: { userId } });
    if (existente) {
      return res.status(400).json({ message: "El perfil ya existe" });
    }

    // ✅ OPCIONAL: si llega archivo, guardarlo; si no, queda null
    let recordPolicialUrl = null;
    if (req.file) {
      recordPolicialUrl = guardarRecordPolicial(req.file, userId);
    }

    // Crear el perfil
    const perfil = await PerfilLaboral.create({
      userId,
      nombreCompleto,
      cedulaRuc: cedulaRuc || null,
      telefono,
      nombreComercial,
      categoria,
      descripcion,
      direccion,
      horario,
      experiencia: Number(experiencia) || 0,

      // ✅ NUEVOS
      tipoPersona: tipoPersona === "JURIDICA" ? "JURIDICA" : "NATURAL",
      recordPolicialUrl,
    });

    return res.status(201).json({
      message: "Perfil creado correctamente",
      perfil,
    });
  } catch (error) {
    console.error("❌ Error al crear perfil:", error);
    return res.status(500).json({ message: "Error al crear perfil laboral" });
  }
};

// =======================================================
// ✅ SUBIR / REEMPLAZAR récord policial (endpoint dedicado)
// =======================================================
exports.subirRecordPolicial = async (req, res) => {
  try {
    const userId = req.user.id;

    const perfil = await PerfilLaboral.findOne({ where: { userId } });

    if (!perfil) {
      return res.status(404).json({ message: "No tienes perfil creado aún" });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Debes enviar el archivo recordPolicial (PDF/JPG/PNG)",
      });
    }

    let recordPolicialUrl = perfil.recordPolicialUrl;

    // ✅ borrar archivo anterior correctamente
    if (recordPolicialUrl && recordPolicialUrl.startsWith("/uploads/")) {
      const oldAbs = path.join(__dirname, "..", recordPolicialUrl.replace(/^\/+/, ""));
      if (fs.existsSync(oldAbs)) fs.unlinkSync(oldAbs);
    }

    recordPolicialUrl = guardarRecordPolicial(req.file, userId);

    await perfil.update({ recordPolicialUrl });

    return res.json({
      message: "Récord policial actualizado correctamente",
      recordPolicialUrl,
      perfil,
    });
  } catch (error) {
    console.error("❌ Error subiendo récord policial:", error);
    return res.status(500).json({ message: "Error al subir récord policial" });
  }
};

// =======================================================
// 🔹 2. Obtener perfil del TRABAJADOR logueado
// =======================================================
exports.obtenerPerfilDelTrabajador = async (req, res) => {
  try {
    const userId = req.user.id;

    const perfil = await PerfilLaboral.findOne({ where: { userId } });

    if (!perfil) {
      return res.status(404).json({ message: "No tienes perfil creado aún" });
    }

    return res.json({
      message: "Perfil obtenido correctamente",
      perfil,
    });
  } catch (error) {
    console.error("❌ Error obteniendo perfil:", error);
    return res.status(500).json({ message: "Error al obtener perfil" });
  }
};

// =======================================================
// 🔹 3. Verificar si el perfil existe (USADO POR FLUTTER)
// =======================================================
exports.verificarPerfilExistente = async (req, res) => {
  try {
    const userId = req.user.id;

    const perfil = await PerfilLaboral.findOne({ where: { userId } });

    return res.json({
      exists: perfil ? true : false,
    });
  } catch (error) {
    console.error("❌ Error verificando perfil:", error);
    return res.status(500).json({ message: "Error en verificación" });
  }
};

// =======================================================
// 🔹 4. Actualizar perfil laboral (archivo opcional)
// =======================================================
exports.actualizarPerfilLaboral = async (req, res) => {
  try {
    const userId = req.user.id;

    const perfil = await PerfilLaboral.findOne({ where: { userId } });

    if (!perfil) {
      return res.status(404).json({ message: "No tienes perfil creado aún" });
    }

    // Mantener récord anterior si no llega archivo nuevo
    let recordPolicialUrl = perfil.recordPolicialUrl;

    // Si llega nuevo archivo, reemplazar (y borrar el anterior)
    if (req.file) {
      if (recordPolicialUrl && recordPolicialUrl.startsWith("/uploads/")) {
        // ✅ FIX: antes estabas haciendo path.join con "/uploads..." y no borraba bien
        const oldAbs = path.join(__dirname, "..", recordPolicialUrl.replace(/^\/+/, ""));
        if (fs.existsSync(oldAbs)) fs.unlinkSync(oldAbs);
      }
      recordPolicialUrl = guardarRecordPolicial(req.file, userId);
    }

    const data = { ...req.body, recordPolicialUrl };

    // Normalizar experiencia
    if (data.experiencia !== undefined) {
      data.experiencia = Number(data.experiencia) || 0;
    }

    // Normalizar tipoPersona
    if (data.tipoPersona !== undefined) {
      data.tipoPersona = data.tipoPersona === "JURIDICA" ? "JURIDICA" : "NATURAL";
    }

    await perfil.update(data);

    return res.json({
      message: "Perfil actualizado correctamente",
      perfil,
    });
  } catch (error) {
    console.error("❌ Error actualizando perfil:", error);
    return res.status(500).json({ message: "Error al actualizar perfil laboral" });
  }
};

// =======================================================
// 🔹 5. Obtener todos los perfiles laborales
// =======================================================
exports.obtenerTodosPerfilesLaborales = async (req, res) => {
  try {
    const perfiles = await PerfilLaboral.findAll();

    return res.json({
      message: "Perfiles obtenidos correctamente",
      perfiles,
    });
  } catch (error) {
    console.error("❌ Error obteniendo perfiles:", error);
    return res.status(500).json({ message: "Error al obtener perfiles laborales" });
  }
};
