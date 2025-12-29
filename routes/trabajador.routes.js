"use strict";

const express = require("express");
const router = express.Router();

const { Trabajador, User, PerfilLaboral } = require("../models");

// ============================================================
// ✅ Detectar alias real Trabajador -> User (user/usuario/etc)
// ============================================================
function getUserAssociation() {
  try {
    const assocs = Trabajador.associations || {};
    const assoc = Object.values(assocs).find((a) => a && a.target === User);
    return assoc || null; // incluye .as
  } catch (_) {
    return null;
  }
}

const USER_ASSOC = getUserAssociation(); // puede ser null

// =======================
// Helpers seguros
// =======================
function s(v, fallback = "") {
  const x = (v ?? "").toString().trim();
  return x.length ? x : fallback;
}

function pick(obj, keys, fallback = "") {
  if (!obj) return fallback;
  for (const k of keys) {
    const val = s(obj[k]);
    if (val) return val;
  }
  return fallback;
}

function years(v, fallback = 0) {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const str = String(v).trim();
  if (!str) return fallback;

  const m = str.match(/(\d+)/);
  if (m) {
    const num = Number(m[1]);
    return Number.isFinite(num) ? num : fallback;
  }

  const parsed = Number(str);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readExperience(obj) {
  if (!obj) return null;

  const keys = [
    "experiencia",
    "aniosExperiencia",
    "añosExperiencia",
    "anioExperiencia",
    "anios",
    "años",
    "years",
    "yearsExperience",
    "experienciaAnios",
    "exp",
    "tiempoExperiencia",
    "experienciaLaboral",
  ];

  for (const k of keys) {
    if (
      obj[k] !== undefined &&
      obj[k] !== null &&
      String(obj[k]).trim() !== ""
    ) {
      return years(obj[k], 0);
    }
  }
  return null;
}

function plain(x) {
  if (!x) return null;
  if (typeof x.get === "function") return x.get({ plain: true });
  return x;
}

// ✅ arma un perfil unificado SIN romper Flutter
function buildPerfil({ u, t, pl }) {
  u = plain(u);
  t = plain(t);
  pl = plain(pl);

  const direccion =
    pick(t || {}, ["direccion", "ubicacion", "direccionCompleta", "address", "location"], "") ||
    pick(pl || {}, ["direccion", "ubicacion", "direccionCompleta", "address", "location"], "");

  const categoria =
    pick(pl || {}, ["categoria", "profesion", "oficio", "category"], "") ||
    pick(t || {}, ["categoria", "profesion", "oficio", "category"], "");

  const telefono =
    pick(t || {}, ["telefono", "celular", "phone"], "") ||
    pick(pl || {}, ["telefono", "celular", "phone"], "");

  const expT = readExperience(t);
  const expPL = readExperience(pl);

  const experienciaFinal =
    expPL !== null && expPL !== undefined && expPL > 0
      ? expPL
      : expT !== null && expT !== undefined
      ? expT
      : 0;

  const habilidades = Array.isArray(pl?.habilidades)
    ? pl.habilidades
    : Array.isArray(t?.habilidades)
    ? t.habilidades
    : [];

  const fotoUrl =
    pick(t || {}, ["fotoPerfil", "fotoUrl", "foto", "avatarUrl"], "") ||
    pick(pl || {}, ["fotoPerfil", "fotoUrl", "foto", "avatarUrl"], "");

  const cvUrl =
    pick(t || {}, ["cvUrl", "cv", "archivoCv", "cvPdfUrl", "pdfCv", "urlCv"], "") ||
    pick(pl || {}, ["cvUrl", "cv", "archivoCv", "cvPdfUrl", "pdfCv", "urlCv"], "");

  const descripcion =
    pick(t || {}, ["descripcion", "bio"], "") ||
    pick(pl || {}, ["descripcion", "bio"], "");

  const horario =
    pick(t || {}, ["horario"], "") ||
    pick(pl || {}, ["horario"], "");

  return {
    id: t?.id ?? 0,
    userId: t?.userId ?? pl?.userId ?? u?.id ?? 0,

    telefono: telefono ?? "",
    direccion: direccion ?? "",
    categoria: categoria ?? "",
    experiencia: experienciaFinal, // ✅ numérico

    habilidades,
    fotoUrl: fotoUrl ?? "",
    fotoPerfil: fotoUrl ?? "",
    cvUrl: cvUrl ?? "",

    descripcion,
    horario,

    // ✅ compat flutter (anidado)
    usuario: u ? { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol } : null,

    // ✅ compat flutter (plano)
    nombre: u?.nombre ?? "",
    email: u?.email ?? "",
    rol: u?.rol ?? "",
  };
}

// ============================================================
// 🔹 LISTAR TODOS LOS TRABAJADORES
// GET /api/trabajador
// ============================================================
router.get("/", async (req, res) => {
  try {
    const rows = await Trabajador.findAll({
      include: USER_ASSOC
        ? [
            {
              association: USER_ASSOC,
              attributes: ["id", "nombre", "email", "rol"],
              required: false,
            },
          ]
        : [
            {
              model: User,
              attributes: ["id", "nombre", "email", "rol"],
              required: false,
            },
          ],
      order: [["updatedAt", "DESC"]],
      limit: 200,
    });

    const salida = rows.map((t) => {
      const u = USER_ASSOC ? t[USER_ASSOC.as] : t.User;
      return buildPerfil({ u, t, pl: null });
    });

    return res.json({
      ok: true,
      message: "Lista de trabajadores obtenida correctamente.",
      trabajadores: salida,
    });
  } catch (error) {
    console.error("Error al obtener trabajadores:", error);
    return res.status(500).json({ error: "Error al obtener trabajadores." });
  }
});

// ============================================================
// 🔍 BUSCAR PERFILES (EMPLEADOR)
// GET /api/trabajador/buscar?categoria=...&experiencia=...
// ============================================================
router.get("/buscar", async (req, res) => {
  try {
    const { categoria, experiencia } = req.query;

    const categoriaQ = s(categoria, "").trim();
    const expNum =
      experiencia !== undefined &&
      experiencia !== null &&
      String(experiencia).trim() !== ""
        ? years(experiencia, 0)
        : null;

    // =========================================================
    // 1) Con filtros: intentar por PerfilLaboral
    // =========================================================
    if (categoriaQ || expNum !== null) {
      let perfiles = [];
      try {
        const wherePL = {};
        if (categoriaQ) wherePL.categoria = categoriaQ;
        if (expNum !== null) wherePL.experiencia = expNum;

        perfiles = await PerfilLaboral.findAll({
          where: wherePL,
          limit: 200,
          order: [["updatedAt", "DESC"]],
        });
      } catch (_) {
        perfiles = [];
      }

      const userIds = perfiles.map((p) => p.userId).filter(Boolean);
      const trabajadorIds = perfiles.map((p) => p.trabajadorId).filter(Boolean);

      if (userIds.length === 0 && trabajadorIds.length === 0) {
        return res.json({ ok: true, message: "Perfiles encontrados correctamente.", trabajadores: [] });
      }

      let trabajadoresById = [];
      if (userIds.length === 0 && trabajadorIds.length > 0) {
        trabajadoresById = await Trabajador.findAll({
          where: { id: trabajadorIds },
          limit: 200,
        });
      }

      const userIdsFinal =
        userIds.length > 0 ? userIds : trabajadoresById.map((t) => t.userId).filter(Boolean);

      if (userIdsFinal.length === 0) {
        return res.json({ ok: true, message: "Perfiles encontrados correctamente.", trabajadores: [] });
      }

      const [users, trabajadores] = await Promise.all([
        User.findAll({
          where: { id: userIdsFinal },
          attributes: ["id", "nombre", "email", "rol"],
        }),
        Trabajador.findAll({
          where: { userId: userIdsFinal },
          limit: 200,
        }),
      ]);

      const userMap = new Map(users.map((u) => [u.id, u]));
      const tMap = new Map(trabajadores.map((t) => [t.userId, t]));
      const plByUser = new Map(perfiles.filter((pl) => pl.userId).map((pl) => [pl.userId, pl]));
      const plByTrab = new Map(perfiles.filter((pl) => pl.trabajadorId).map((pl) => [pl.trabajadorId, pl]));

      const salida = userIdsFinal
        .map((uid) => {
          const u = userMap.get(uid);
          if (!u) return null;

          const t = tMap.get(uid) || null;
          const pl = plByUser.get(uid) || (t?.id ? plByTrab.get(t.id) : null) || null;

          return buildPerfil({ u, t, pl });
        })
        .filter(Boolean);

      return res.json({ ok: true, message: "Perfiles encontrados correctamente.", trabajadores: salida });
    }

    // =========================================================
    // 2) Sin filtros: traer trabajadores + user (por asociación)
    // =========================================================
    const trabajadoresBase = await Trabajador.findAll({
      include: USER_ASSOC
        ? [
            {
              association: USER_ASSOC,
              attributes: ["id", "nombre", "email", "rol"],
              required: false,
            },
          ]
        : [
            {
              model: User,
              attributes: ["id", "nombre", "email", "rol"],
              required: false,
            },
          ],
      limit: 200,
      order: [["updatedAt", "DESC"]],
    });

    const basePlain = trabajadoresBase.map(plain);
    const userIdsBase = basePlain.map((t) => t.userId).filter(Boolean);
    const trabajadorIdsBase = basePlain.map((t) => t.id).filter(Boolean);

    let plByUser = [];
    let plByTrab = [];

    try {
      if (userIdsBase.length) {
        plByUser = await PerfilLaboral.findAll({ where: { userId: userIdsBase }, limit: 400 });
      }
    } catch (_) {
      plByUser = [];
    }

    try {
      if (trabajadorIdsBase.length) {
        plByTrab = await PerfilLaboral.findAll({ where: { trabajadorId: trabajadorIdsBase }, limit: 400 });
      }
    } catch (_) {
      plByTrab = [];
    }

    const plUserMap = new Map(plByUser.map((pl) => [pl.userId, pl]));
    const plTrabMap = new Map(plByTrab.map((pl) => [pl.trabajadorId, pl]));

    const salida = trabajadoresBase.map((t) => {
      const tPlain = plain(t);
      const u = USER_ASSOC ? plain(t[USER_ASSOC.as]) : plain(t.User);
      const pl = plUserMap.get(tPlain.userId) || plTrabMap.get(tPlain.id) || null;
      return buildPerfil({ u, t: tPlain, pl });
    });

    return res.json({
      ok: true,
      message: "Perfiles encontrados correctamente.",
      trabajadores: salida,
    });
  } catch (error) {
    console.error("Error al buscar perfiles:", error);
    return res.status(500).json({ error: "Error al buscar perfiles." });
  }
});

// ============================================================
// ✅ PERFIL PÚBLICO DEL TRABAJADOR (POR userId)
// GET /api/trabajador/publico/:userId
// ============================================================
router.get("/publico/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId || userId <= 0) {
      return res.status(400).json({ error: "userId inválido." });
    }

    const user = await User.findByPk(userId, {
      attributes: ["id", "nombre", "email", "rol"],
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const trabajador = await Trabajador.findOne({ where: { userId } });

    let perfilLaboral = null;
    try {
      perfilLaboral = await PerfilLaboral.findOne({ where: { userId } });
    } catch (_) {
      perfilLaboral = null;
    }

    if (!perfilLaboral && trabajador?.id) {
      try {
        perfilLaboral = await PerfilLaboral.findOne({ where: { trabajadorId: trabajador.id } });
      } catch (_) {
        perfilLaboral = null;
      }
    }

    if (!trabajador && !perfilLaboral) {
      return res.status(404).json({ error: "Trabajador no encontrado." });
    }

    const perfil = buildPerfil({ u: user, t: trabajador || null, pl: perfilLaboral || null });

    return res.json({ ok: true, perfil });
  } catch (error) {
    console.error("Error al obtener perfil público trabajador:", error);
    return res.status(500).json({ error: "Error al obtener perfil público." });
  }
});

