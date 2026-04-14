const { promisePool } = require('../config/database');

async function updateCursosTable() {
    try {
        console.log('Iniciando migración para actualizar la tabla cursos...');

        // Verificar si la columna 'aula' ya existe
        const [columns] = await promisePool.query("SHOW COLUMNS FROM cursos LIKE 'aula'");

        if (columns.length === 0) {
            console.log('Agregando columna "aula" a la tabla cursos...');
            await promisePool.query(`
                ALTER TABLE cursos 
                ADD COLUMN aula VARCHAR(50) NULL AFTER seccion;
            `);
            console.log('✅ Columna "aula" agregada exitosamente.');
        } else {
            console.log('ℹ️ La columna "aula" ya existe en la tabla cursos.');
        }

        console.log('Migración completada exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        process.exit(1);
    }
}

updateCursosTable();
