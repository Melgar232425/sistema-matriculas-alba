const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. No se proporcionó token.'
    });
  }

  try {
    // Punto 4: Eliminamos fallback de JWT_SECRET
    if (!process.env.JWT_SECRET) {
        throw new Error('CRITICAL: JWT_SECRET no configurado en servidor');
    }
    
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Punto S9: Validar roles permitidos
    const rolesPermitidos = ['admin', 'director', 'matriculador'];
    if (!rolesPermitidos.includes(verified.rol)) {
        return res.status(403).json({ success: false, message: 'Rol de usuario no válido.' });
    }

    req.user = verified;
    next();
  } catch (error) {
    // Punto S10: Diferenciar expirado de inválido
    const isExpired = error.name === 'TokenExpiredError';
    res.status(403).json({
      success: false,
      code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      message: isExpired ? 'Tu sesión ha expirado.' : 'Token inválido.'
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Requiere rol de administrador.'
    });
  }
};

module.exports = {
  verifyToken,
  isAdmin
};
