const { promisePool } = require('../config/database');

// Mapping old custom strings to new standard "Bloque de Hora" used in Cursos.js
const RECTIFICATION_MAP = [
    // Lunes
    { old: "Lunes 08:00 - 10:00", new: "Lunes 7:00 AM - 9:00 AM", shift: "Turno Mañana" },
    { old: "Lunes 10:30 - 12:30", new: "Lunes 9:00 AM - 11:00 AM", shift: "Turno Mañana" },
    { old: "Lunes 15:00 - 17:00", new: "Lunes 2:00 PM - 4:00 PM", shift: "Turno Tarde" },
    { old: "Lunes 17:15 - 19:15", new: "Lunes 4:00 PM - 6:00 PM", shift: "Turno Tarde" },
    
    // Martes
    { old: "Martes 08:00 - 10:00", new: "Martes 7:00 AM - 9:00 AM", shift: "Turno Mañana" },
    { old: "Martes 10:30 - 12:30", new: "Martes 9:00 AM - 11:00 AM", shift: "Turno Mañana" },
    { old: "Martes 15:00 - 17:00", new: "Martes 2:00 PM - 4:00 PM", shift: "Turno Tarde" },
    { old: "Martes 17:15 - 19:15", new: "Martes 4:00 PM - 6:00 PM", shift: "Turno Tarde" },

    // Miércoles
    { old: "Miércoles 08:00 - 10:00", new: "Miércoles 7:00 AM - 9:00 AM", shift: "Turno Mañana" },
    { old: "Miércoles 10:30 - 12:30", new: "Miércoles 9:00 AM - 11:00 AM", shift: "Turno Mañana" },
    { old: "Miércoles 15:00 - 17:00", new: "Miércoles 2:00 PM - 4:00 PM", shift: "Turno Tarde" },
    { old: "Miércoles 17:15 - 19:15", new: "Miércoles 4:00 PM - 6:00 PM", shift: "Turno Tarde" },

    // Jueves
    { old: "Jueves 08:00 - 10:00", new: "Jueves 7:00 AM - 9:00 AM", shift: "Turno Mañana" },
    { old: "Jueves 10:30 - 12:30", new: "Jueves 9:00 AM - 11:00 AM", shift: "Turno Mañana" },
    { old: "Jueves 15:00 - 17:00", new: "Jueves 2:00 PM - 4:00 PM", shift: "Turno Tarde" },
    { old: "Jueves 17:15 - 19:15", new: "Jueves 4:00 PM - 6:00 PM", shift: "Turno Tarde" },

    // Viernes
    { old: "Viernes 08:00 - 10:00", new: "Viernes 7:00 AM - 9:00 AM", shift: "Turno Mañana" },
    { old: "Viernes 10:30 - 12:30", new: "Viernes 9:00 AM - 11:00 AM", shift: "Turno Mañana" },
    { old: "Viernes 15:00 - 17:00", new: "Viernes 2:00 PM - 4:00 PM", shift: "Turno Tarde" },
    { old: "Viernes 17:15 - 19:15", new: "Viernes 4:00 PM - 6:00 PM", shift: "Turno Tarde" },

    // Sábado
    { old: "Sábado 08:00 - 10:00", new: "Sábado 7:00 AM - 9:00 AM", shift: "Turno Mañana" },
    { old: "Sábado 10:30 - 12:30", new: "Sábado 9:00 AM - 11:00 AM", shift: "Turno Mañana" },
    { old: "Sábado 15:00 - 17:00", new: "Sábado 2:00 PM - 4:00 PM", shift: "Turno Tarde" },
    { old: "Sábado 17:15 - 19:15", new: "Sábado 4:00 PM - 6:00 PM", shift: "Turno Tarde" },
];

async function rectificarBloques() {
    try {
        console.log("Iniciando rectificación de bloques de horario...");
        
        let count = 0;
        for (const item of RECTIFICATION_MAP) {
            const [result] = await promisePool.query(
                'UPDATE cursos SET horario = ?, seccion = ? WHERE horario = ? AND estado = "activo"',
                [item.new, item.shift, item.old]
            );
            if (result.affectedRows > 0) {
                console.log(`✅ Rectificado: ${item.old} -> ${item.new} (${item.shift})`);
                count += result.affectedRows;
            }
        }

        console.log(`\n==== Se rectificaron ${count} registros de cursos ====`);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

rectificarBloques();
