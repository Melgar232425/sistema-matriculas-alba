const { promisePool } = require('../config/database');

async function checkTableStructure() {
    try {
        console.log('Estructura de la tabla ASISTENCIAS:');
        const [columns] = await promisePool.query('DESCRIBE asistencias');
        console.table(columns);
        
        console.log('\nÍndices de la tabla ASISTENCIAS:');
        const [indexes] = await promisePool.query('SHOW INDEX FROM asistencias');
        console.table(indexes);
        
        process.exit(0);
    } catch (error) {
        console.error('Error al verificar estructura:', error);
        process.exit(1);
    }
}

checkTableStructure();
