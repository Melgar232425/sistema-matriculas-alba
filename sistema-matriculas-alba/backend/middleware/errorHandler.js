/**
 * Middleware Senior para manejo global de errores
 */
const { errorResponse } = require('../utils/apiResponse');

const globalErrorHandler = (err, req, res, next) => {
    console.error('--- GLOBAL ERROR CAUGHT ---');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Path:', req.path);
    console.error('Stack:', err.stack);
    console.error('---------------------------');

    // Errores específicos de JWT
    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        return errorResponse(res, 'Token de autenticación inválido', 401, err.message);
    }

    if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Tu sesión ha expirado', 401, err.message);
    }

    // Errores de Base de Datos
    if (err.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, 'Ya existe un registro con estos datos únicos', 400, err.message);
    }

    // Error por defecto
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Ocurrió un error inesperado en el servidor';
    
    return errorResponse(res, message, statusCode, err);
};

module.exports = globalErrorHandler;
