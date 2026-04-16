// Rutas del Portal de Estudiantes
// Login permanente: correo + código EST-XXXX
const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portal.controller');
const { verifyStudentToken } = require('../middleware/studentAuth.middleware');

// Ruta pública — sin autenticación
router.post('/login', portalController.loginEstudiante);

// Rutas protegidas — solo con token de estudiante
router.get('/perfil',     verifyStudentToken, portalController.getMiPerfil);
router.get('/matriculas', verifyStudentToken, portalController.getMisMatriculas);
router.get('/pagos',      verifyStudentToken, portalController.getMisPagos);
router.get('/horario',    verifyStudentToken, portalController.getMiHorario);

module.exports = router;
