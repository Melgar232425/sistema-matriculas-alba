const { promisePool } = require('../config/database');

async function updateDb() {
    try {
        console.log('Modifying rol column...');
        await promisePool.query("ALTER TABLE usuarios MODIFY COLUMN rol VARCHAR(50) NOT NULL DEFAULT 'admin'");

        // Update existing users in case they were created without a role
        await promisePool.query("UPDATE usuarios SET rol = 'director' WHERE username = 'director'");
        await promisePool.query("UPDATE usuarios SET rol = 'admin' WHERE username = 'admin'");
        await promisePool.query("UPDATE usuarios SET rol = 'matriculador' WHERE username = 'matriculador'");

        // Insert if they don't exist
        const users = [
            ['director', 'admin123', 'Director General', 'director@academiaalba.com', 'director'],
            ['admin', 'admin123', 'Administrador del Sistema', 'admin@academiaalba.com', 'admin'],
            ['matriculador', 'admin123', 'Encargado de Matrículas', 'matriculas@academiaalba.com', 'matriculador']
        ];

        for (const user of users) {
            // In case they exist but with wrong values, let's just do INSERT IGNORE
            await promisePool.query(
                'INSERT IGNORE INTO usuarios (username, password, nombre_completo, email, rol) VALUES (?, ?, ?, ?, ?)',
                user
            );
        }

        console.log('Database updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateDb();
