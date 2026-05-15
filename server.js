// Servidor principal del backend
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Importar rutas
const estudiantesRoutes = require('./routes/estudiantes.routes');
const cursosRoutes = require('./routes/cursos.routes');
const matriculasRoutes = require('./routes/matriculas.routes');
const pagosRoutes = require('./routes/pagos.routes');
const reportesRoutes = require('./routes/reportes.routes');
const authRoutes = require('./routes/auth.routes');
const docentesRoutes = require('./routes/docentes.routes');
const ciclosRoutes = require('./routes/ciclos.routes');
const portalRoutes = require('./routes/portal.routes');
const seguimientosRoutes = require('./routes/seguimientos.routes');
const { verifyToken } = require('./middleware/auth.middleware');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de Rate Limit General (S2)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // Máximo 200 peticiones por IP
  message: { message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.' }
});

// Configuración de Rate Limit para Login (S3)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Máximo 10 intentos
  message: { message: 'Demasiados intentos de login, por favor espera 15 minutos.' }
});

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
})); 
app.use(cors({
  origin: '*', 
  credentials: true
}));
app.options('*', cors()); // Manejar preflights globalmente
app.use(express.json({ limit: '1mb' })); // Punto P5: Límite de 1mb
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'API del Sistema de Matrículas - Academia Alba Perú',
    version: '1.0.0',
    status: 'activo'
  });
});

const globalErrorHandler = require('./middleware/errorHandler');

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/estudiantes', verifyToken, estudiantesRoutes);
app.use('/api/cursos', verifyToken, cursosRoutes);
app.use('/api/matriculas', verifyToken, matriculasRoutes);
app.use('/api/pagos', verifyToken, pagosRoutes);
app.use('/api/reportes', verifyToken, reportesRoutes);
app.use('/api/docentes', verifyToken, docentesRoutes);
app.use('/api/ciclos', verifyToken, ciclosRoutes);
app.use('/api/seguimientos', verifyToken, seguimientosRoutes);

// Portal de Estudiantes — sin verifyToken de admin (flujo independiente)
app.use('/api/portal', portalRoutes);

// Portal de Docentes (Asistencia) — flujo independiente
const docentePortalRoutes = require('./routes/docentePortal.routes');
app.use('/api/portal-docente', docentePortalRoutes);

// Ruta temporal para corregir la base de datos (Creación de tabla y estados)
app.get('/api/fix-db', async (req, res) => {
  try {
    const { promisePool } = require('./config/database');
    
    // Crear tabla de seguimientos si no existe
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS seguimientos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        estudiante_id INT NOT NULL,
        usuario_id INT,
        comentario TEXT NOT NULL,
        contacto_padre VARCHAR(255),
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
      )
    `);

    await promisePool.query("UPDATE matriculas SET estado_pago = 'pagado' WHERE CAST(monto_pagado AS DECIMAL(10,2)) >= CAST(monto_total AS DECIMAL(10,2))");
    await promisePool.query("UPDATE matriculas SET estado_pago = 'parcial' WHERE CAST(monto_pagado AS DECIMAL(10,2)) > 0 AND CAST(monto_pagado AS DECIMAL(10,2)) < CAST(monto_total AS DECIMAL(10,2))");
    // 1. Limpiar duplicados en asistencias antes de crear el índice
    await promisePool.query(`
      DELETE a1 FROM asistencias a1
      INNER JOIN asistencias a2 
      WHERE a1.id < a2.id 
      AND a1.matricula_id = a2.matricula_id 
      AND a1.fecha = a2.fecha
    `);

    // 2. Asegurar índice único en asistencias para evitar errores de sincronización
    try {
      await promisePool.query("ALTER TABLE asistencias ADD UNIQUE INDEX idx_matricula_fecha (matricula_id, fecha)");
    } catch (e) {
      // Ignorar si ya existe
    }
    
    res.json({ success: true, message: "Limpieza profunda completada: Base de datos, tabla de seguimientos e índices actualizados" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Punto 2: Uso del Manejador de Errores Senior
app.use(globalErrorHandler);

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await testConnection();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Entorno: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
