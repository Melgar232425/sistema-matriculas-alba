const { promisePool } = require('../config/database');

async function createTable() {
    try {
        console.log('Creando tabla de seguimientos...');
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
        console.log('Tabla seguimientos creada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('Error al crear la tabla:', error);
        process.exit(1);
    }
}

createTable();
