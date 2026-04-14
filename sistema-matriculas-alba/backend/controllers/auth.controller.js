// Controlador para autenticación
const { promisePool } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }
    
    // Buscar usuario
    const [usuarios] = await promisePool.query(
      'SELECT * FROM usuarios WHERE username = ? AND estado = ?',
      [username, 'activo']
    );
    
    if (usuarios.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    const usuario = usuarios[0];
    
    // Validar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);
    
    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        username: usuario.username,
        rol: usuario.rol 
      },
      process.env.JWT_SECRET || 'academia_alba_secret',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
    
    // Actualizar último acceso
    await promisePool.query(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
      [usuario.id]
    );
    
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token: token,
        usuario: {
          id: usuario.id,
          username: usuario.username,
          nombre_completo: usuario.nombre_completo,
          email: usuario.email,
          rol: usuario.rol
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el login',
      error: error.message
    });
  }
};

// Obtener perfil del usuario autenticado
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [usuarios] = await promisePool.query(
      'SELECT id, username, nombre_completo, email, rol, ultimo_acceso FROM usuarios WHERE id = ?',
      [userId]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: usuarios[0]
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};
