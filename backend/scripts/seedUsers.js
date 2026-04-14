const { promisePool } = require('../config/database');

async function seedUsers() {
    try {
        console.log('Creando tabla de usuarios si no existe...');
        await promisePool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombre_completo VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        rol VARCHAR(50) NOT NULL,
        estado VARCHAR(20) DEFAULT 'activo',
        ultimo_acceso TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

        console.log('Insertando usuarios...');
        // Usamos REPLACE o INSERT IGNORE para no duplicar
        const users = [
            ['director', 'admin123', 'Director General', 'director@academiaalba.com', 'director'],
            ['admin', 'admin123', 'Administrador del Sistema', 'admin@academiaalba.com', 'admin'],
            ['matriculador', 'admin123', 'Encargado de Matrículas', 'matriculas@academiaalba.com', 'matriculador']
        ];

        for (const user of users) {
            await promisePool.query(
                'INSERT IGNORE INTO usuarios (username, password, nombre_completo, email, rol) VALUES (?, ?, ?, ?, ?)',
                user
            );
        }

        console.log('Usuarios creados exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('Error al poblar usuarios:', error);
        process.exit(1);
    }
}

seedUsers();
