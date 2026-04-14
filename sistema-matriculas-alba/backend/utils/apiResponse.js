/**
 * Utilidad Senior para estandarizar las respuestas de la API
 */
const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
    return res.status(statusCode).json({
        success,
        message,
        data,
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        timestamp: new Date().toISOString()
    });
};

const successResponse = (res, data, message = 'Operación exitosa') => {
    return sendResponse(res, 200, true, message, data);
};

const createdResponse = (res, data, message = 'Recurso creado exitosamente') => {
    return sendResponse(res, 201, true, message, data);
};

const errorResponse = (res, message = 'Error interno del servidor', statusCode = 500, error = null) => {
    return sendResponse(res, statusCode, false, message, null, error);
};

module.exports = {
    successResponse,
    createdResponse,
    errorResponse
};
