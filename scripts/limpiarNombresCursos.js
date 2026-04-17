const { promisePool } = require('../config/database');

(async () => {
    const [rows] = await promisePool.query("SELECT id, nombre FROM cursos WHERE nombre LIKE '%(Sección%'");
    for (const r of rows) {
        const limpio = r.nombre.replace(/ \(Sección [A-Z]\)/g, '').trim();
        await promisePool.query('UPDATE cursos SET nombre = ? WHERE id = ?', [limpio, r.id]);
        console.log(`${r.id} => "${limpio}"`);
    }
    console.log('✅ Nombres limpios en el calendario');
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
