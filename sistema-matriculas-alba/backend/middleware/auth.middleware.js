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
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'academia_alba_secret');
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Token inválido o expirado.'
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
