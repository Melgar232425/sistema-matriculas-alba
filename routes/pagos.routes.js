// Rutas para gestión de pagos
const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagos.controller');

// Obtener todos los pagos
router.get('/', pagosController.obtenerTodos);

// Obtener un pago por ID
router.get('/:id', pagosController.obtenerPorId);

// Registrar nuevo pago
router.post('/', pagosController.registrar);

// Anular pago
router.delete('/:id', pagosController.anular);

module.exports = router;
