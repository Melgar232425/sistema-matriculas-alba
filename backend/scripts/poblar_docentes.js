// Script para generar docentes de prueba
const { promisePool } = require('../config/database');

const docentesDePrueba = [
    {
        codigo: 'DOC-001',
        nombres: 'Carlos Alberto',
        apellidos: 'Ramírez López',
        dni: '71234567',
        telefono: '987654321',
        email: 'carlos.ramirez@academiaalba.com',
        especialidad: 'Matemáticas'
    },
    {
        codigo: 'DOC-002',
        nombres: 'María Fernanda',
        apellidos: 'Gómez Sánchez',
        dni: '72345678',
        telefono: '912345678',
        email: 'maria.gomez@academiaalba.com',
        especialidad: 'Física y Química'
    },
    {
        codigo: 'DOC-003',
        nombres: 'Jorge Luis',
        apellidos: 'Martínez Ruiz',
        dni: '73456789',
        telefono: '923456789',
        email: 'jorge.martinez@academiaalba.com',
        especialidad: 'Comunicación y Literatura'
    },
    {
        codigo: 'DOC-004',
        nombres: 'Ana Rosa',
        apellidos: 'Díaz Castillo',
        dni: '74567890',
        telefono: '934567890',
        email: 'ana.diaz@academiaalba.com',
        especialidad: 'Historia y Geografía'
    },
    {
        codigo: 'DOC-005',
        nombres: 'Pedro Pablo',
        apellidos: 'Soto Vargas',
        dni: '75678901',
        telefono: '945678901',
        email: 'pedro.soto@academiaalba.com',
        especialidad: 'Biología y Anatomía'
    }
];

async function generarDocentes() {
    try {
        console.log('Verificando/Limpiando tabla docentes...');
        // Opcional: limpiar la tabla antes de insertar
        // await promisePool.query('TRUNCATE TABLE docentes'); 

        let insertados = 0;
        let ignorados = 0;

        for (const docente of docentesDePrueba) {
            try {
                await promisePool.query(
                    `INSERT INTO docentes 
                     (codigo, nombres, apellidos, dni, telefono, email, especialidad) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [docente.codigo, docente.nombres, docente.apellidos, docente.dni, docente.telefono, docente.email, docente.especialidad]
                );
                insertados++;
                console.log(`✅ Docente insertado: ${docente.nombres} ${docente.apellidos}`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⏩ Docente ignorado (ya existe): ${docente.nombres} ${docente.apellidos}`);
                    ignorados++;
                } else {
                    console.error(`❌ Error insertando a ${docente.nombres}:`, error.message);
                }
            }
        }

        console.log('\n--- Resumen ---');
        console.log(`Docentes insertados: ${insertados}`);
        console.log(`Docentes ignorados por duplicidad: ${ignorados}`);
        console.log('Proceso finalizado.');

        process.exit(0);
    } catch (error) {
        console.error('Error general del script:', error);
        process.exit(1);
    }
}

generarDocentes();
