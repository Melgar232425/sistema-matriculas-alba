/**
 * SCRIPT DE PRESENTACIÓN EN AUDITORIO - Academia Alba Perú
 * Genera datos realistas y completos para demostración:
 * - 10 Docentes especializados
 * - 10 Cursos con horarios sin choques (toda la semana)
 * - 20 Estudiantes peruanos reales
 * - Matrículas de todos los estudiantes en todos los cursos
 * - Pagos realistas (mix de pagado, parcial, pendiente)
 * - Asistencias históricas de toda la semana pasada
 */

const { promisePool } = require('../config/database');

// ─────────────────── DATOS MAESTROS ───────────────────

const CICLO_ACTIVO_ID = 2; // Ciclo I 2026

const DOCENTES = [
  { codigo: 'DOC-P01', nombres: 'Carlos Eduardo', apellidos: 'Quispe Herrera',   dni: '42156789', email: 'c.quispe@albaeduca.pe',     especialidad: 'Matemática / Física' },
  { codigo: 'DOC-P02', nombres: 'María Rosa',     apellidos: 'Condori Mamani',   dni: '38674521', email: 'm.condori@albaeduca.pe',    especialidad: 'Letras / Comunicación' },
  { codigo: 'DOC-P03', nombres: 'Jorge Luis',     apellidos: 'Villaverde Paz',   dni: '31259874', email: 'j.villaverde@albaeduca.pe', especialidad: 'Matemática / Física' },
  { codigo: 'DOC-P04', nombres: 'Ana Lucía',      apellidos: 'Paredes Torres',   dni: '45987123', email: 'a.paredes@albaeduca.pe',    especialidad: 'Biología / Química' },
  { codigo: 'DOC-P05', nombres: 'Roberto',        apellidos: 'Salinas Guevara',  dni: '29874563', email: 'r.salinas@albaeduca.pe',    especialidad: 'Ciencias de la Salud / Biología' },
  { codigo: 'DOC-P06', nombres: 'Sandra Patricia',apellidos: 'Ruiz Alvarado',    dni: '52364187', email: 's.ruiz@albaeduca.pe',       especialidad: 'Historia y Geografía' },
  { codigo: 'DOC-P07', nombres: 'Miguel Ángel',   apellidos: 'Flores Cárdenas',  dni: '37412965', email: 'm.flores@albaeduca.pe',     especialidad: 'Ingeniería / Ciencias Exactas' },
  { codigo: 'DOC-P08', nombres: 'Lucia Fernanda', apellidos: 'Castro Ramos',     dni: '48523761', email: 'l.castro@albaeduca.pe',     especialidad: 'Ingeniería / Ciencias Exactas' },
  { codigo: 'DOC-P09', nombres: 'Francisco',      apellidos: 'Mendoza Vega',     dni: '33698741', email: 'f.mendoza@albaeduca.pe',    especialidad: 'Matemática / Física' },
  { codigo: 'DOC-P10', nombres: 'Gabriela',       apellidos: 'Aguilar Soto',     dni: '41785236', email: 'g.aguilar@albaeduca.pe',    especialidad: 'Letras / Comunicación' },
];

