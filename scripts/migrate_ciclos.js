const { promisePool } = require('../config/database');

async function migrate() {
    try {
        console.log('--- Database Migration: Ciclos ---');

        // 1. Create ciclos table
        console.log('Creating "ciclos" table...');
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS ciclos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                fecha_inicio DATE,
                fecha_fin DATE,
                estado ENUM('activo', 'inactivo') DEFAULT 'activo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ "ciclos" table created or already exists.');

        // 2. Add ciclo_id to cursos table
        console.log('Adding "ciclo_id" to "cursos" table...');
        const [columns] = await promisePool.query("SHOW COLUMNS FROM cursos LIKE 'ciclo_id'");
        if (columns.length === 0) {
            await promisePool.query(`
                ALTER TABLE cursos 
                ADD COLUMN ciclo_id INT NULL AFTER nivel,
                ADD CONSTRAINT fk_curso_ciclo FOREIGN KEY (ciclo_id) REFERENCES ciclos(id) ON DELETE SET NULL
            `);
            console.log('✅ "ciclo_id" column and foreign key added to cursos.');
        } else {
            console.log('ℹ️ "ciclo_id" column already exists.');
        }

        // 3. Create a default cycle if none exist
        const [existingCiclos] = await promisePool.query('SELECT id FROM ciclos LIMIT 1');
        if (existingCiclos.length === 0) {
            // Link existing courses to the default cycle
            // await promisePool.query("UPDATE cursos SET ciclo_id = ? WHERE ciclo_id IS NULL", [defaultId]);
            // console.log(`✅ Default cycle created (ID: ${defaultId}) and linked to existing courses.`);
        }

        console.log('--- Migration completed successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
