// Rutas para gestión de cursos
const express = require('express');
const router = express.Router();
const cursosController = require('../controllers/cursos.controller');

// Obtener todos los cursos
router.get('/', cursosController.obtenerTodos);

// Obtener cursos disponibles (con cupos)
router.get('/disponibles/lista', cursosController.obtenerDisponibles);

// Consultar disponibilidad horaria para un día/ciclo/docente/aula
router.get('/disponibilidad', cursosController.obtenerDisponibilidadHorario);

// Obtener un curso por ID
router.get('/:id', cursosController.obtenerPorId);

// Crear nuevo curso
router.post('/', cursosController.crear);

// Actualizar curso
router.put('/:id', cursosController.actualizar);

// Eliminar curso (cambiar estado a inactivo)
router.delete('/:id', cursosController.eliminar);

module.exports = router;
