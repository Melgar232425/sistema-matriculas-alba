const { promisePool } = require('../config/database');

async function listDocentes() {
    try {
        const [rows] = await promisePool.query('SELECT id, nombres, apellidos, especialidad FROM docentes WHERE estado = "activo"');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

listDocentes();
