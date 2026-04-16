const jwt = require('jsonwebtoken');

// Middleware exclusivo para el portal de estudiantes
// Solo acepta tokens con rol 'estudiante' — no puede usarse para rutas del admin
const verifyStudentToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. No se proporcionó token de estudiante.'
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('CRITICAL: JWT_SECRET no configurado en servidor');
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // Solo permite tokens con rol 'estudiante'
    if (verified.rol !== 'estudiante') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Este portal es exclusivo para estudiantes.'
      });
    }

    req.estudiante = verified;
    next();
  } catch (error) {
    const isExpired = error.name === 'TokenExpiredError';
    res.status(403).json({
      success: false,
      code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      message: isExpired ? 'Tu sesión ha expirado.' : 'Token inválido.'
    });
  }
};

module.exports = { verifyStudentToken };
