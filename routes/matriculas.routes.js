// Rutas para gestión de matrículas
const express = require('express');
const router = express.Router();
const matriculasController = require('../controllers/matriculas.controller');

// Obtener todas las matrículas
router.get('/', matriculasController.obtenerTodas);

// Obtener una matrícula por ID
router.get('/:id', matriculasController.obtenerPorId);

// Crear nueva matrícula
router.post('/', matriculasController.crear);

// Actualizar matrícula
router.put('/:id', matriculasController.actualizar);

// Cancelar matrícula
router.delete('/:id', matriculasController.cancelar);

// Obtener pagos de una matrícula
router.get('/:id/pagos', matriculasController.obtenerPagos);
// Obtener todas las matrículas de un estudiante
router.get('/estudiante/:estudiante_id', matriculasController.obtenerPorEstudiante);

module.exports = router;
