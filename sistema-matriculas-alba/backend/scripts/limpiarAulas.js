const db = require('../config/database');

async function cleanAulas() {
    try {
        console.log('Realizando limpieza de aulas en la base de datos...');
        await db.promisePool.query("UPDATE cursos SET aula = 'Laboratorio 1' WHERE aula = 'Lab 1';");
        await db.promisePool.query("UPDATE cursos SET aula = NULL WHERE aula NOT IN ('Aula 1', 'Aula 2', 'Aula 3', 'Aula 4', 'Aula 5', 'Aula 6', 'Aula 7', 'Aula 8', 'Laboratorio 1', 'Laboratorio 2');");
        console.log('Limpieza completada exitosamente.');
        process.exit(0);
    } catch(e) {
        console.error('Error durante la limpieza:', e);
        process.exit(1);
    }
}

cleanAulas();
