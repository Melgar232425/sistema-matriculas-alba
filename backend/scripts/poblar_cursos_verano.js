const { promisePool } = require('../config/database');

const SPECIALTY_MAP = {
  // Ciencias Exactas
  "Aritmética": ["Ingeniería / Ciencias Exactas", "Matemática / Física"],
  "Álgebra": ["Ingeniería / Ciencias Exactas", "Matemática / Física"],
  "Geometría": ["Ingeniería / Ciencias Exactas", "Matemática / Física"],
  "Trigonometría": ["Ingeniería / Ciencias Exactas", "Matemática / Física"],
  
  // Ciencias
  "Física": ["Ingeniería / Ciencias Exactas", "Matemática / Física"],
  "Química": ["Ciencias de la Salud / Biología", "Biología / Química"],
  "Biología": ["Ciencias de la Salud / Biología", "Biología / Química"],
  
  // Letras
  "Razonamiento Verbal": ["Letras / Comunicación", "Lengua / Literatura"],
  "Lenguaje y Literatura": ["Letras / Comunicación", "Lengua / Literatura"],
  
  // Otros
  "Razonamiento Matemático": ["Ingeniería / Ciencias Exactas", "Matemática / Física"],
  "Historia y Geografía": ["Ciencias Sociales / Humanidades", "Historia y Geografía"],
  "Historia del Perú": ["Ciencias Sociales / Humanidades", "Historia y Geografía"]
};

const coursesToCreate = Object.keys(SPECIALTY_MAP);

async function formatCode(num) {
    return `CUR-${num.toString().padStart(4, '0')}`;
}

async function getNextCourseNumber() {
    const [rows] = await promisePool.query('SELECT codigo FROM cursos ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) return 1;
    const ultimoCodigo = rows[0].codigo;
    // Handle cases where codigo might not exactly match 'CUR-XXXX'
    const match = ultimoCodigo.match(/-(\d+)$/);
    if(match) {
         return parseInt(match[1]) + 1;
    }
    return 1;
}

async function poblarCursos() {
    try {
        console.log('Iniciando poblado de cursos para el ciclo objetivo...');

        // 1. Buscar específicamente el ciclo "Ciclo I 2026" (nombre flexible)
        const [ciclos] = await promisePool.query(
            'SELECT id, nombre FROM ciclos WHERE estado = "activo" AND nombre LIKE ? LIMIT 1',
            ['%Ciclo I 2026%']
        );

        if (ciclos.length === 0) {
            console.error('❌ No se encontró un ciclo ACTIVO cuyo nombre contenga "Ciclo I 2026".');
            console.error('   - Verifica en la tabla de ciclos que exista,');
            console.error('   - Que esté con estado = "activo",');
            console.error('   - Y que el nombre incluya exactamente el texto Ciclo I 2026.');
            process.exit(1);
        }
        const cicloId = ciclos[0].id;
        console.log(`✅ Usando ciclo objetivo ID=${cicloId}, nombre="${ciclos[0].nombre}"`);

        // 2. Load all active teachers
        const [docentes] = await promisePool.query('SELECT id, nombres, especialidad FROM docentes WHERE estado = "activo"');
        if (docentes.length === 0) {
            console.error('❌ No hay docentes activos registrados en la base de datos.');
            process.exit(1);
        }
        
        let courseNumCounter = await getNextCourseNumber();

        for (const curso of coursesToCreate) {
            // Check if course already exists in this cycle
            const [existente] = await promisePool.query('SELECT id FROM cursos WHERE nombre = ? AND ciclo_id = ?', [curso, cicloId]);
            if (existente.length > 0) {
                console.log(`Saltando curso ${curso} - Ya existe en este ciclo.`);
                continue;
            }

            const allowedSpecialties = SPECIALTY_MAP[curso];
            
            // Find a teacher that matches the specialty
            const matchingTeachers = docentes.filter(d => allowedSpecialties.includes(d.especialidad));
            
            if (matchingTeachers.length === 0) {
                 console.log(`⚠️ No se pudo crear ${curso} - Falta un docente con especialidad en: ${allowedSpecialties.join(' o ')}`);
                 continue;
            }

            // Pick the first matching teacher (or could randomize, but first is fine as we only have 8)
            const chosenTeacher = matchingTeachers[0];

            const codigo = await formatCode(courseNumCounter);
            
            await promisePool.query(
                `INSERT INTO cursos (codigo, nombre, descripcion, cupos_totales, cupos_disponibles, precio, docente_id, ciclo_id, estado) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
                [codigo, curso, `Curso intensivo de ${curso} preparación universitaria`, 40, 40, 150.00, chosenTeacher.id, cicloId]
            );
            
            console.log(`✅ Curso '${curso}' insertado! Asignado a Prof. ${chosenTeacher.nombres} (${chosenTeacher.especialidad})`);
            courseNumCounter++;
        }
        
        console.log('==== ¡Todos los cursos necesarios insertados y vinculados al ciclo activo y docentes con éxito! ====');
        process.exit(0);
    } catch (error) {
        console.error('Error insertando cursos:', error);
        process.exit(1);
    }
}

poblarCursos();
