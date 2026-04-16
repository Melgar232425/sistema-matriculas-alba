const jwt = require('jsonwebtoken');

exports.verifyDocenteToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Falta token de docente' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified.rol !== 'docente') {
      return res.status(403).json({ success: false, message: 'Acceso no autorizado (solo docentes)' });
    }
    req.docente = verified;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token de docente inválido o expirado' });
  }
};
