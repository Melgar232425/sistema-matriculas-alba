const express = require('express');
const router = express.Router();
const docentePortalController = require('../controllers/docentePortal.controller');
const { verifyDocenteToken } = require('../middleware/docenteAuth.middleware');

router.post('/login', docentePortalController.loginDocente);

// Protegidas
router.use(verifyDocenteToken);
router.get('/cursos', docentePortalController.getCursos);
router.get('/cursos/:id/estudiantes', docentePortalController.getEstudiantesAsistencia);
router.post('/cursos/:curso_id/asistencias', docentePortalController.marcarAsistencia);

module.exports = router;
