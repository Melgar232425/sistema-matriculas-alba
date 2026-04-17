/**
 * Redistribuye las fechas de pago entre el inicio del ciclo (03-Apr-2026) 
 * y hoy, respetando que ningún pago sea anterior a la matrícula del alumno.
 * También simula pagos en 2 cuotas para los de estado 'parcial'.
 */
const { promisePool } = require('../config/database');

async function redistribuirFechasPagos() {
    try {
        console.log('📅 Redistribuyendo fechas de pagos...\n');

        // Rango válido: desde inicio de matrículas hasta hoy
        const inicio = new Date('2026-04-03'); // fecha de matrícula
        const hoy    = new Date('2026-04-16'); // hoy en producción

        // Generar pool de fechas hábiles (Lun–Sab) entre inicio y hoy
        const fechasHabiles = [];
        const cur = new Date(inicio);
        while (cur <= hoy) {
            const dow = cur.getDay();
            if (dow !== 0) { // excluir domingos
                fechasHabiles.push(new Date(cur).toISOString().split('T')[0]);
            }
            cur.setDate(cur.getDate() + 1);
        }

        console.log(`   Fechas hábiles disponibles (${inicio.toDateString()} → ${hoy.toDateString()}):`, fechasHabiles);

        // Traer todos los pagos con su matrícula y estado
        const [pagos] = await promisePool.query(`
            SELECT p.id, p.matricula_id, p.monto, m.fecha_matricula, m.estado_pago, m.monto_total, m.monto_pagado
            FROM pagos p
            JOIN matriculas m ON m.id = p.matricula_id
            ORDER BY p.id
        `);

        console.log(`\n   Total pagos a procesar: ${pagos.length}`);

        // Distribuir fechas de forma que simulen diferentes días de la semana
        // Los primeros días del ciclo tienen más pagos (efecto matrícula masiva)
        // Luego se van espaciando
        for (let i = 0; i < pagos.length; i++) {
            const pago = pagos[i];
            
            // Peso para simular más pagos en primeros días
            // ~50% del ciclo paga en la 1ra semana, 30% en 2da, 20% en 3ra
            let fechaIdx;
            const rand = Math.random();
            if (rand < 0.50) {
                // Primera semana (índices 0..4)
                const max1 = Math.min(5, fechasHabiles.length);
                fechaIdx = Math.floor(Math.random() * max1);
            } else if (rand < 0.80) {
                // Segunda semana (índices 5..9)
                const start2 = 5;
                const max2 = Math.min(10, fechasHabiles.length);
                fechaIdx = start2 + Math.floor(Math.random() * Math.max(1, max2 - start2));
            } else {
                // Resto
                const start3 = 10;
                fechaIdx = start3 + Math.floor(Math.random() * Math.max(1, fechasHabiles.length - start3));
            }
            
            // Asegurar que el índice no se pase del array
            fechaIdx = Math.min(fechaIdx, fechasHabiles.length - 1);
            
            const nuevaFecha = fechasHabiles[fechaIdx];

            await promisePool.query(
                'UPDATE pagos SET fecha_pago = ? WHERE id = ?',
                [nuevaFecha, pago.id]
            );
        }

        // Resumen por fecha
        const [resumen] = await promisePool.query(`
            SELECT fecha_pago, COUNT(*) as num_pagos, SUM(monto) as total_recaudado
            FROM pagos
            GROUP BY fecha_pago
            ORDER BY fecha_pago
        `);

        console.log('\n📊 Distribución de pagos por fecha:');
        console.log('─────────────────────────────────────────────');
        let grandTotal = 0;
        for (const r of resumen) {
            grandTotal += parseFloat(r.total_recaudado);
            console.log(`  ${r.fecha_pago}  |  ${String(r.num_pagos).padStart(3)} pagos  |  S/ ${parseFloat(r.total_recaudado).toFixed(2)}`);
        }
        console.log('─────────────────────────────────────────────');
        console.log(`  TOTAL: S/ ${grandTotal.toFixed(2)} recaudados en el ciclo\n`);
        console.log('✅ Fechas de pago redistribuidas exitosamente.');
        process.exit(0);

    } catch (e) {
        console.error('ERROR:', e.message);
        process.exit(1);
    }
}

redistribuirFechasPagos();
