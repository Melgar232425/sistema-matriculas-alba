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
const { verifyToken } = require('./middleware/auth.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'API del Sistema de Matrículas - Academia Alba Perú',
    version: '1.0.0',
    status: 'activo'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/estudiantes', verifyToken, estudiantesRoutes);
app.use('/api/cursos', verifyToken, cursosRoutes);
app.use('/api/matriculas', verifyToken, matriculasRoutes);
app.use('/api/pagos', verifyToken, pagosRoutes);
app.use('/api/reportes', verifyToken, reportesRoutes);
app.use('/api/docentes', verifyToken, docentesRoutes);
app.use('/api/ciclos', verifyToken, ciclosRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

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
