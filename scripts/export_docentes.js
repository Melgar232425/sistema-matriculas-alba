const { promisePool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function exportDocentes() {
    try {
        const [rows] = await promisePool.query('SELECT id, nombres, apellidos, especialidad FROM docentes WHERE estado = "activo"');
        fs.writeFileSync(path.join(__dirname, '../docentes_utf8.json'), JSON.stringify(rows, null, 2), 'utf8');
        console.log('Exportación completada');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

exportDocentes();