// 10 cursos — horarios distribuidos sin ningún choque
// Turno Mañana: 7:00–9:00, 9:00–11:00
// Turno Tarde:  14:00–16:00, 16:00–18:00
// Turno Noche:  19:00–21:00
// Días: L-M-V y M-J-S para no cruzarse
const CURSOS = [
  { codigo:'CUR-A01', nombre:'Aritmética',            nivel:'Preuniversitario', precio:120, aula:'Aula 1',         seccion:'Turno Mañana', horario:'Lunes, Miércoles y Viernes 7:00–9:00 AM',   docIdx:0 },
  { codigo:'CUR-A02', nombre:'Álgebra',               nivel:'Preuniversitario', precio:120, aula:'Aula 2',         seccion:'Turno Mañana', horario:'Lunes, Miércoles y Viernes 9:00–11:00 AM',  docIdx:6 },
  { codigo:'CUR-A03', nombre:'Geometría',             nivel:'Preuniversitario', precio:120, aula:'Aula 3',         seccion:'Turno Mañana', horario:'Martes, Jueves y Sábado 7:00–9:00 AM',      docIdx:7 },
  { codigo:'CUR-A04', nombre:'Trigonometría',         nivel:'Preuniversitario', precio:120, aula:'Aula 4',         seccion:'Turno Mañana', horario:'Martes, Jueves y Sábado 9:00–11:00 AM',     docIdx:8 },
  { codigo:'CUR-A05', nombre:'Física',                nivel:'Preuniversitario', precio:130, aula:'Aula 5',         seccion:'Turno Tarde',  horario:'Lunes, Miércoles y Viernes 14:00–16:00 PM', docIdx:2 },
  { codigo:'CUR-A06', nombre:'Química',               nivel:'Preuniversitario', precio:130, aula:'Aula 6',         seccion:'Turno Tarde',  horario:'Lunes, Miércoles y Viernes 16:00–18:00 PM', docIdx:3 },
  { codigo:'CUR-A07', nombre:'Biología',              nivel:'Preuniversitario', precio:130, aula:'Aula 7',         seccion:'Turno Tarde',  horario:'Martes, Jueves y Sábado 14:00–16:00 PM',    docIdx:4 },
  { codigo:'CUR-A08', nombre:'Lenguaje y Comunicación',nivel:'Preuniversitario',precio:110, aula:'Aula 8',         seccion:'Turno Tarde',  horario:'Martes, Jueves y Sábado 16:00–18:00 PM',    docIdx:1 },
  { codigo:'CUR-A09', nombre:'Historia del Perú',     nivel:'Preuniversitario', precio:110, aula:'Laboratorio 1',  seccion:'Turno Noche',  horario:'Lunes, Miércoles y Viernes 19:00–21:00 PM', docIdx:5 },
  { codigo:'CUR-A10', nombre:'Razonamiento Verbal',   nivel:'Preuniversitario', precio:110, aula:'Laboratorio 2',  seccion:'Turno Noche',  horario:'Martes, Jueves y Sábado 19:00–21:00 PM',    docIdx:9 },
];

