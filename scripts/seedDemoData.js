const { promisePool } = require('../config/database');

async function seedDemoData() {
    try {
        console.log('--- INICIANDO GENERACIÓN DE DATOS DE DEMOSTRACIÓN ---');

        // 1. Obtener un Ciclo Activo
        const [ciclos] = await promisePool.query("SELECT id FROM ciclos WHERE estado = 'activo' LIMIT 1");
        if (ciclos.length === 0) {
            console.error('❌ No hay ciclos activos. Crea un ciclo primero.');
            process.exit(1);
        }
        const cicloId = ciclos[0].id;
        console.log(`✅ Ciclo activo detectado (ID: ${cicloId})`);

        // 2. Generar 10 Docentes (si es que no hay suficientes)
        const especialidades = ['Aritmética', 'Álgebra', 'Geometría', 'Trigonometría', 'Física', 'Química', 'Biología', 'Lenguaje', 'Literatura', 'Historia'];
        const docentesAgregados = [];
        
        for (let i = 0; i < 10; i++) {
            const nombre = `Docente Demo ${i+1}`;
            const [result] = await promisePool.query(
                `INSERT INTO docentes (codigo, nombres, apellidos, dni, telefono, email, especialidad, estado) 
                 VALUES (?, ?, 'Test', ?, '999888777', ?, ?, 'activo') 
                 ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
                [`DOC-00${i+1}`, nombre, `9000100${i}`, `docente${i}@demo.com`, especialidades[i]]
            );
        }
        console.log('✅ 10 Docentes generados/verificados.');

        // 3. Obtener IDs de Docentes (max 10)
        const [docentesDb] = await promisePool.query("SELECT id, especialidad FROM docentes LIMIT 10");

        // 4. Generar 10 Cursos vinculados al Ciclo y a los Docentes
        const niveles = ['Preuniversitario', 'Escolar', 'Intensivo'];
        let cursoIds = [];
        for (let i = 0; i < 10; i++) {
            const doc = docentesDb[i % docentesDb.length];
            const nombreCurso = `Curso Demo de ${doc.especialidad} ${i+1}`;
            const randCode = Math.floor(Math.random() * 9000) + 1000;
            const [resCurso] = await promisePool.query(
                `INSERT INTO cursos (codigo, nombre, descripcion, nivel, precio, cupos_totales, cupos_disponibles, estado, ciclo_id, docente_id, horario, aula) 
                 VALUES (?, ?, 'Curso generado automáticamente', ?, ?, 30, 30, 'activo', ?, ?, ?, ?)`,
                [`C-D${randCode}`, nombreCurso, niveles[i % 3], 150.00 + (i * 10), cicloId, doc.id, `Lunes 1${i}:00-1${i+2}:00`, `Aula 10${i}`]
            );
            cursoIds.push(resCurso.insertId);
        }
        console.log('✅ 10 Cursos generados con horarios simulados.');

        // 5. Generar 15 Estudiantes Demo
        let estIds = [];
        console.log('Creando 15 estudiantes...');
        for (let i = 0; i < 15; i++) {
            const num = Math.floor(1000 + Math.random() * 9000);
            const dni = `7000${num}`; // DNI de 8 digitos
            const randomAge = 14 + Math.floor(Math.random() * 5); // 14 a 18 años
            const bd = new Date();
            bd.setFullYear(bd.getFullYear() - randomAge);
            const fechaNac = bd.toISOString().split('T')[0];

            const nombresEst = ['Carlos', 'María', 'Luis', 'Ana', 'Jorge', 'Sofía', 'Miguel', 'Lucía', 'Pedro', 'Carmen'];
            const apellidosEst = ['García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores'];

            const n = nombresEst[i % nombresEst.length];
            const a = apellidosEst[(i+3) % apellidosEst.length];

            const [resEst] = await promisePool.query(
                `INSERT INTO estudiantes (codigo, nombres, apellidos, dni, fecha_nacimiento, direccion, telefono, email, nombre_apoderado, telefono_apoderado)
                 VALUES (?, ?, ?, ?, ?, 'Av. Demo 123', '999666333', ?, 'Padre Demo', '987654321')`,
                [`EST-${dni}`, `${n} Demo`, `${a} Test`, dni, fechaNac, `alumno${num}@demo.com`]
            );
            estIds.push(resEst.insertId);
        }
        console.log('✅ 15 Estudiantes generados exitosamente.');

        // 6. Generar Matrículas y Pagos (para alimentar los gráficos)
        console.log('Generando matrículas y simulando ingresos financieros...');
        for (let i = 0; i < estIds.length; i++) {
            // Matricular a cada alumno en 1 o 2 cursos aleatorios
            const cId = cursoIds[i % cursoIds.length];
            
            // Simular monto con posibles deudas
            // Alumno 0, 3, 6 pagarán con deuda. El resto pagará completo.
            let tieneDeuda = (i % 3 === 0); 
            // Precio del curso:
            const [cData] = await promisePool.query("SELECT precio FROM cursos WHERE id = ?", [cId]);
            const montoT = parseFloat(cData[0].precio);
            const montoP = tieneDeuda ? (montoT / 2) : montoT; // Paga mitad o completo
            const estP = tieneDeuda ? 'parcial' : 'pagado';

            const [resMat] = await promisePool.query(
                `INSERT INTO matriculas (codigo, estudiante_id, curso_id, fecha_matricula, estado_matricula, monto_total, monto_pagado, estado_pago)
                 VALUES (?, ?, ?, CURDATE(), 'activa', ?, ?, ?)`,
                [`MAT-${Date.now()}-${i}`, estIds[i], cId, montoT, montoP, estP]
            );

            // Reducir vacantes
            await promisePool.query("UPDATE cursos SET cupos_disponibles = cupos_disponibles - 1 WHERE id = ?", [cId]);

            // Generar histórico de pagos para el Chart
            if (montoP > 0) {
                const metodos = ['efectivo', 'yape', 'plin', 'transferencia'];
                const recNum = `REC-DEMO-${Math.floor(Math.random()*10000)}`;
                await promisePool.query(
                    `INSERT INTO pagos (codigo, matricula_id, monto, fecha_pago, metodo_pago, numero_recibo)
                     VALUES (?, ?, ?, CURDATE(), ?, ?)`,
                    [`PAG-${Date.now()}-${i}`, resMat.insertId, montoP, metodos[i % metodos.length], recNum]
                );
            }
        }
        
        console.log('✅ Matrículas y Pagos simulados con éxito.');
        console.log('--- ¡El sistema ahora luce VIVO con datos reales! ---');
        process.exit(0);

    } catch (error) {
        console.error('ERROR POBLANDO DATOS:', error);
        process.exit(1);
    }
}

seedDemoData();
