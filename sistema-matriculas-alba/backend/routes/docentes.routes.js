const express = require('express');
const router = express.Router();
const docentesController = require('../controllers/docentes.controller');

// Obtener todos los docentes
router.get('/', docentesController.obtenerTodos);

// Obtener un docente por ID
router.get('/:id', docentesController.obtenerPorId);

// Crear nuevo docente
router.post('/', docentesController.crear);

// Actualizar docente
router.put('/:id', docentesController.actualizar);

// Eliminar (desactivar) docente
router.delete('/:id', docentesController.eliminar);

module.exports = router;
