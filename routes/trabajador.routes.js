const express = require('express');
const router = express.Router();

const { Trabajador, User, PerfilLaboral } = require('../models');

// ✅ Alias REAL del modelo Trabajador -> User
// (en tu model Trabajador: as: 'user')
const USER_ALIAS = 'user';

// =======================
// Helpers seguros
// =======================
function s(v, fallback = '') {
  const x = (v ?? '').toString().trim();
  return x.length ? x : fallback;
}

function pick(obj, keys, fallback = '') {
  if (!obj) return fallback;
  for (const k of keys) {
    const val = s(obj[k]);
    if (val) return val;
  }
  return fallback;
}

// ✅ convierte a número incluso si viene "3 años" o "3"
function years(v, fallback = 0) {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'number' && Number.isFinite(v)) return v;

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

// ✅ lee experiencia desde posibles campos
function readExperience(obj) {
  if (!obj) return null;

  const keys = [
    'experiencia',
    'aniosExperiencia',
    'añosExperiencia',
    'anioExperiencia',
    'anios',
    'años',
    'years',
    'yearsExperience',
    'experienciaAnios',
    'exp',
    'tiempoExperiencia',
    'experienciaLaboral',
  ];

  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
      return years(obj[k], 0);
    }
  }
  return null;
}

// ✅ normaliza instancia Sequelize a plain object
function plain(x) {
  if (!x) return null;
  if (typeof x.get === 'function') return x.get({ plain: true });
  return x;
}

// ✅ arma un perfil unificado SIN romper Flutter (incluye `usuario`)
function buildPerfil({ u, t, pl }) {
  u = plain(u);
  t = plain(t);
  pl = plain(pl);

  // ubicación
  const direccion =
    pick(t || {}, ['direccion', 'ubicacion', 'direccionCompleta', 'address', 'location'], '') ||
    pick(pl || {}, ['direccion', 'ubicacion', 'direccionCompleta', 'address', 'location'], '');

  // categoría
  const categoria =
    pick(pl || {}, ['categoria', 'profesion', 'oficio', 'category'], '') ||
    pick(t || {}, ['categoria', 'profesion', 'oficio', 'category'], '');

  // teléfono
  const telefono =
    pick(t || {}, ['telefono', 'celular', 'phone'], '') ||
    pick(pl || {}, ['telefono', 'celular', 'phone'], '');

  // ✅ experiencia (PL tiene prioridad si existe)
  const expT = readExperience(t);
  const expPL = readExperience(pl);
  const experienciaFinal =
    (expPL !== null && expPL !== undefined && expPL > 0)
      ? expPL
      : (expT !== null && expT !== undefined ? expT : 0);

  const habilidades = Array.isArray(pl?.habilidades)
    ? pl.habilidades
    : (Array.isArray(t?.habilidades) ? t.habilidades : []);

  const fotoUrl =
    pick(t || {}, ['fotoPerfil', 'fotoUrl', 'foto', 'avatarUrl'], '') ||
    pick(pl || {}, ['fotoPerfil', 'fotoUrl', 'foto', 'avatarUrl'], '');

  const cvUrl =
    pick(t || {}, ['cvUrl', 'cv', 'archivoCv', 'cvPdfUrl', 'pdfCv', 'urlCv'], '') ||
    pick(pl || {}, ['cvUrl', 'cv', 'archivoCv', 'cvPdfUrl', 'pdfCv', 'urlCv'], '');

  const descripcion =
    pick(t || {}, ['descripcion', 'bio'], '') ||
    pick(pl || {}, ['descripcion', 'bio'], '');

  const horario =
    pick(t || {}, ['horario'], '') ||
    pick(pl || {}, ['horario'], '');

  // ✅ COMPAT FLUTTER:
  // - campos directos
  // - y también `usuario`
  return {
    id: t?.id ?? 0,
    userId: u?.id ?? (t?.userId ?? pl?.userId ?? 0),

    telefono: telefono ?? '',
    direccion: direccion ?? '',
    categoria: categoria ?? '',
    experiencia: experienciaFinal, // ✅ NUMÉRICO

    habilidades,
    fotoUrl: fotoUrl ?? '',
    fotoPerfil: fotoUrl ?? '',
    cvUrl: cvUrl ?? '',

    descripcion,
    horario,

    // ✅ lo que tu Flutter suele usar
    usuario: u
      ? { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol }
      : null,

    // extras por compat
    nombre: u?.nombre ?? '',
    email: u?.email ?? '',
    rol: u?.rol ?? '',
  };
}

