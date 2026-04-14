const { promisePool } = require('../config/database');

async function setupDocentes() {
    try {
        console.log('Creando tabla docentes...');
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS docentes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                codigo VARCHAR(20) NOT NULL UNIQUE,
                nombres VARCHAR(100) NOT NULL,
                apellidos VARCHAR(100) NOT NULL,
                dni VARCHAR(20) NOT NULL UNIQUE,
                telefono VARCHAR(20),
                email VARCHAR(100) NOT NULL UNIQUE,
                especialidad VARCHAR(100),
                estado ENUM('activo', 'inactivo') DEFAULT 'activo',
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Tabla docentes creada exitosamente.');

        console.log('Agregando columnas a la tabla cursos...');

        // Agregar docente_id si no existe
        try {
            await promisePool.query('ALTER TABLE cursos ADD COLUMN docente_id INT');
            console.log('Columna docente_id agregada.');

            // Agregar foreign key
            await promisePool.query('ALTER TABLE cursos ADD CONSTRAINT fk_cursos_docente FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE SET NULL');
            console.log('Foreign key fk_cursos_docente agregada.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('La columna docente_id ya existe.');
            } else {
                console.log('Error agregando docente_id:', e.message);
            }
        }

        // Agregar seccion si no existe
        try {
            await promisePool.query("ALTER TABLE cursos ADD COLUMN seccion VARCHAR(50) DEFAULT 'Única'");
            console.log('Columna seccion agregada.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('La columna seccion ya existe.');
            } else {
                console.log('Error agregando seccion:', e.message);
            }
        }

        console.log('Migración completada exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración:', error);
        process.exit(1);
    }
}

setupDocentes();