const ESTUDIANTES = [
  { codigo:'EST-001', nombres:'Renato Sebastián',  apellidos:'Alcántara Ríos',    dni:'76124583', telefono:'987654321', email:'r.alcantara@estudiante.pe',    apoderado:'Alberto Alcántara',    telApoderado:'945123678', dob:'2007-03-15' },
  { codigo:'EST-002', nombres:'Gianella Paola',    apellidos:'Rodríguez Paz',     dni:'76234591', telefono:'987123456', email:'g.rodriguez@estudiante.pe',    apoderado:'Carmen Paz',           telApoderado:'945234789', dob:'2007-07-22' },
  { codigo:'EST-003', nombres:'Diego Andrés',      apellidos:'Quispe Mamani',     dni:'76345612', telefono:'956789012', email:'d.quispe@estudiante.pe',       apoderado:'Juanita Mamani',       telApoderado:'945345890', dob:'2006-11-03' },
  { codigo:'EST-004', nombres:'Camila Fernanda',   apellidos:'Vargas León',       dni:'76456723', telefono:'956890123', email:'c.vargas@estudiante.pe',       apoderado:'Pedro Vargas',         telApoderado:'945456901', dob:'2007-05-18' },
  { codigo:'EST-005', nombres:'Mateo Alejandro',   apellidos:'Mendoza Vega',      dni:'76567834', telefono:'956901234', email:'m.mendoza@estudiante.pe',      apoderado:'Rosario Vega',         telApoderado:'945567012', dob:'2006-08-30' },
  { codigo:'EST-006', nombres:'Valentina',         apellidos:'Chávez Rojas',      dni:'76678945', telefono:'945012345', email:'v.chavez@estudiante.pe',       apoderado:'Luis Chávez',          telApoderado:'934678123', dob:'2007-01-09' },
  { codigo:'EST-007', nombres:'Sebastián Ignacio', apellidos:'Rojas Soto',        dni:'76789056', telefono:'945123456', email:'s.rojas@estudiante.pe',        apoderado:'Patricia Soto',        telApoderado:'934789234', dob:'2006-09-25' },
  { codigo:'EST-008', nombres:'Valeria Nicole',    apellidos:'Gómez Ruiz',        dni:'76890167', telefono:'945234567', email:'v.gomez@estudiante.pe',        apoderado:'Ricardo Gómez',        telApoderado:'934890345', dob:'2007-04-14' },
  { codigo:'EST-009', nombres:'Joaquín Emilio',    apellidos:'Condori Silva',     dni:'76901278', telefono:'945345678', email:'j.condori@estudiante.pe',      apoderado:'Elena Silva',          telApoderado:'934901456', dob:'2006-12-07' },
  { codigo:'EST-010', nombres:'Daniela Milagros',  apellidos:'Silva Castro',      dni:'77012389', telefono:'945456789', email:'d.silva@estudiante.pe',        apoderado:'Héctor Castro',        telApoderado:'935012567', dob:'2007-02-28' },
  { codigo:'EST-011', nombres:'Ángelo Fabrizio',   apellidos:'Torres Herrera',    dni:'77123490', telefono:'945567890', email:'a.torres@estudiante.pe',       apoderado:'Mónica Herrera',       telApoderado:'935123678', dob:'2006-06-19' },
  { codigo:'EST-012', nombres:'Jimena Isabel',     apellidos:'Flores Paredes',    dni:'77234501', telefono:'945678901', email:'ji.flores@estudiante.pe',      apoderado:'Wilson Flores',        telApoderado:'935234789', dob:'2007-08-11' },
  { codigo:'EST-013', nombres:'Rodrigo Alonso',    apellidos:'Cárdenas Mora',     dni:'77345612', telefono:'934901234', email:'r.cardenas@estudiante.pe',     apoderado:'Silvia Mora',          telApoderado:'923345890', dob:'2006-04-02' },
  { codigo:'EST-014', nombres:'Isabella Lucía',    apellidos:'Ramos Gutiérrez',   dni:'77456723', telefono:'934012345', email:'i.ramos@estudiante.pe',        apoderado:'Jorge Ramos',          telApoderado:'923456901', dob:'2007-10-16' },
  { codigo:'EST-015', nombres:'Fabrizio André',    apellidos:'Palomino Cruz',     dni:'77567834', telefono:'934123456', email:'f.palomino@estudiante.pe',     apoderado:'Ana Cruz',             telApoderado:'923567012', dob:'2006-07-29' },
  { codigo:'EST-016', nombres:'Ariana Sofía',      apellidos:'Huamán Quispe',     dni:'77678945', telefono:'934234567', email:'a.huaman@estudiante.pe',       apoderado:'David Huamán',         telApoderado:'923678123', dob:'2007-03-05' },
  { codigo:'EST-017', nombres:'Nicolás Martín',    apellidos:'Aguilar Campos',    dni:'77789056', telefono:'934345678', email:'n.aguilar@estudiante.pe',      apoderado:'Rosa Campos',          telApoderado:'923789234', dob:'2006-01-21' },
  { codigo:'EST-018', nombres:'Luciana Beatriz',   apellidos:'Salas Mendoza',     dni:'77890167', telefono:'934456789', email:'l.salas@estudiante.pe',        apoderado:'César Salas',          telApoderado:'923890345', dob:'2007-06-08' },
  { codigo:'EST-019', nombres:'Álvaro Jesús',      apellidos:'Díaz Lazo',         dni:'77901278', telefono:'934567890', email:'al.diaz@estudiante.pe',        apoderado:'Martha Lazo',          telApoderado:'923901456', dob:'2006-10-13' },
  { codigo:'EST-020', nombres:'Fernanda Alejandra',apellidos:'Cueva Ochoa',       dni:'78012389', telefono:'934678901', email:'fe.cueva@estudiante.pe',       apoderado:'Juan Ochoa',           telApoderado:'924012567', dob:'2007-09-01' },
];

// ─────────────────── HELPERS ───────────────────

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

function toSQLDate(d) {
  return d.toISOString().split('T')[0];
}

// ─────────────────── SCRIPT PRINCIPAL ───────────────────

