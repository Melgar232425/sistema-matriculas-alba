// Rutas para reportes
const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');

// Dashboard / Estadísticas generales
router.get('/dashboard', reportesController.dashboard);

// Reporte de estudiantes por curso
router.get('/estudiantes-por-curso', reportesController.estudiantesPorCurso);

// Reporte de ingresos por período
router.get('/ingresos', reportesController.ingresos);

// Reporte de morosidad
router.get('/morosidad', reportesController.morosidad);

// Reporte de matrículas por período
router.get('/matriculas-periodo', reportesController.matriculasPorPeriodo);

module.exports = router;
