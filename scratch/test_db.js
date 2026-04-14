const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: {
          rejectUnauthorized: false
      }
    });

  try {
    const query = `
      SELECT e.id as estudiante_id, e.nombres, e.apellidos,
             m.id as matricula_id, m.monto_total, m.monto_pagado, m.estado_pago,
             c.nombre as curso
      FROM matriculas m
      INNER JOIN estudiantes e ON m.estudiante_id = e.id
      INNER JOIN cursos c ON m.curso_id = c.id
      WHERE m.estado_matricula = 'activa'
      AND m.estado_pago IN ('pendiente', 'parcial')
    `;

    const [rawRows] = await pool.query(query);
    console.log("Raw Matriculas Pendientes/Parciales:", rawRows);

    const queryGrouped = `
      SELECT e.codigo as estudiante_codigo, e.nombres,
             SUM(m.monto_total) as monto_total, 
             SUM(COALESCE(m.monto_pagado, 0)) as monto_pagado,
             SUM(m.monto_total - COALESCE(m.monto_pagado, 0)) as monto_pendiente
      FROM matriculas m
      INNER JOIN estudiantes e ON m.estudiante_id = e.id
      WHERE m.estado_matricula = 'activa'
      AND m.estado_pago IN ('pendiente', 'parcial')
      GROUP BY e.id
    `;
    const [groupedRows] = await pool.query(queryGrouped);
    console.log("\nGrouped Rows:", groupedRows);

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
