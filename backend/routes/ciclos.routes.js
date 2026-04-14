const express = require('express');
const router = express.Router();
const ciclosController = require('../controllers/ciclos.controller');

router.get('/', ciclosController.obtenerTodos);
router.post('/', ciclosController.crear);
router.put('/:id/estado', ciclosController.cambiarEstado);
router.delete('/:id', ciclosController.eliminar);

module.exports = router;
