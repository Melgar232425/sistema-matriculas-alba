/**
 * SCRIPT: Secciones adicionales para que cada docente dicte 4 horas/día todos los días
 * 
 * LÓGICA SIN CHOQUES:
 * - Aulas "Impares" (1,3,5,7): turno 7-9AM y 2-4PM
 * - Aulas "Pares" (2,4,6,8):   turno 9-11AM y 4-6PM
 * - Laboratorios (1,2):        turno 4-6PM y 7-9PM
 *
 * Cada docente ocupa su aula dedicada en los bloques que le corresponden,
 * alternando entre L-M-V (Lunes, Miercoles y Viernes) y M-J-S (Martes, Jueves y Sabado)
 * 
 * Resultado: TODOS los docentes enseñan 4 horas los LUNES y 4 horas los MARTES (y demás días)
 */

const { promisePool } = require('../config/database');

const CICLO_ID = 2;
const FECHA_INICIO = '2026-04-01';
const FECHA_FIN    = '2026-07-31';

// Códigos de sección B, C, D por cada curso (3 nuevas x 10 cursos = 30 nuevas)
// Formato: [codigo, nombre, horario, aula, seccion, codigo_docente]
const NUEVAS_SECCIONES = [
  // ── DOC-P01 (Carlos Quispe, Aula 1, Aritmética) ──
  // A ya existe: L-M-V 7-9 AM, Aula 1
  ['CUR-A01-B', 'Aritmética',  'Lunes, Miercoles y Viernes 2:00 PM - 4:00 PM',    'Aula 1', 'Sección B', 'DOC-P01'],
  ['CUR-A01-C', 'Aritmética',  'Martes, Jueves y Sabado 7:00 AM - 9:00 AM',       'Aula 1', 'Sección C', 'DOC-P01'],
  ['CUR-A01-D', 'Aritmética',  'Martes, Jueves y Sabado 2:00 PM - 4:00 PM',       'Aula 1', 'Sección D', 'DOC-P01'],

  // ── DOC-P07 (Miguel Flores, Aula 2, Álgebra) ──
  // A ya existe: L-M-V 9-11 AM, Aula 2
  ['CUR-A02-B', 'Álgebra',     'Lunes, Miercoles y Viernes 4:00 PM - 6:00 PM',    'Aula 2', 'Sección B', 'DOC-P07'],
  ['CUR-A02-C', 'Álgebra',     'Martes, Jueves y Sabado 9:00 AM - 11:00 AM',      'Aula 2', 'Sección C', 'DOC-P07'],
  ['CUR-A02-D', 'Álgebra',     'Martes, Jueves y Sabado 4:00 PM - 6:00 PM',       'Aula 2', 'Sección D', 'DOC-P07'],

  // ── DOC-P08 (Lucia Castro, Aula 3, Geometría) ──
  // A ya existe: M-J-S 7-9 AM, Aula 3   ← esta es la que estaba SIN lunes
  ['CUR-A03-B', 'Geometría',   'Martes, Jueves y Sabado 2:00 PM - 4:00 PM',       'Aula 3', 'Sección B', 'DOC-P08'],
  ['CUR-A03-C', 'Geometría',   'Lunes, Miercoles y Viernes 7:00 AM - 9:00 AM',    'Aula 3', 'Sección C', 'DOC-P08'],  // ← LUNES ya cubierto
  ['CUR-A03-D', 'Geometría',   'Lunes, Miercoles y Viernes 2:00 PM - 4:00 PM',    'Aula 3', 'Sección D', 'DOC-P08'],

  // ── DOC-P09 (Francisco Mendoza, Aula 4, Trigonometría) ──
  // A ya existe: M-J-S 9-11 AM, Aula 4
  ['CUR-A04-B', 'Trigonometría','Martes, Jueves y Sabado 4:00 PM - 6:00 PM',      'Aula 4', 'Sección B', 'DOC-P09'],
  ['CUR-A04-C', 'Trigonometría','Lunes, Miercoles y Viernes 9:00 AM - 11:00 AM',  'Aula 4', 'Sección C', 'DOC-P09'],
  ['CUR-A04-D', 'Trigonometría','Lunes, Miercoles y Viernes 4:00 PM - 6:00 PM',   'Aula 4', 'Sección D', 'DOC-P09'],

  // ── DOC-P03 (Jorge Villaverde, Aula 5, Física) ──
  // A ya existe: L-M-V 2-4 PM, Aula 5
  ['CUR-A05-B', 'Física',      'Lunes, Miercoles y Viernes 7:00 AM - 9:00 AM',    'Aula 5', 'Sección B', 'DOC-P03'],
  ['CUR-A05-C', 'Física',      'Martes, Jueves y Sabado 2:00 PM - 4:00 PM',       'Aula 5', 'Sección C', 'DOC-P03'],
  ['CUR-A05-D', 'Física',      'Martes, Jueves y Sabado 7:00 AM - 9:00 AM',       'Aula 5', 'Sección D', 'DOC-P03'],

  // ── DOC-P04 (Ana Paredes, Aula 6, Química) ──
  // A ya existe: L-M-V 4-6 PM, Aula 6
  ['CUR-A06-B', 'Química',     'Lunes, Miercoles y Viernes 9:00 AM - 11:00 AM',   'Aula 6', 'Sección B', 'DOC-P04'],
  ['CUR-A06-C', 'Química',     'Martes, Jueves y Sabado 4:00 PM - 6:00 PM',       'Aula 6', 'Sección C', 'DOC-P04'],
  ['CUR-A06-D', 'Química',     'Martes, Jueves y Sabado 9:00 AM - 11:00 AM',      'Aula 6', 'Sección D', 'DOC-P04'],

  // ── DOC-P05 (Roberto Salinas, Aula 7, Biología) ──
  // A ya existe: M-J-S 2-4 PM, Aula 7
  ['CUR-A07-B', 'Biología',    'Martes, Jueves y Sabado 7:00 AM - 9:00 AM',       'Aula 7', 'Sección B', 'DOC-P05'],
  ['CUR-A07-C', 'Biología',    'Lunes, Miercoles y Viernes 2:00 PM - 4:00 PM',    'Aula 7', 'Sección C', 'DOC-P05'],
  ['CUR-A07-D', 'Biología',    'Lunes, Miercoles y Viernes 7:00 AM - 9:00 AM',    'Aula 7', 'Sección D', 'DOC-P05'],

  // ── DOC-P02 (María Condori, Aula 8, Lenguaje) ──
  // A ya existe: M-J-S 4-6 PM, Aula 8
  ['CUR-A08-B', 'Lenguaje y Comunicación','Martes, Jueves y Sabado 9:00 AM - 11:00 AM',   'Aula 8', 'Sección B', 'DOC-P02'],
  ['CUR-A08-C', 'Lenguaje y Comunicación','Lunes, Miercoles y Viernes 4:00 PM - 6:00 PM', 'Aula 8', 'Sección C', 'DOC-P02'],
  ['CUR-A08-D', 'Lenguaje y Comunicación','Lunes, Miercoles y Viernes 9:00 AM - 11:00 AM','Aula 8', 'Sección D', 'DOC-P02'],

  // ── DOC-P06 (Sandra Ruiz, Lab 1, Historia) ──
  // A ya existe: L-M-V 7-9 PM, Lab 1
  ['CUR-A09-B', 'Historia del Perú','Lunes, Miercoles y Viernes 4:00 PM - 6:00 PM',    'Laboratorio 1', 'Sección B', 'DOC-P06'],
  ['CUR-A09-C', 'Historia del Perú','Martes, Jueves y Sabado 7:00 PM - 9:00 PM',       'Laboratorio 1', 'Sección C', 'DOC-P06'],
  ['CUR-A09-D', 'Historia del Perú','Martes, Jueves y Sabado 4:00 PM - 6:00 PM',       'Laboratorio 1', 'Sección D', 'DOC-P06'],

  // ── DOC-P10 (Gabriela Aguilar, Lab 2, Razonamiento) ──
  // A ya existe: M-J-S 7-9 PM, Lab 2
  ['CUR-A10-B', 'Razonamiento Verbal','Martes, Jueves y Sabado 4:00 PM - 6:00 PM',    'Laboratorio 2', 'Sección B', 'DOC-P10'],
  ['CUR-A10-C', 'Razonamiento Verbal','Lunes, Miercoles y Viernes 7:00 PM - 9:00 PM', 'Laboratorio 2', 'Sección C', 'DOC-P10'],
  ['CUR-A10-D', 'Razonamiento Verbal','Lunes, Miercoles y Viernes 4:00 PM - 6:00 PM', 'Laboratorio 2', 'Sección D', 'DOC-P10'],
];

