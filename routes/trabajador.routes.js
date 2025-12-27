const express = require('express');
const router = express.Router();
const { Trabajador, User } = require('../models');

// ============================================================
// 🔹 LISTAR TODOS LOS TRABAJADORES
// ============================================================
router.get('/', async (req, res) => {
  try {
    const trabajadores = await Trabajador.findAll({
      include: {
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'email', 'rol']
      }
    });

    res.json({
      message: 'Lista de trabajadores obtenida correctamente.',
      trabajadores
    });
  } catch (error) {
    console.error('Error al obtener trabajadores:', error);
    res.status(500).json({ error: 'Error al obtener trabajadores.' });
  }
});

// ============================================================
// 🔍 BUSCAR PERFILES DE TRABAJADORES (EMPLEADOR)
// ============================================================
router.get('/buscar', async (req, res) => {
  try {
    const { categoria, experiencia } = req.query;

    const where = {};
    if (categoria) where.categoria = categoria;
    if (experiencia) where.experiencia = experiencia;

    const trabajadores = await Trabajador.findAll({
      where,
      include: {
        model: User,
        as: 'dueño',
        attributes: ['id', 'nombre', 'email', 'rol']
      }
    });

    res.json({
      message: 'Perfiles encontrados correctamente.',
      trabajadores
    });
  } catch (error) {
    console.error('Error al buscar perfiles:', error);
    res.status(500).json({ error: 'Error al buscar perfiles.' });
  }
});

// ============================================================
// 🔹 OBTENER UN TRABAJADOR POR ID
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const trabajador = await Trabajador.findByPk(req.params.id, {
      include: {
        model: User,
        as: 'usuario',
        attributes: ['id', 'nombre', 'email', 'rol']
      }
    });

    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado.' });
    }

    res.json({ trabajador });
  } catch (error) {
    console.error('Error al obtener trabajador:', error);
    res.status(500).json({ error: 'Error al obtener trabajador.' });
  }
});

// ============================================================
// 🔹 CREAR UN TRABAJADOR
// ============================================================
router.post('/', async (req, res) => {
  try {
    const {
      telefono,
      direccion,
      categoria,
      experiencia,
      descripcion,
      horario,
      fotoPerfil,
      userId
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
      direccion,
      categoria,
      experiencia,
      descripcion,
      horario,
      fotoPerfil,
      userId
    });

    res.status(201).json({
      message: 'Trabajador creado correctamente.',
      trabajador: nuevoTrabajador
    });
  } catch (error) {
    console.error('Error al crear trabajador:', error);
    res.status(500).json({ error: 'Error al crear trabajador.' });
  }
});

// ============================================================
// 🔹 ACTUALIZAR UN TRABAJADOR
// ============================================================
router.put('/:id', async (req, res) => {
  try {
    const trabajador = await Trabajador.findByPk(req.params.id);

    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado.' });
    }

    await trabajador.update(req.body);

    res.json({
      message: 'Trabajador actualizado correctamente.',
      trabajador
    });
  } catch (error) {
    console.error('Error al actualizar trabajador:', error);
    res.status(500).json({ error: 'Error al actualizar trabajador.' });
  }
});

// ============================================================
// 🔹 ELIMINAR TRABAJADOR
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    const trabajador = await Trabajador.findByPk(req.params.id);

    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado.' });
    }

    await trabajador.destroy();

    res.json({ message: 'Trabajador eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar trabajador:', error);
    res.status(500).json({ error: 'Error al eliminar trabajador.' });
  }
});

module.exports = router;
