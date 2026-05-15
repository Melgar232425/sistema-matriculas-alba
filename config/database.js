// Configuración de la conexión a MySQL
const mysql = require('mysql2');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Crear pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // Punto P6: Timeout de 10s
  charset: 'utf8mb4',     // Punto S11
  timezone: '-05:00',
  ssl: {
    rejectUnauthorized: false
  }
});

// Promisificar el pool para usar async/await
const promisePool = pool.promise();

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('Conexión exitosa a la base de datos MySQL (Perú Timezone)');
    connection.release();
    return true;
  } catch (error) {
    console.error('CRITICAL: Error al conectar a la base de datos:', error.message);
    throw error; // Punto 3: Lanzar error para que server.js lo atrape
  }
};

module.exports = { pool, promisePool, testConnection };
