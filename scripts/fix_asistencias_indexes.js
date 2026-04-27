const { promisePool } = require('../config/database');

async function fixAsistenciasIndexes() {
    try {
        console.log('Verificando índices de la tabla asistencias...');
        
        // Intentar agregar el índice único. Si ya existe, fallará pero no detendrá el proceso.
        try {
            await promisePool.query(`
                ALTER TABLE asistencias 
                ADD UNIQUE INDEX idx_matricula_fecha (matricula_id, fecha)
            `);
            console.log('Índice único (matricula_id, fecha) creado con éxito.');
        } catch (idxError) {
            if (idxError.code === 'ER_DUP_KEYNAME') {
                console.log('El índice ya existía, procediendo...');
            } else {
                throw idxError;
            }
        }

        console.log('Sincronización de índices completada.');
        process.exit(0);
    } catch (error) {
        console.error('Error al actualizar índices:', error);
        process.exit(1);
    }
}

fixAsistenciasIndexes();
