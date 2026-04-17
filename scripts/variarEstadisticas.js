const mysql = require('mysql2/promise');
require('dotenv').config();

async function variarEstadisticas() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_matriculas',
    port: process.env.DB_PORT || 3306
  });

  console.log('--- VARIANDO ESTADÍSTICAS PARA VISUALIZACIÓN ---');

  try {
    // Desactivar temporalmente los chequeos de FK para poder mover los datos libremente
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Obtener todos los cursos
    const [cursos] = await connection.query('SELECT id, nombre FROM cursos');
    
    // 2. Para cada curso, vamos a simular un número diferente de matrículas
    // Borraremos una cantidad aleatoria de matrículas de prueba para crear asimetría
    for (const curso of cursos) {
        const factorAleatorio = Math.floor(Math.random() * 15); // Borrar entre 0 y 15 matrículas
        if (factorAleatorio > 0) {
            console.log(`Variando ${curso.nombre}: reduciendo registros para crear efecto visual...`);
            // Limitamos el borrado para que el curso no se quede en cero
            await connection.query(
                'DELETE FROM matriculas WHERE curso_id = ? LIMIT ?', 
                [curso.id, factorAleatorio]
            );
        }
    }

    // 3. También vamos a variar los métodos de pago para que el gráfico circular no sea perfecto
    console.log('Variando canales de pago...');
    await connection.query("UPDATE pagos SET metodo_pago = 'yape' WHERE id % 3 = 0");
    await connection.query("UPDATE pagos SET metodo_pago = 'efectivo' WHERE id % 4 = 0");
    await connection.query("UPDATE pagos SET metodo_pago = 'transferencia' WHERE id % 7 = 0");

    // Reactivar chequeos de FK
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ ¡HECHO! Los datos ahora son asimétricos y realistas.');

  } catch (error) {
    console.error('Error variando datos:', error);
  } finally {
    await connection.end();
    process.exit();
  }
}

variarEstadisticas();