// ============================================================
// 🔹 LISTAR TODOS LOS TRABAJADORES
// GET /api/trabajador
// ============================================================
router.get('/', async (req, res) => {
  try {
    const rows = await Trabajador.findAll({
      include: [{
        model: User,
        as: USER_ALIAS, // ✅
        attributes: ['id', 'nombre', 'email', 'rol'],
        required: false,
      }],
      order: [['updatedAt', 'DESC']],
      limit: 200,
    });

    const salida = rows.map(t => buildPerfil({ u: t[USER_ALIAS], t, pl: null }));

    return res.json({
      ok: true,
      message: 'Lista de trabajadores obtenida correctamente.',
      trabajadores: salida,
    });
  } catch (error) {
    console.error('Error al obtener trabajadores:', error);
    return res.status(500).json({ error: 'Error al obtener trabajadores.' });
  }
});

// ============================================================
// 🔍 BUSCAR PERFILES (EMPLEADOR)
// GET /api/trabajador/buscar?categoria=...&experiencia=...
//
// ✅ SIEMPRE responde { trabajadores: [] }
// ✅ cada item trae `usuario`
// ✅ experiencia prioriza PerfilLaboral
// ============================================================
router.get('/buscar', async (req, res) => {
  try {
    const { categoria, experiencia } = req.query;

    const categoriaQ = s(categoria, '').trim();
    const expNum = (experiencia !== undefined && experiencia !== null && String(experiencia).trim() !== '')
      ? years(experiencia, 0)
      : null;

    // =========================================================
    // 1) Intentar por PerfilLaboral si hay filtros
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
          order: [['updatedAt', 'DESC']],
        });
      } catch (e) {
        perfiles = [];
      }

      // userId o trabajadorId (según tu BD)
      const userIds = perfiles.map(p => p.userId).filter(Boolean);
      const trabajadorIds = perfiles.map(p => p.trabajadorId).filter(Boolean);

      // si no hay nada, devuelve vacío (sin romper)
      if (userIds.length === 0 && trabajadorIds.length === 0) {
        return res.json({
          ok: true,
          message: 'Perfiles encontrados correctamente.',
          trabajadores: [],
        });
      }

      // si vienen por trabajadorId, saco los userIds desde Trabajador
      let trabajadoresById = [];
      if (userIds.length === 0 && trabajadorIds.length > 0) {
        trabajadoresById = await Trabajador.findAll({
          where: { id: trabajadorIds },
          limit: 200,
        });
      }

      const userIdsFinal = (userIds.length > 0)
        ? userIds
        : trabajadoresById.map(t => t.userId).filter(Boolean);

      if (userIdsFinal.length === 0) {
        return res.json({
          ok: true,
          message: 'Perfiles encontrados correctamente.',
          trabajadores: [],
        });
      }

      // traer users + trabajadores
      const [users, trabajadores] = await Promise.all([
        User.findAll({
          where: { id: userIdsFinal },
          attributes: ['id', 'nombre', 'email', 'rol'],
        }),
        Trabajador.findAll({
          where: { userId: userIdsFinal },
          limit: 200,
        }),
      ]);

      const userMap = new Map(users.map(u => [u.id, u]));
      const tMap = new Map(trabajadores.map(t => [t.userId, t]));
      const plByUser = new Map(perfiles.filter(pl => pl.userId).map(pl => [pl.userId, pl]));
      const plByTrab = new Map(perfiles.filter(pl => pl.trabajadorId).map(pl => [pl.trabajadorId, pl]));

      const salida = userIdsFinal
        .map(uid => {
          const u = userMap.get(uid);
          if (!u) return null;

          const t = tMap.get(uid) || null;
          const pl = (plByUser.get(uid)) || (t?.id ? plByTrab.get(t.id) : null) || null;

          return buildPerfil({ u, t, pl });
        })
        .filter(Boolean);

      return res.json({
        ok: true,
        message: 'Perfiles encontrados correctamente.',
        trabajadores: salida,
      });
    }

    // =========================================================
    // 2) SIN filtros: traer trabajadores + users (alias correcto)
    // =========================================================
    const trabajadoresBase = await Trabajador.findAll({
      include: [{
        model: User,
        as: USER_ALIAS, // ✅
        attributes: ['id', 'nombre', 'email', 'rol'],
        required: false,
      }],
      limit: 200,
      order: [['updatedAt', 'DESC']],
    });

    const basePlain = trabajadoresBase.map(plain);

    const userIds = basePlain.map(t => t.userId).filter(Boolean);
    const trabajadorIds = basePlain.map(t => t.id).filter(Boolean);

    let plByUser = [];
    let plByTrab = [];

    try {
      if (userIds.length) {
        plByUser = await PerfilLaboral.findAll({
          where: { userId: userIds },
          limit: 400,
        });
      }
    } catch (_) { plByUser = []; }

    try {
      if (trabajadorIds.length) {
        plByTrab = await PerfilLaboral.findAll({
          where: { trabajadorId: trabajadorIds },
          limit: 400,
        });
      }
    } catch (_) { plByTrab = []; }

    const plUserMap = new Map(plByUser.map(pl => [pl.userId, pl]));
    const plTrabMap = new Map(plByTrab.map(pl => [pl.trabajadorId, pl]));

    const salida = trabajadoresBase.map(t => {
      const tPlain = plain(t);
      const u = t[USER_ALIAS] ? plain(t[USER_ALIAS]) : null;
      const pl = plUserMap.get(tPlain.userId) || plTrabMap.get(tPlain.id) || null;
      return buildPerfil({ u, t: tPlain, pl });
    });

    return res.json({
      ok: true,
      message: 'Perfiles encontrados correctamente.',
      trabajadores: salida,
    });
  } catch (error) {
    console.error('Error al buscar perfiles:', error);
    return res.status(500).json({ error: 'Error al buscar perfiles.' });
  }
});