async function seedPresentation() {
  try {
    console.log('\n🎯 INICIANDO CARGA DE DATOS DE PRESENTACIÓN - Academia Alba Perú\n');

    // ── 1. DOCENTES ──
    console.log('👨‍🏫 Insertando 10 docentes...');
    const docenteIds = [];
    for (const d of DOCENTES) {
      const [res] = await promisePool.query(
        `INSERT INTO docentes (codigo, nombres, apellidos, dni, telefono, email, especialidad, estado) 
         VALUES (?, ?, ?, ?, '999000000', ?, ?, 'activo')
         ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        [d.codigo, d.nombres, d.apellidos, d.dni, d.email, d.especialidad]
      );
      // fetch actual id for ON DUPLICATE case
      const [rows] = await promisePool.query('SELECT id FROM docentes WHERE codigo = ?', [d.codigo]);
      docenteIds.push(rows[0].id);
    }
    console.log(`   ✅ ${docenteIds.length} docentes listos.`);

    // ── 2. CURSOS ──
    console.log('📚 Insertando 10 cursos con horarios sin choque...');
    const cursoIds = [];
    const fechaInicio = '2026-04-01';
    const fechaFin = '2026-07-31';
    for (const c of CURSOS) {
      const docId = docenteIds[c.docIdx];
      const [res] = await promisePool.query(
        `INSERT INTO cursos (codigo, nombre, descripcion, nivel, ciclo_id, horario, cupos_totales, cupos_disponibles, precio, fecha_inicio, fecha_fin, estado, docente_id, seccion, aula)
         VALUES (?, ?, ?, 'Preuniversitario', ?, ?, 40, 20, ?, ?, ?, 'activo', ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        [c.codigo, c.nombre, `Curso completo de ${c.nombre} para el ciclo I 2026.`, CICLO_ACTIVO_ID, c.horario, c.precio, fechaInicio, fechaFin, docId, c.seccion, c.aula]
      );
      const [rows] = await promisePool.query('SELECT id FROM cursos WHERE codigo = ?', [c.codigo]);
      cursoIds.push(rows[0].id);
    }
    console.log(`   ✅ ${cursoIds.length} cursos listos.`);

    // ── 3. ESTUDIANTES ──
    console.log('🎓 Insertando 20 estudiantes...');
    const estudianteIds = [];
    for (const e of ESTUDIANTES) {
      await promisePool.query(
        `INSERT INTO estudiantes (codigo, nombres, apellidos, dni, fecha_nacimiento, direccion, telefono, email, nombre_apoderado, telefono_apoderado, estado)
         VALUES (?, ?, ?, ?, ?, 'Lima, Perú', ?, ?, ?, ?, 'activo')
         ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        [e.codigo, e.nombres, e.apellidos, e.dni, e.dob, e.telefono, e.email, e.apoderado, e.telApoderado]
      );
      const [rows] = await promisePool.query('SELECT id FROM estudiantes WHERE codigo = ?', [e.codigo]);
      estudianteIds.push(rows[0].id);
    }
    console.log(`   ✅ ${estudianteIds.length} estudiantes listos.`);

    // ── 4. MATRÍCULAS + PAGOS ──
    console.log('📋 Generando matrículas y pagos realistas...');
    const metodosPago = ['efectivo', 'yape', 'plin', 'transferencia'];
    // Grupos de pago: 60% pagado completo, 25% pago parcial, 15% pendiente
    const estadoPagoPool = [
      'pagado','pagado','pagado','pagado','pagado','pagado',
      'parcial','parcial','parcial',
      'pendiente','pendiente',
      'pagado','pagado','pagado','pagado','pagado',
      'parcial','parcial',
      'pendiente',
      'pagado',
    ];

    let matTotal = 0;
    const matriculaMap = {}; // estId -> [matId, ...]

    for (let ei = 0; ei < estudianteIds.length; ei++) {
      const estId = estudianteIds[ei];
      matriculaMap[estId] = [];
      const pagoEstado = estadoPagoPool[ei % estadoPagoPool.length];

      for (let ci = 0; ci < cursoIds.length; ci++) {
        const curId = cursoIds[ci];
        const precio = CURSOS[ci].precio;
        let montoPagado = 0;
        let estadoPago = 'pendiente';
        
        if (pagoEstado === 'pagado') {
          montoPagado = precio;
          estadoPago = 'pagado';
        } else if (pagoEstado === 'parcial') {
          montoPagado = Math.round(precio / 2);
          estadoPago = 'parcial';
        } else {
          montoPagado = 0;
          estadoPago = 'pendiente';
        }

        const matCodigo = `MAT-${String(estId).padStart(3,'0')}-${String(curId).padStart(3,'0')}`;
        const [matRes] = await promisePool.query(
          `INSERT INTO matriculas (codigo, estudiante_id, curso_id, fecha_matricula, monto_total, monto_pagado, estado_pago, estado_matricula)
           VALUES (?, ?, ?, '2026-04-03', ?, ?, ?, 'activa')`,
          [matCodigo, estId, curId, precio, montoPagado, estadoPago]
        );
        const matId = matRes.insertId;
        matriculaMap[estId].push(matId);
        matTotal++;

        // Reducir cupos
        await promisePool.query('UPDATE cursos SET cupos_disponibles = cupos_disponibles - 1 WHERE id = ?', [curId]);

        // Registro de pago si hay monto
        if (montoPagado > 0) {
          const recibo = `REC-${String(matId).padStart(5,'0')}`;
          const metodo = metodosPago[(ei + ci) % metodosPago.length];
          await promisePool.query(
            `INSERT INTO pagos (codigo, matricula_id, monto, fecha_pago, metodo_pago, numero_recibo, usuario_registro)
             VALUES (?, ?, ?, '2026-04-03', ?, ?, 'Sistema')`,
            [`PAG-${matId}-A`, matId, montoPagado, metodo, recibo]
          );
          
          // Si pagó parcial, agregar 2do pago programado (como pendiente por sistema)
          // — No registrado en BD, sólo el primero
        }
      }
    }
    console.log(`   ✅ ${matTotal} matrículas generadas (${estudianteIds.length} alumnos × ${cursoIds.length} cursos).`);

    // ── 5. ASISTENCIAS DE TODA LA SEMANA ──
    console.log('📆 Generando asistencias de la semana pasada...');
    
    // Calcular la semana pasada (Lunes a Sábado)
    const hoy = new Date();
    const lunesPassado = getMonday(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 7));
    
    const diasSemana = [];
    for (let i = 0; i < 6; i++) { // Lunes a Sábado
      const d = new Date(lunesPassado);
      d.setDate(lunesPassado.getDate() + i);
      diasSemana.push(toSQLDate(d));
    }
    
    // Mapa: que días tiene clase cada curso
    // L=1, M=2, X=3, J=4, V=5, S=6 (en JS: 1=Lun...6=Sab)
    const cursosDias = [
      [1, 3, 5], // CUR-A01 Aritmética: L-M-V
      [1, 3, 5], // CUR-A02 Álgebra: L-M-V
      [2, 4, 6], // CUR-A03 Geometría: M-J-S
      [2, 4, 6], // CUR-A04 Trigonometría: M-J-S
      [1, 3, 5], // CUR-A05 Física: L-M-V
      [1, 3, 5], // CUR-A06 Química: L-M-V
      [2, 4, 6], // CUR-A07 Biología: M-J-S
      [2, 4, 6], // CUR-A08 Lenguaje: M-J-S
      [1, 3, 5], // CUR-A09 Historia: L-M-V
      [2, 4, 6], // CUR-A10 Razonamiento: M-J-S
    ];

    let asistenciaTotal = 0;
    for (let ei = 0; ei < estudianteIds.length; ei++) {
      const estId = estudianteIds[ei];
      const matIds = matriculaMap[estId];

      for (let ci = 0; ci < matIds.length; ci++) {
        const matId = matIds[ci];
        const diasCurso = cursosDias[ci]; // 1=Lun,2=Mar...6=Sab

        for (const fechaStr of diasSemana) {
          const fechaObj = new Date(fechaStr + 'T12:00:00');
          const diaSemana = fechaObj.getDay() === 0 ? 7 : fechaObj.getDay(); // 1=Lun...7=Dom

          if (!diasCurso.includes(diaSemana)) continue; // No tiene clase ese día

          // 80% presente, 12% tardanza, 8% ausente
          const rand = Math.random();
          let estado = 'presente';
          if (rand > 0.92) estado = 'ausente';
          else if (rand > 0.80) estado = 'tardanza';

          await promisePool.query(
            'INSERT INTO asistencias (matricula_id, fecha, estado) VALUES (?, ?, ?)',
            [matId, fechaStr, estado]
          );
          asistenciaTotal++;
        }
      }
    }
    console.log(`   ✅ ${asistenciaTotal} registros de asistencia generados (semana pasada).`);

    // ── RESUMEN FINAL ──
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  🎉 PRESENTACIÓN LISTA - Academia Alba Perú ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║  👨‍🏫 Docentes:     ${DOCENTES.length} profesores especializados  ║`);
    console.log(`║  📚 Cursos:       ${CURSOS.length} cursos sin choque de horario ║`);
    console.log(`║  🎓 Estudiantes:  ${ESTUDIANTES.length} alumnos peruanos reales     ║`);
    console.log(`║  📋 Matrículas:   ${matTotal} registros activos           ║`);
    console.log(`║  📆 Asistencias:  ${asistenciaTotal} registros semanales          ║`);
    console.log('╚════════════════════════════════════════════╝\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedPresentation();
