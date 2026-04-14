const { promisePool } = require('../config/database');

const testStudents = [
    { nombres: 'Juan Marcos', apellidos: 'Peralta Díaz', dni: '70000001', fecha_nacimiento: '2005-04-12', telefono: '911111111', email: 'juan.peralta@gmail.com', direccion: 'Av. Las Palmas 123' },
    { nombres: 'Valeria Inés', apellidos: 'Gutiérrez Luna', dni: '70000002', fecha_nacimiento: '2006-08-25', telefono: '922222222', email: 'valeria.gutierrez@gmail.com', direccion: 'Calle Los Pinos 456' },
    { nombres: 'Diego Alonso', apellidos: 'Montoya Vargas', dni: '70000003', fecha_nacimiento: '2005-11-03', telefono: '933333333', email: 'diego.montoya@gmail.com', direccion: 'Urb. Santa Catalina 789' }
];

async function generarCodigoEstudiante() {
    const [rows] = await promisePool.query('SELECT codigo FROM estudiantes ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) return 'EST-0001';
    const ultimoCodigo = rows[0].codigo;
    const match = ultimoCodigo.match(/-(\d+)$/);
    if(match) return `EST-${(parseInt(match[1]) + 1).toString().padStart(4, '0')}`;
    return 'EST-0001';
}

async function generarCodigoMatricula() {
    const [rows] = await promisePool.query('SELECT codigo FROM matriculas ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) return 'MAT-000001';
    const ultimoCodigo = rows[0].codigo;
    const match = ultimoCodigo.match(/-(\d+)$/);
    if(match) return `MAT-${(parseInt(match[1]) + 1).toString().padStart(6, '0')}`;
    return 'MAT-000001';
}

async function poblarEstudiantesYMatriculas() {
    try {
        console.log('Iniciando poblado de estudiantes y matrículas...');
        
        // 1. Get 12 courses
        const [cursos] = await promisePool.query('SELECT id, precio, cupos_disponibles FROM cursos WHERE estado = "activo"');
        if (cursos.length < 12) {
            console.warn(`⚠️ Sólo se encontraron ${cursos.length} cursos activos. Se matriculará en los disponibles.`);
        }

        let matriculaCounter = 0;

        // 2. Insert Students
        for (const student of testStudents) {
            const [existente] = await promisePool.query('SELECT id FROM estudiantes WHERE dni = ?', [student.dni]);
            let estudianteId;

            if (existente.length > 0) {
                console.log(`El estudiante ${student.nombres} (DNI ${student.dni}) ya existe. Usando existente.`);
                estudianteId = existente[0].id;
            } else {
                const codigo = await generarCodigoEstudiante();
                const [result] = await promisePool.query(
                    `INSERT INTO estudiantes 
                     (codigo, dni, nombres, apellidos, fecha_nacimiento, direccion, telefono, email, estado) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
                    [codigo, student.dni, student.nombres, student.apellidos, student.fecha_nacimiento, student.direccion, student.telefono, student.email]
                );
                estudianteId = result.insertId;
                console.log(`✅ Estudiante ${student.nombres} ${student.apellidos} insertado.`);
            }

            // 3. Enroll in all active courses
            for (const curso of cursos) {
                // Check if already enrolled
                const [matExistente] = await promisePool.query(
                    'SELECT id FROM matriculas WHERE estudiante_id = ? AND curso_id = ? AND estado_matricula = "activa"',
                    [estudianteId, curso.id]
                );

                if (matExistente.length > 0) {
                    continue; // Already enrolled
                }

                // Create matricula
                const codMatricula = await generarCodigoMatricula();
                const fechaHoy = new Date().toISOString().split('T')[0];

                await promisePool.query(
                    `INSERT INTO matriculas 
                     (codigo, estudiante_id, curso_id, fecha_matricula, monto_total, estado_matricula) 
                     VALUES (?, ?, ?, ?, ?, 'activa')`,
                    [codMatricula, estudianteId, curso.id, fechaHoy, curso.precio]
                );
                
                // Update course quotas
                await promisePool.query(
                    `UPDATE cursos SET cupos_disponibles = cupos_disponibles - 1 WHERE id = ?`,
                    [curso.id]
                );
                matriculaCounter++;
            }
            console.log(`🎓 Estudiante ${student.nombres} matriculado en ${cursos.length} cursos.`);
        }
        
        console.log(`==== ¡Completado! Se generaron ${matriculaCounter} nuevas matrículas en total. ====`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

poblarEstudiantesYMatriculas();