// ============================================================
// ✅ PERFIL PÚBLICO DEL TRABAJADOR (POR userId)
// GET /api/trabajador/publico/:userId
// ============================================================
router.get('/publico/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId || userId <= 0) {
      return res.status(400).json({ error: 'userId inválido.' });
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'nombre', 'email', 'rol'],
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
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
      return res.status(404).json({ error: 'Trabajador no encontrado.' });
    }

    const perfil = buildPerfil({
      u: user,
      t: trabajador || null,
      pl: perfilLaboral || null,
    });

    // ✅ debug opcional: /publico/:id?debug=1
    const debug = String(req.query.debug || '') === '1';

    return res.json({
      ok: true,
      perfil: {
        ...perfil,
        ...(debug ? {
          _debugExp: {
            trabajador: trabajador ? { id: trabajador.id, experiencia: trabajador.experiencia } : null,
            perfilLaboral: perfilLaboral ? { id: perfilLaboral.id, experiencia: perfilLaboral.experiencia } : null,
            expT: readExperience(trabajador),
            expPL: readExperience(perfilLaboral),
            experienciaFinal: perfil.experiencia,
          }
        } : {})
      },
    });
  } catch (error) {
    console.error('Error al obtener perfil público trabajador:', error);
    return res.status(500).json({ error: 'Error al obtener perfil público.' });
  }
});

// ============================================================
// 🔹 OBTENER UN TRABAJADOR POR ID (PK)
// GET /api/trabajador/:id
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const t = await Trabajador.findByPk(req.params.id, {
      include: [{
        model: User,
        as: USER_ALIAS, // ✅
        attributes: ['id', 'nombre', 'email', 'rol'],
        required: false,
      }],
    });

    if (!t) return res.status(404).json({ error: 'Trabajador no encontrado.' });

    const perfil = buildPerfil({ u: t[USER_ALIAS], t, pl: null });
    return res.json({ ok: true, trabajador: perfil });
  } catch (error) {
    console.error('Error al obtener trabajador:', error);
    return res.status(500).json({ error: 'Error al obtener trabajador.' });
  }
});

// ============================================================
// 🔹 CREAR UN TRABAJADOR
// POST /api/trabajador
// ============================================================
router.post('/', async (req, res) => {
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
      return res.status(400).json({ error: 'El campo userId es obligatorio.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario asociado no encontrado.' });
    }

    const nuevoTrabajador = await Trabajador.create({
      telefono,
      direccion: direccion ?? ubicacion ?? '',
      categoria,
      experiencia: years(experiencia, 0), // ✅ normalizado
      descripcion,
      horario,
      fotoPerfil,
      userId,
    });

    return res.status(201).json({
      ok: true,
      message: 'Trabajador creado correctamente.',
      trabajador: nuevoTrabajador,
    });
  } catch (error) {
    console.error('Error al crear trabajador:', error);
    return res.status(500).json({ error: 'Error al crear trabajador.' });
  }
});

// ============================================================
// 🔹 ACTUALIZAR UN TRABAJADOR
// PUT /api/trabajador/:id
// ============================================================
router.put('/:id', async (req, res) => {
  try {
    const trabajador = await Trabajador.findByPk(req.params.id);

    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado.' });
    }

    if (req.body.ubicacion && !req.body.direccion) {
      req.body.direccion = req.body.ubicacion;
    }

    if (req.body.experiencia !== undefined) {
      req.body.experiencia = years(req.body.experiencia, 0);
    }

    await trabajador.update(req.body);

    return res.json({
      ok: true,
      message: 'Trabajador actualizado correctamente.',
      trabajador,
    });
  } catch (error) {
    console.error('Error al actualizar trabajador:', error);
    return res.status(500).json({ error: 'Error al actualizar trabajador.' });
  }
});

// ============================================================
// 🔹 ELIMINAR TRABAJADOR
// DELETE /api/trabajador/:id
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    const trabajador = await Trabajador.findByPk(req.params.id);

    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado.' });
    }

    await trabajador.destroy();

    return res.json({ ok: true, message: 'Trabajador eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar trabajador:', error);
    return res.status(500).json({ error: 'Error al eliminar trabajador.' });
  }
});

module.exports = router;