async function crearSeccionesAdicionales() {
  try {
    console.log('\n🏫 CREANDO SECCIONES ADICIONALES - Calendario Completo\n');

    // Obtener mapa codigo_docente => id_docente
    const [docentes] = await promisePool.query('SELECT id, codigo FROM docentes');
    const docenteMap = {};
    docentes.forEach(d => docenteMap[d.codigo] = d.id);

    let creados = 0;
    let omitidos = 0;

    for (const [cod, nombre, horario, aula, seccion, docCod] of NUEVAS_SECCIONES) {
      const docenteId = docenteMap[docCod];
      if (!docenteId) {
        console.log(`⚠️  Docente no encontrado: ${docCod}`);
        continue;
      }

      // Verificar si ya existe
      const [exist] = await promisePool.query('SELECT id FROM cursos WHERE codigo = ?', [cod]);
      if (exist.length > 0) {
        omitidos++;
        continue;
      }

      // Calcular precio base del curso A
      const curBase = cod.substring(0, 7); // CUR-A01
      const [base] = await promisePool.query('SELECT precio FROM cursos WHERE codigo = ?', [curBase]);
      const precio = base.length > 0 ? base[0].precio : 120;

      await promisePool.query(
        `INSERT INTO cursos 
         (codigo, nombre, descripcion, nivel, ciclo_id, horario, cupos_totales, cupos_disponibles, precio, fecha_inicio, fecha_fin, estado, docente_id, seccion, aula)
         VALUES (?, ?, ?, 'Preuniversitario', ?, ?, 40, 40, ?, ?, ?, 'activo', ?, ?, ?)`,
        [
          cod,
          `${nombre} (${seccion})`,
          `Sección adicional de ${nombre} para completar horario semanal`,
          CICLO_ID,
          horario,
          precio,
          FECHA_INICIO,
          FECHA_FIN,
          docenteId,
          seccion,
          aula
        ]
      );
      creados++;
      console.log(`   ✅ ${cod}: ${nombre} | ${horario} | ${aula}`);
    }

    console.log(`\n📊 RESUMEN:`);
    console.log(`   ✅ Secciones creadas:  ${creados}`);
    console.log(`   ⏭️  Ya existían:        ${omitidos}`);
    console.log(`\n📅 HORARIO DIARIO POR DOCENTE (todos los días):`);
    console.log(`   Cada docente ahora dicta 4 horas diarias × 6 días = 24 h/semana`);
    console.log(`\n   🗓️  LUNES (L-M-V):`);
    console.log(`   07-09h: Aritmética(A1) Geometría(A3) Física(A5/B) Biología(A7/D)`);
    console.log(`   09-11h: Álgebra(A2) Trigonometría(A4/C) Química(A6/B) Lenguaje(A8/D)`);
    console.log(`   14-16h: Aritmética(B) Geometría(D) Física(A5) Biología(A7/C)`);
    console.log(`   16-18h: Álgebra(B) Trigonometría(D) Química(A6) Lenguaje(C) Historia(B) Razonamiento(D)`);
    console.log(`   19-21h: Historia(A) Razonamiento(C)`);
    console.log(`\n   🗓️  MARTES (M-J-S):`);
    console.log(`   07-09h: Aritmética(C) Geometría(A) Física(D) Biología(B)`);
    console.log(`   09-11h: Álgebra(C) Trigonometría(A) Química(D) Lenguaje(B)`);
    console.log(`   14-16h: Aritmética(D) Geometría(B) Física(C) Biología(A)`);
    console.log(`   16-18h: Álgebra(D) Trigonometría(B) Química(C) Lenguaje(A) Historia(D) Razonamiento(B)`);
    console.log(`   19-21h: Historia(C) Razonamiento(A)`);
    console.log(`\n🎯 ¡Sistema listo para presentación en auditorio!\n`);

    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}

crearSeccionesAdicionales();
