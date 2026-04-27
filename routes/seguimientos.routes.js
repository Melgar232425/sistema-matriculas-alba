const express = require('express');
const router = express.Router();
const seguimientosController = require('../controllers/seguimientos.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Todas las rutas de seguimiento requieren token
router.get('/estudiante/:estudianteId', verifyToken, seguimientosController.obtenerPorEstudiante);
router.post('/', verifyToken, seguimientosController.crear);

module.exports = router;
