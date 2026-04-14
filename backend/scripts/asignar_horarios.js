const { promisePool } = require('../config/database');

const SCHEDULES = [
    "Lunes 08:00 - 10:00",
    "Lunes 10:30 - 12:30",
    "Martes 08:00 - 10:00",
    "Martes 10:30 - 12:30",
    "Miércoles 08:00 - 10:00",
    "Miércoles 10:30 - 12:30",
    "Jueves 08:00 - 10:00",
    "Jueves 10:30 - 12:30",
    "Viernes 08:00 - 10:00",
    "Viernes 10:30 - 12:30",
    "Sábado 08:00 - 10:00",
    "Sábado 10:30 - 12:30"
];

async function asignarHorarios() {
    try {
        console.log("Obteniendo cursos activos...");
        const [cursos] = await promisePool.query('SELECT id, nombre, horario FROM cursos WHERE estado = "activo" ORDER BY id ASC');
        
        console.log(`Se encontraron ${cursos.length} cursos activos.`);
        
        for (let i = 0; i < Math.min(cursos.length, SCHEDULES.length); i++) {
            const curso = cursos[i];
            const horarioAsignado = SCHEDULES[i];
            await promisePool.query('UPDATE cursos SET horario = ? WHERE id = ?', [horarioAsignado, curso.id]);
            console.log(`Asignado horario a ${curso.nombre}: ${horarioAsignado}`);
        }
        
        console.log("==== Horarios asignados correctamente! ====");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

asignarHorarios();
