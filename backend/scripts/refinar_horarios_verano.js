const { promisePool } = require('../config/database');

/**
 * FINAL ACADEMIC REDISTRIBUTION
 * Redistributes the 12 Summer Courses across 9 teachers with a professional, 
 * non-overlapping weekly schedule (Mon-Sat).
 */

const SCHEDULE_MAP = [
    { nombre: "Aritmética", docente_id: 8, horario: "Lunes 08:00 - 10:00" },
    { nombre: "Álgebra", docente_id: 8, horario: "Lunes 10:30 - 12:30" },
    { nombre: "Geometría", docente_id: 9, horario: "Martes 08:00 - 10:00" },
    { nombre: "Trigonometría", docente_id: 9, horario: "Martes 10:30 - 12:30" },
    { nombre: "Física", docente_id: 9, horario: "Miércoles 08:00 - 10:00" },
    { nombre: "Razonamiento Matemático", docente_id: 8, horario: "Miércoles 10:30 - 12:30" },
    { nombre: "Química", docente_id: 11, horario: "Jueves 08:00 - 10:00" },
    { nombre: "Biología", docente_id: 10, horario: "Jueves 10:30 - 12:30" },
    { nombre: "Razonamiento Verbal", docente_id: 12, horario: "Viernes 08:00 - 10:00" },
    { nombre: "Lenguaje y Literatura", docente_id: 13, horario: "Viernes 10:30 - 12:30" },
    { nombre: "Historia y Geografía", docente_id: 4, horario: "Sábado 08:00 - 10:00" },
    { nombre: "Historia del Perú", docente_id: 15, horario: "Sábado 10:30 - 12:30" }
];

async function refinarHorarios() {
    try {
        console.log("Iniciando refinamiento de horarios y docentes...");
        
        // Find the active cycle
        const [ciclos] = await promisePool.query('SELECT id FROM ciclos WHERE estado = "activo" LIMIT 1');
        if (ciclos.length === 0) {
            console.error("No hay ciclo activo.");
            process.exit(1);
        }
        const cicloId = ciclos[0].id;

        for (const item of SCHEDULE_MAP) {
            const [result] = await promisePool.query(
                'UPDATE cursos SET docente_id = ?, horario = ? WHERE nombre = ? AND ciclo_id = ?',
                [item.docente_id, item.horario, item.nombre, cicloId]
            );
            
            if (result.affectedRows > 0) {
                console.log(`✅ Actualizado: ${item.nombre} -> Prof ID ${item.docente_id} | ${item.horario}`);
            } else {
                console.log(`⚠️ Advertencia: No se encontró el curso '${item.nombre}' en el ciclo activo.`);
            }
        }

        console.log("\n==== ✅ ADECUACIÓN COMPLETADA EXITOSAMENTE ====");
        process.exit(0);
    } catch (e) {
        console.error("Error durante el refinamiento:", e);
        process.exit(1);
    }
}

refinarHorarios();
