const { promisePool } = require('../config/database');

const docentes = [
    { nombres: 'Carlos Alberto', apellidos: 'Pérez Torres', dni: '10000001', telefono: '987654321', email: 'carlos.perez@academiaalba.com', especialidad: 'Ingeniería / Ciencias Exactas' },
    { nombres: 'María Fernanda', apellidos: 'Chuquival Castro', dni: '10000002', telefono: '987654322', email: 'maria.chuquival@academiaalba.com', especialidad: 'Matemática / Física' },
    { nombres: 'Jorge Luis', apellidos: 'Mendoza Ruiz', dni: '10000003', telefono: '987654323', email: 'jorge.mendoza@academiaalba.com', especialidad: 'Ciencias de la Salud / Biología' },
    { nombres: 'Ana Lucía', apellidos: 'García Flores', dni: '10000004', telefono: '987654324', email: 'ana.garcia@academiaalba.com', especialidad: 'Biología / Química' },
    { nombres: 'Pedro Rómulo', apellidos: 'Vásquez Silva', dni: '10000005', telefono: '987654325', email: 'pedro.vasquez@academiaalba.com', especialidad: 'Letras / Comunicación' },
    { nombres: 'Sofía Andrea', apellidos: 'Rojas Peña', dni: '10000006', telefono: '987654326', email: 'sofia.rojas@academiaalba.com', especialidad: 'Lengua / Literatura' },
    { nombres: 'Miguel Ángel', apellidos: 'Quispe Mamani', dni: '10000007', telefono: '987654327', email: 'miguel.quispe@academiaalba.com', especialidad: 'Ciencias Sociales / Humanidades' },
    { nombres: 'Luciana Valeria', apellidos: 'Correa Gómez', dni: '10000008', telefono: '987654328', email: 'luciana.correa@academiaalba.com', especialidad: 'Historia y Geografía' }
];

async function generarCodigoDocente() {
    const [rows] = await promisePool.query('SELECT codigo FROM docentes ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) return 'DOC-001';
    const ultimoCodigo = rows[0].codigo;
    const numero = parseInt(ultimoCodigo.split('-')[1]) + 1;
    return `DOC-${numero.toString().padStart(3, '0')}`;
}

async function poblarDocentes() {
    try {
        console.log('Iniciando poblado de docentes para el Ciclo Verano...');
        
        for (const docente of docentes) {
            const [estudiantes] = await promisePool.query('SELECT id FROM estudiantes WHERE dni = ?', [docente.dni]);
            const [docentesDb] = await promisePool.query('SELECT id FROM docentes WHERE dni = ?', [docente.dni]);
            
            if (estudiantes.length > 0 || docentesDb.length > 0) {
                console.log(`Saltando docente ${docente.nombres} - DNI ${docente.dni} ya existe.`);
                continue;
            }
            
            const codigo = await generarCodigoDocente();
            await promisePool.query(
                `INSERT INTO docentes (codigo, nombres, apellidos, dni, telefono, email, especialidad) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [codigo, docente.nombres, docente.apellidos, docente.dni, docente.telefono, docente.email, docente.especialidad]
            );
            console.log(`✅ Docente ${docente.nombres} ${docente.apellidos} insertado (Especialidad: ${docente.especialidad})`);
        }
        
        console.log('==== ¡Todos los docentes necesarios insertados con éxito! ====');
        process.exit(0);
    } catch (error) {
        console.error('Error insertando docentes:', error);
        process.exit(1);
    }
}

poblarDocentes();
