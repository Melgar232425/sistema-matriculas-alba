const { promisePool } = require('../config/database');

async function cleanDemoData() {
    try {
        console.log('--- INICIANDO LIMPIEZA DE DATOS DEMO ---');

        // Buscar estudiantes demo
        const [estRows] = await promisePool.query("SELECT id FROM estudiantes WHERE nombres LIKE '%Demo%' OR email LIKE '%@demo.com'");
        const estIds = estRows.map(r => r.id);

        // Buscar cursos demo
        const [curRows] = await promisePool.query("SELECT id FROM cursos WHERE nombre LIKE '%Demo%'");
        const curIds = curRows.map(r => r.id);

        if (estIds.length > 0 || curIds.length > 0) {
            // Eliminar pagos asociados a matrículas de estos estudiantes o cursos
            console.log('Eliminando pagos asociados...');
            let matIds = [];
            
            if (estIds.length > 0) {
                const [matRows1] = await promisePool.query("SELECT id FROM matriculas WHERE estudiante_id IN (?)", [estIds]);
                matIds.push(...matRows1.map(r => r.id));
            }
            if (curIds.length > 0) {
                const [matRows2] = await promisePool.query("SELECT id FROM matriculas WHERE curso_id IN (?)", [curIds]);
                matIds.push(...matRows2.map(r => r.id));
            }
            
            // Unificar IDs de matrículas a eliminar
            matIds = [...new Set(matIds)];

            if (matIds.length > 0) {
                await promisePool.query("DELETE FROM pagos WHERE matricula_id IN (?)", [matIds]);
                console.log('Pagos eliminados.');
                
                console.log('Eliminando asistencias...');
                await promisePool.query("DELETE FROM asistencias WHERE matricula_id IN (?)", [matIds]);
                console.log('Asistencias eliminadas.');

                console.log('Eliminando matrículas...');
                await promisePool.query("DELETE FROM matriculas WHERE id IN (?)", [matIds]);
                console.log('Matrículas eliminadas.');
            }
        }

        // Eliminar estudiantes
        if (estIds.length > 0) {
            console.log('Eliminando estudiantes demo...');
            await promisePool.query("DELETE FROM estudiantes WHERE id IN (?)", [estIds]);
            console.log(`${estIds.length} Estudiantes eliminados.`);
        }

        // Eliminar cursos
        if (curIds.length > 0) {
            console.log('Eliminando cursos demo...');
            await promisePool.query("DELETE FROM cursos WHERE id IN (?)", [curIds]);
            console.log(`${curIds.length} Cursos eliminados.`);
        }

        // Eliminar docentes
        const [docRows] = await promisePool.query("SELECT id FROM docentes WHERE nombres LIKE '%Demo%'");
        const docIds = docRows.map(r => r.id);
        if (docIds.length > 0) {
            console.log('Eliminando docentes demo...');
            await promisePool.query("DELETE FROM docentes WHERE id IN (?)", [docIds]);
            console.log(`${docIds.length} Docentes eliminados.`);
        }

        console.log('✅ Base de datos restaurada al punto exacto anterior.');
        process.exit(0);

    } catch (error) {
        console.error('ERROR LIMPIANDO DATOS:', error);
        process.exit(1);
    }
}

cleanDemoData();
