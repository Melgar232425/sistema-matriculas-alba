// Script de diagnóstico: test_disponibilidad.js
// Ejecutar: node scripts/test_disponibilidad.js
require('dotenv').config();
const { promisePool } = require('../config/database');
const { parsearHorario, hayCruce, BLOQUES_PERMITIDOS, extraerDias } = require('../utils/scheduleValidator');

async function main() {
  console.log('\n=== DIAGNÓSTICO DE DISPONIBILIDAD ===\n');

  // 1. Ver todos los ciclos
  const [ciclos] = await promisePool.query('SELECT id, nombre, estado FROM ciclos ORDER BY id');
  console.log('CICLOS DISPONIBLES:');
  ciclos.forEach(c => console.log(`  ID=${c.id} | ${c.nombre} | ${c.estado}`));

  // 2. Ver cursos activos con horario en cada ciclo
  console.log('\nCURSOS ACTIVOS CON HORARIO:');
  const [cursos] = await promisePool.query(
    "SELECT id, nombre, horario, ciclo_id, estado FROM cursos WHERE estado='activo' AND horario IS NOT NULL ORDER BY ciclo_id, nombre"
  );
  cursos.forEach(c => console.log(`  ciclo_id=${c.ciclo_id} | ${c.nombre} | horario="${c.horario}"`));

  // 3. Simular el endpoint disponibilidad con Lunes para cada ciclo
  const dia = 'Lunes';
  const diasSeleccionados = extraerDias(dia);
  console.log(`\nSIMULACIÓN disponibilidad para dia="${dia}" (extraerDias = [${diasSeleccionados}]):`);

  for (const ciclo of ciclos) {
    const cursosCiclo = cursos.filter(c => c.ciclo_id === ciclo.id);
    console.log(`\n  Ciclo ID=${ciclo.id} (${ciclo.nombre}) - ${cursosCiclo.length} curso(s) activos:`);

    const ocupados = {};
    const bloquesEvaluar = BLOQUES_PERMITIDOS.map(bloque => ({
      upper: bloque.toUpperCase(),
      parsed: parsearHorario(`${dia} ${bloque}`)
    }));

    for (const curso of cursosCiclo) {
      const horarioParsed = parsearHorario(curso.horario);
      if (!horarioParsed) {
        console.log(`    [SKIP] "${curso.nombre}" horario="${curso.horario}" → no parseable`);
        continue;
      }
      const diasEnComun = horarioParsed.dias.filter(d => diasSeleccionados.includes(d));
      if (diasEnComun.length === 0) {
        console.log(`    [SKIP] "${curso.nombre}" → sin días en común con ${dia}`);
        continue;
      }
      for (const bObj of bloquesEvaluar) {
        if (!bObj.parsed) continue;
        if (hayCruce(bObj.parsed, horarioParsed)) {
          ocupados[bObj.upper] = 'Horario Ocupado';
          console.log(`    [OCUPADO] "${curso.nombre}" bloquea "${bObj.upper}"`);
        }
      }
    }
    if (Object.keys(ocupados).length === 0) {
      console.log('    → Sin ocupación detectada');
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
