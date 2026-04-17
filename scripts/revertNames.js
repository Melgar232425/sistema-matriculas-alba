const { promisePool } = require('../config/database');

async function revertir() {
    try {
        const baseEmail = 'alexis052304';
        
        // Estudiantes
        const [estDocs] = await promisePool.query("SELECT id FROM estudiantes WHERE email LIKE ?", [baseEmail + '%@gmail.com']);
        for (let i = 0; i < estDocs.length; i++) {
            await promisePool.query(
                "UPDATE estudiantes SET nombres = ?, apellidos = ?, email = ?, nombre_apoderado = ? WHERE id = ?",
                [`Carlos Demo ${i+1}`, `González Test`, `alumno_demo${i+1}@demo.com`, `Padre Demo`, estDocs[i].id]
            );
        }

        // Docentes
        const [docDocs] = await promisePool.query("SELECT id FROM docentes WHERE email LIKE ?", [baseEmail + '%@gmail.com']);
        for (let i = 0; i < docDocs.length; i++) {
            await promisePool.query(
                "UPDATE docentes SET nombres = ?, apellidos = ?, email = ? WHERE id = ?",
                [`Docente Demo ${i+1}`, `Test`, `docente_demo${i+1}@demo.com`, docDocs[i].id]
            );
        }

        // Cursos
        const cursosNombres = ['Álgebra Avanzada', 'Geometría del Espacio', 'Lenguaje y Comunicación', 'Química Orgánica', 'Física Elemental', 'Razonamiento Verbal', 'Razonamiento Matemático', 'Historia del Perú', 'Trigonometría', 'Biología Celular'];
        if (cursosNombres.length > 0) {
            const [curDocs] = await promisePool.query("SELECT id FROM cursos WHERE nombre IN (?)", [cursosNombres]);
            for (let i = 0; i < curDocs.length; i++) {
                await promisePool.query(
                    "UPDATE cursos SET nombre = ?, descripcion = ? WHERE id = ?",
                    [`Curso Demo ${i+1}`, `Curso generado automáticamente`, curDocs[i].id]
                );
            }
        }
        
        console.log('✅ Revertido como estaba antes');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

revertir();
