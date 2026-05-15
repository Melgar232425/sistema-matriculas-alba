const { promisePool } = require('../config/database');

async function fixAulaConflicts() {
  try {
    console.log('Detectando cursos activos para reasignación de aulas...');
    const [cursos] = await promisePool.query(
      "SELECT id, nombre, horario, aula FROM cursos WHERE estado = 'activo'"
    );

    console.log(`Analizando ${cursos.length} cursos...`);

    // Aulas disponibles
    const aulas = ['Aula 1', 'Aula 2', 'Aula 3', 'Aula 4', 'Aula 5', 'Aula 6', 'Aula 7', 'Aula 8', 'Laboratorio 1', 'Laboratorio 2'];
    
    // Agrupar por horario
    const horarioGroups = {};
    cursos.forEach(c => {
      if (!horarioGroups[c.horario]) horarioGroups[c.horario] = [];
      horarioGroups[c.horario].push(c);
    });

    for (const horario in horarioGroups) {
      const group = horarioGroups[horario];
      if (group.length > 1) {
        console.log(`Conflicto en horario: ${horario} (${group.length} cursos)`);
        for (let i = 0; i < group.length; i++) {
          const newAula = aulas[i % aulas.length];
          await promisePool.query('UPDATE cursos SET aula = ? WHERE id = ?', [newAula, group[i].id]);
          console.log(`   -> Reasignado ${group[i].nombre} a ${newAula}`);
        }
      }
    }

    console.log('✅ Conflictos de aulas resueltos.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAulaConflicts();
