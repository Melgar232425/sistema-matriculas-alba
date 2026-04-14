// Rutas para autenticación
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Login
router.post('/login', authController.login);

// Obtener perfil del usuario autenticado
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
