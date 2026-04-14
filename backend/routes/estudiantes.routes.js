// Rutas para gestión de estudiantes
const express = require('express');
const router = express.Router();
const estudiantesController = require('../controllers/estudiantes.controller');

// Obtener todos los estudiantes
router.get('/', estudiantesController.obtenerTodos);

// Obtener un estudiante por ID
router.get('/:id', estudiantesController.obtenerPorId);

// Buscar estudiante por DNI
router.get('/buscar/dni/:dni', estudiantesController.buscarPorDni);

// Crear nuevo estudiante
router.post('/', estudiantesController.crear);

// Actualizar estudiante
router.put('/:id', estudiantesController.actualizar);

// Eliminar estudiante (cambiar estado a inactivo)
router.delete('/:id', estudiantesController.eliminar);

// Obtener matrículas de un estudiante
router.get('/:id/matriculas', estudiantesController.obtenerMatriculas);

// Obtener historial completo de un estudiante
router.get('/:id/historial', estudiantesController.obtenerHistorial);

module.exports = router;
