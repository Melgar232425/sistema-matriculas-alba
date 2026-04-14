const { promisePool } = require('../config/database');

const AFTERNOON_COURSES = [
    { nombre: "Aritmética", docente_id: 8, horario: "Lunes 15:00 - 17:00", seccion: "B" },
    { nombre: "Álgebra", docente_id: 8, horario: "Lunes 17:15 - 19:15", seccion: "B" },
    { nombre: "Geometría", docente_id: 9, horario: "Martes 15:00 - 17:00", seccion: "B" },
    { nombre: "Trigonometría", docente_id: 9, horario: "Martes 17:15 - 19:15", seccion: "B" },
    { nombre: "Física", docente_id: 9, horario: "Miércoles 15:00 - 17:00", seccion: "B" },
    { nombre: "Razonamiento Matemático", docente_id: 8, horario: "Miércoles 17:15 - 19:15", seccion: "B" },
    { nombre: "Química", docente_id: 11, horario: "Jueves 15:00 - 17:00", seccion: "B" },
    { nombre: "Biología", docente_id: 10, horario: "Jueves 17:15 - 19:15", seccion: "B" },
    { nombre: "Razonamiento Verbal", docente_id: 12, horario: "Viernes 15:00 - 17:00", seccion: "B" },
    { nombre: "Lenguaje y Literatura", docente_id: 13, horario: "Viernes 17:15 - 19:15", seccion: "B" },
    { nombre: "Historia y Geografía", docente_id: 4, horario: "Sábado 15:00 - 17:00", seccion: "B" },
    { nombre: "Historia del Perú", docente_id: 15, horario: "Sábado 17:15 - 19:15", seccion: "B" }
];

async function getNextCourseCode() {
    const [rows] = await promisePool.query('SELECT codigo FROM cursos ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) return 'CUR-0001';
    const lastCode = rows[0].codigo;
    const match = lastCode.match(/-(\d+)$/);
    const num = match ? parseInt(match[1]) + 1 : 1;
    return `CUR-${num.toString().padStart(4, '0')}`;
}

async function poblarTurnoTarde() {
    try {
        console.log("Iniciando creación de Turno Tarde...");
        
        // 1. Get active cycle
        const [ciclos] = await promisePool.query('SELECT id FROM ciclos WHERE estado = "activo" LIMIT 1');
        if (ciclos.length === 0) throw new Error("No hay ciclo activo.");
        const cicloId = ciclos[0].id;

        // 2. Get test students (IDs 18, 19, 20)
        const [estudiantes] = await promisePool.query('SELECT id FROM estudiantes WHERE id IN (18, 19, 20)');
        console.log(`Encontrados ${estudiantes.length} estudiantes para matricular.`);

        for (const item of AFTERNOON_COURSES) {
            const codigo = await getNextCourseCode();
            
            // Insert course
            const [cursoResult] = await promisePool.query(
                `INSERT INTO cursos (codigo, nombre, descripcion, cupos_totales, cupos_disponibles, precio, docente_id, ciclo_id, estado, horario, seccion) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?, ?)`,
                [codigo, item.nombre, `Curso intensivo de ${item.nombre} (Turno Tarde)`, 40, 40 - estudiantes.length, 150.00, item.docente_id, cicloId, item.horario, item.seccion]
            );
            const cursoId = cursoResult.insertId;
            console.log(`✅ Curso '${item.nombre} (B)' creado con ID: ${cursoId}`);

            // 3. Enroll students (removed ciclo_id from columns)
            for (const est of estudiantes) {
                await promisePool.query(
                    `INSERT INTO matriculas (estudiante_id, curso_id, fecha_matricula, monto_total, monto_pagado, estado_matricula) 
                     VALUES (?, ?, NOW(), 150.00, 0.00, 'activa')`,
                    [est.id, cursoId]
                );
            }
        }

        console.log("\n==== ✅ TURNO TARDE COMPLETADO EXITOSAMENTE ====");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

poblarTurnoTarde();