// ============================================================
// 🔹 OBTENER UN TRABAJADOR POR ID (PK)
// GET /api/trabajador/:id
// ============================================================
router.get("/:id", async (req, res) => {
  try {
    const t = await Trabajador.findByPk(req.params.id, {
      include: USER_ASSOC
        ? [
            {
              association: USER_ASSOC,
              attributes: ["id", "nombre", "email", "rol"],
              required: false,
            },
          ]
        : [
            {
              model: User,
              attributes: ["id", "nombre", "email", "rol"],
              required: false,
            },
          ],
    });

    if (!t) return res.status(404).json({ error: "Trabajador no encontrado." });

    const u = USER_ASSOC ? t[USER_ASSOC.as] : t.User;
    const perfil = buildPerfil({ u, t, pl: null });

    return res.json({ ok: true, trabajador: perfil });
  } catch (error) {
    console.error("Error al obtener trabajador:", error);
    return res.status(500).json({ error: "Error al obtener trabajador." });
  }
});

// ============================================================
// 🔹 CREAR UN TRABAJADOR
// POST /api/trabajador
// ============================================================
router.post("/", async (req, res) => {
  try {
    const {
      telefono,
      direccion,
      ubicacion,
      categoria,
      experiencia,
      descripcion,
      horario,
      fotoPerfil,
      userId,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "El campo userId es obligatorio." });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario asociado no encontrado." });
    }

    const nuevoTrabajador = await Trabajador.create({
      telefono,
      direccion: direccion ?? ubicacion ?? "",
      categoria,
      experiencia: years(experiencia, 0),
      descripcion,
      horario,
      fotoPerfil,
      userId,
    });

    return res.status(201).json({
      ok: true,
      message: "Trabajador creado correctamente.",
      trabajador: nuevoTrabajador,
    });
  } catch (error) {
    console.error("Error al crear trabajador:", error);
    return res.status(500).json({ error: "Error al crear trabajador." });
  }
});

