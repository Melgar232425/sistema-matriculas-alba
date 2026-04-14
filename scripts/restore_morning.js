const path = require('path');
const { promisePool } = require(path.join(__dirname, '../config/database'));

// Mapping to restore and standardize morning shift (IDs 17-28)
const MORNING_RESTORE = [
    { id: 17, new: "Lunes 7:00 AM - 9:00 AM", shift: "Turno Mañana" },
    { id: 18, new: "Lunes 9:00 AM - 11:00 AM", shift: "Turno Mañana" },
    { id: 19, new: "Martes 7:00 AM - 9:00 AM", shift: "Turno Mañana" },
    { id: 20, new: "Martes 9:00 AM - 11:00 AM", shift: "Turno Mañana" },
    { id: 21, new: "Miércoles 7:00 AM - 9:00 AM", shift: "Turno Mañana" },
    { id: 26, new: "Miércoles 9:00 AM - 11:00 AM", shift: "Turno Mañana" },
    { id: 22, new: "Jueves 7:00 AM - 9:00 AM", shift: "Turno Mañana" },
    { id: 23, new: "Jueves 9:00 AM - 11:00 AM", shift: "Turno Mañana" },
    { id: 24, new: "Viernes 7:00 AM - 9:00 AM", shift: "Turno Mañana" },
    { id: 25, new: "Viernes 9:00 AM - 11:00 AM", shift: "Turno Mañana" },
    { id: 27, new: "Sábado 7:00 AM - 9:00 AM", shift: "Turno Mañana" },
    { id: 28, new: "Sábado 9:00 AM - 11:00 AM", shift: "Turno Mañana" }
];

async function restore() {
    try {
        console.log("Iniciando restauración de Turno Mañana...");
        
        for (const item of MORNING_RESTORE) {
            await promisePool.query(
                "UPDATE cursos SET horario = ?, seccion = ?, estado = 'activo' WHERE id = ?",
                [item.new, item.shift, item.id]
            );
            console.log(`✅ Restaurado ID ${item.id} -> ${item.new}`);
        }

        console.log("\n==== ✅ TURNO MAÑANA RESTAURADO ====");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

restore();