// ============================================================
// 🔹 ACTUALIZAR UN TRABAJADOR
// PUT /api/trabajador/:id
// ============================================================
router.put("/:id", async (req, res) => {
  try {
    const trabajador = await Trabajador.findByPk(req.params.id);
    if (!trabajador) return res.status(404).json({ error: "Trabajador no encontrado." });

    if (req.body.ubicacion && !req.body.direccion) {
      req.body.direccion = req.body.ubicacion;
    }

    if (req.body.experiencia !== undefined) {
      req.body.experiencia = years(req.body.experiencia, 0);
    }

    await trabajador.update(req.body);

    return res.json({
      ok: true,
      message: "Trabajador actualizado correctamente.",
      trabajador,
    });
  } catch (error) {
    console.error("Error al actualizar trabajador:", error);
    return res.status(500).json({ error: "Error al actualizar trabajador." });
  }
});

// ============================================================
// 🔹 ELIMINAR TRABAJADOR
// DELETE /api/trabajador/:id
// ============================================================
router.delete("/:id", async (req, res) => {
  try {
    const trabajador = await Trabajador.findByPk(req.params.id);
    if (!trabajador) return res.status(404).json({ error: "Trabajador no encontrado." });

    await trabajador.destroy();
    return res.json({ ok: true, message: "Trabajador eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar trabajador:", error);
    return res.status(500).json({ error: "Error al eliminar trabajador." });
  }
});

module.exports = router;
