const { promisePool } = require('../config/database');
const { parsearHorario, hayCruce, esBloquePermitido, BLOQUES_PERMITIDOS } = require('../utils/scheduleValidator');
const { sendTeacherCourseEmail } = require('../utils/emailService');

// Generar código de curso automático
const generarCodigoCurso = async () => {
  try {
    const [rows] = await promisePool.query(
      'SELECT codigo FROM cursos ORDER BY id DESC LIMIT 1'
    );

    if (rows.length === 0) {
      return 'CUR-001';
    }

    const ultimoCodigo = rows[0].codigo;
    const numero = parseInt(ultimoCodigo.split('-')[1]) + 1;
    return `CUR-${numero.toString().padStart(3, '0')}`;
  } catch (error) {
    throw error;
  }
};

// Obtener todos los cursos
exports.obtenerTodos = async (req, res) => {
  try {
    const { estado, ciclo_id } = req.query;
    let query = `
      SELECT c.*, d.nombres AS docente_nombres, d.apellidos AS docente_apellidos,
             ci.nombre AS ciclo_nombre 
      FROM cursos c
      LEFT JOIN docentes d ON c.docente_id = d.id
      LEFT JOIN ciclos ci ON c.ciclo_id = ci.id
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      query += ' AND c.estado = ?';
      params.push(estado);
    }

    if (ciclo_id) {
      query += ' AND c.ciclo_id = ?';
      params.push(ciclo_id);
    }

    query += ' ORDER BY c.nombre, c.seccion';

    const [cursos] = await promisePool.query(query, params);

    res.json({
      success: true,
      data: cursos,
      total: cursos.length
     });
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cursos',
      error: error.message
    });
  }
};

// Obtener curso por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [cursos] = await promisePool.query(
      `SELECT c.*, d.nombres AS docente_nombres, d.apellidos AS docente_apellidos, ci.nombre AS ciclo_nombre 
       FROM cursos c
       LEFT JOIN docentes d ON c.docente_id = d.id
       LEFT JOIN ciclos ci ON c.ciclo_id = ci.id
       WHERE c.id = ?`,
      [id]
    );

    if (cursos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Curso no encontrado'
      });
    }

    res.json({
      success: true,
      data: cursos[0]
    });
  } catch (error) {
    console.error('Error al obtener curso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener curso',
      error: error.message
    });
  }
};

// Crear nuevo curso
exports.crear = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      nivel,
      horario,
      cupos_totales,
      precio,
      fecha_inicio,
      fecha_fin,
      docente_id,
      seccion,
      aula,
      ciclo_id
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !cupos_totales || !precio || !ciclo_id) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos (nombre, cupos, precio o ciclo)'
      });
    }

    // El aula ahora se permite libremente para información (No validación por solicitud del usuario)
    
    // Validar Ciclo y Fechas
    const [ciclo] = await promisePool.query(
      'SELECT nombre, fecha_inicio, fecha_fin FROM ciclos WHERE id = ?',
      [ciclo_id]
    );

    if (ciclo.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El ciclo seleccionado no existe'
      });
    }

    // Heredar fechas del ciclo si no se proporcionan
    const finalFechaInicio = fecha_inicio || (ciclo[0].fecha_inicio ? ciclo[0].fecha_inicio.toISOString().split('T')[0] : null);
    const finalFechaFin = fecha_fin || (ciclo[0].fecha_fin ? ciclo[0].fecha_fin.toISOString().split('T')[0] : null);

    // Validar Cruces Mágicos (Docente y Aula) y Bloques de Hora Exactos
    if (horario) {
      if (!esBloquePermitido(horario)) {
        return res.status(400).json({
          success: false,
          message: 'Horario no válido. El bloque de hora debe ser exactamente uno de los turnos permitidos (ej. 7:00 AM - 9:00 AM, 2:00 PM - 4:00 PM).'
        });
      }

      const horarioParsed = parsearHorario(horario);

      if (horarioParsed) {
        // Regla Senior 1: El Aula es un espacio físico único (VALIDACIÓN GLOBAL)
        if (aula) {
          const [cursosAula] = await promisePool.query(
            `SELECT c.nombre, c.horario, ci.nombre as ciclo FROM cursos c
             JOIN ciclos ci ON c.ciclo_id = ci.id
             WHERE c.aula = ? AND c.estado = 'activo'`,
            [aula]
          );

          for (const c of cursosAula) {
            const hParsed = parsearHorario(c.horario);
            if (hParsed && hayCruce(horarioParsed, hParsed)) {
              return res.status(400).json({
                success: false,
                message: `Cruce de AULA: La "${aula}" ya está ocupada por "${c.nombre}" (${c.ciclo}) en el horario: ${c.horario}`
              });
            }
          }
        }

        // Regla Senior 2: El Docente es una persona única (VALIDACIÓN GLOBAL)
        if (docente_id) {
          const [cursosDoc] = await promisePool.query(
            `SELECT c.nombre, c.horario, ci.nombre as ciclo FROM cursos c
             JOIN ciclos ci ON c.ciclo_id = ci.id
             WHERE c.docente_id = ? AND c.estado = 'activo'`,
            [docente_id]
          );

          for (const c of cursosDoc) {
            const hParsed = parsearHorario(c.horario);
            if (hParsed && hayCruce(horarioParsed, hParsed)) {
              return res.status(400).json({
                success: false,
                message: `Cruce de DOCENTE: El profesor ya tiene asignado "${c.nombre}" (${c.ciclo}) en el horario: ${c.horario}`
              });
            }
          }
        }
      }
    }

    // Generar código de curso
    const codigo = await generarCodigoCurso();

    // Insertar curso
    const [result] = await promisePool.query(
      `INSERT INTO cursos 
       (codigo, nombre, descripcion, nivel, horario, cupos_totales, 
        cupos_disponibles, precio, fecha_inicio, fecha_fin, docente_id, seccion, aula, ciclo_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, nombre, descripcion, nivel || 'Preuniversitario', horario, cupos_totales,
        cupos_totales, precio, finalFechaInicio, finalFechaFin, docente_id || null, seccion || 'Única', aula || null, ciclo_id]
    );

    // Obtener el curso creado
    const [nuevoCurso] = await promisePool.query(
      'SELECT * FROM cursos WHERE id = ?',
      [result.insertId]
    );

    // Enviar notificación al docente si se asignó uno
    if (docente_id) {
        try {
            const [docente] = await promisePool.query('SELECT * FROM docentes WHERE id = ?', [docente_id]);
            if (docente.length > 0 && docente[0].email) {
                sendTeacherCourseEmail(docente[0], nuevoCurso[0]).catch(e => console.error('Error enviando email a docente asignado:', e));
            }
        } catch(e) {
            console.error('Error preparando email asignación curso:', e);
        }
    }

    res.status(201).json({
      success: true,
      message: 'Curso creado exitosamente',
      data: nuevoCurso[0]
    });
  } catch (error) {
    console.error('Error al crear curso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear curso',
      error: error.message
    });
  }
};

// Actualizar curso
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      nivel,
      horario,
      cupos_totales,
      cupos_disponibles,
      precio,
      fecha_inicio,
      fecha_fin,
      estado,
      docente_id,
      seccion,
      aula,
      ciclo_id
    } = req.body;

    // Verificar si el curso existe
    const [existente] = await promisePool.query(
      'SELECT id, cupos_totales, cupos_disponibles, ciclo_id, fecha_inicio, fecha_fin, docente_id FROM cursos WHERE id = ?',
      [id]
    );

    if (existente.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Curso no encontrado'
      });
    }

    // Validar fechas ilógicas
    if (fecha_inicio && fecha_fin) {
      if (new Date(fecha_fin) < new Date(fecha_inicio)) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin no puede ser anterior a la fecha de inicio'
        });
      }
    }

    // Prevenir reducción de cupos por debajo de los matriculados actuales
    if (parseInt(cupos_totales) < existente[0].cupos_totales - existente[0].cupos_disponibles) {
      return res.status(400).json({
        success: false,
        message: 'Los cupos totales no pueden ser menores a los alumnos ya matriculados'
      });
    }

    // El aula ahora se permite libremente para información (No validación)

    // Validar Ciclo y Fechas
    const targetCicloId = ciclo_id || existente[0].ciclo_id;
    const [ciclo] = await promisePool.query(
      'SELECT nombre, fecha_inicio, fecha_fin FROM ciclos WHERE id = ?',
      [targetCicloId]
    );

    // Heredar fechas del ciclo si no se proporcionan
    const finalFechaInicioAct = fecha_inicio || (ciclo.length > 0 && ciclo[0].fecha_inicio ? ciclo[0].fecha_inicio.toISOString().split('T')[0] : existente[0].fecha_inicio);
    const finalFechaFinAct = fecha_fin || (ciclo.length > 0 && ciclo[0].fecha_fin ? ciclo[0].fecha_fin.toISOString().split('T')[0] : existente[0].fecha_fin);

    // Recalcular cupos_disponibles basado en el nuevo total y los matriculados actuales
    const cuposTotalesActual = existente[0].cupos_totales ?? cupos_totales;
    const cuposDisponiblesActual = existente[0].cupos_disponibles ?? cuposTotalesActual;
    const matriculadosActuales = cuposTotalesActual - cuposDisponiblesActual;
    const finalCuposDisponibles = Math.max(0, cupos_totales - matriculadosActuales);

    // Validar Cruces Mágicos (Docente y Aula) y Bloques de Hora Exactos
    if (horario) {
      if (!esBloquePermitido(horario)) {
        return res.status(400).json({
          success: false,
          message: 'Horario no válido. El bloque de hora debe ser exactamente uno de los turnos permitidos (ej. 7:00 AM - 9:00 AM, 2:00 PM - 4:00 PM).'
        });
      }

      const horarioParsed = parsearHorario(horario);

      if (horarioParsed) {
        // Regla Senior 1: El Aula es un espacio físico único (VALIDACIÓN GLOBAL)
        const finalAula = aula !== undefined ? aula : existente[0].aula;
        if (finalAula) {
          const [cursosAula] = await promisePool.query(
            `SELECT c.nombre, c.horario, ci.nombre as ciclo FROM cursos c
             JOIN ciclos ci ON c.ciclo_id = ci.id
             WHERE c.aula = ? AND c.estado = 'activo' AND c.id != ?`,
            [finalAula, id]
          );

          for (const c of cursosAula) {
            const hParsed = parsearHorario(c.horario);
            if (hParsed && hayCruce(horarioParsed, hParsed)) {
              return res.status(400).json({
                success: false,
                message: `Cruce de AULA: La "${finalAula}" ya está ocupada por "${c.nombre}" (${c.ciclo}) en el horario: ${c.horario}`
              });
            }
          }
        }

        // Regla Senior 2: El Docente es una persona única (VALIDACIÓN GLOBAL)
        const finalDocenteId = docente_id !== undefined ? docente_id : existente[0].docente_id;
        if (finalDocenteId) {
          const [cursosDoc] = await promisePool.query(
            `SELECT c.nombre, c.horario, ci.nombre as ciclo FROM cursos c
             JOIN ciclos ci ON c.ciclo_id = ci.id
             WHERE c.docente_id = ? AND c.estado = 'activo' AND c.id != ?`,
            [finalDocenteId, id]
          );

          for (const c of cursosDoc) {
            const hParsed = parsearHorario(c.horario);
            if (hParsed && hayCruce(horarioParsed, hParsed)) {
              return res.status(400).json({
                success: false,
                message: `Cruce de DOCENTE: El profesor ya tiene asignado "${c.nombre}" (${c.ciclo}) en el horario: ${c.horario}`
              });
            }
          }
        }
      }
    }

    // Actualizar curso
    await promisePool.query(
      `UPDATE cursos 
       SET nombre = ?, descripcion = ?, nivel = ?, horario = ?, 
           cupos_totales = ?, cupos_disponibles = ?, precio = ?,
           fecha_inicio = ?, fecha_fin = ?, estado = ?, docente_id = ?, seccion = ?, aula = ?, ciclo_id = ?
       WHERE id = ?`,
      [nombre, descripcion, nivel || 'Preuniversitario', horario, cupos_totales, finalCuposDisponibles,
        precio, finalFechaInicioAct, finalFechaFinAct, estado || 'activo', docente_id || null, seccion || 'Única', aula || null, targetCicloId, id]
    );

    // Obtener el curso actualizado
    const [cursoActualizado] = await promisePool.query(
      'SELECT * FROM cursos WHERE id = ?',
      [id]
    );

    // Enviar notificación al docente si se le acaba de asignar este curso
    if (docente_id && docente_id.toString() !== (existente[0].docente_id ? existente[0].docente_id.toString() : null)) {
        try {
            const [docente] = await promisePool.query('SELECT * FROM docentes WHERE id = ?', [docente_id]);
            if (docente.length > 0 && docente[0].email) {
                sendTeacherCourseEmail(docente[0], cursoActualizado[0]).catch(e => console.error('Error enviando email actualización a docente:', e));
            }
        } catch(e) {
            console.error('Error preparando email actualización asignación curso:', e);
        }
    }

    res.json({
      success: true,
      message: 'Curso actualizado exitosamente',
      data: cursoActualizado[0]
    });
  } catch (error) {
    console.error('Error al actualizar curso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar curso',
      error: error.message
    });
  }
};

// Eliminar curso (cambiar estado a inactivo)
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el curso existe
    const [existente] = await promisePool.query(
      'SELECT id FROM cursos WHERE id = ?',
      [id]
    );

    if (existente.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Curso no encontrado'
      });
    }

    // Cambiar estado a inactivo
    await promisePool.query(
      'UPDATE cursos SET estado = ? WHERE id = ?',
      ['inactivo', id]
    );

    res.json({
      success: true,
      message: 'Curso desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar curso:', error);
    res.status(500).json({
     success: false,
      message: 'Error al eliminar curso',
      error: error.message
    });
  }
};

// Obtener cursos disponibles
exports.obtenerDisponibles = async (req, res) => {
  try {
    const [cursos] = await promisePool.query(
      `SELECT c.*, d.nombres AS docente_nombres, d.apellidos AS docente_apellidos, ci.nombre AS ciclo_nombre
       FROM cursos c 
       LEFT JOIN docentes d ON c.docente_id = d.id
       LEFT JOIN ciclos ci ON c.ciclo_id = ci.id
       WHERE c.estado = ?` ,
      ['activo']
    );

    res.json({
      success: true,
      data: cursos,
      total: cursos.length
     });
  } catch (error) {
    console.error('Error al obtener cursos disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cursos disponibles',
      error: error.message
    });
  }
};

// Obtener disponibilidad de bloques horarios para un día/ciclo/docente/aula
exports.obtenerDisponibilidadHorario = async (req, res) => {
  try {
    const { ciclo_id, dia, docente_id, aula, curso_id_excluir } = req.query;

    if (!ciclo_id || !dia) {
      return res.status(400).json({
        success: false,
        message: 'Debe indicar al menos ciclo_id y día'
      });
    }

    const { extraerDias } = require('../utils/scheduleValidator');
    const diasSeleccionados = extraerDias(dia);

    if (diasSeleccionados.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Día o rango de días no válido'
      });
    }

    // Traer cursos activos del ciclo (excluyendo, si corresponde, el curso que se está editando)
    const params = [ciclo_id];
    let query = `
      SELECT id, horario, docente_id, aula
      FROM cursos
      WHERE estado = 'activo' AND ciclo_id = ?
    `;

    if (curso_id_excluir) {
      query += ' AND id != ?';
      params.push(curso_id_excluir);
    }

    const [cursos] = await promisePool.query(query, params);

    const ocupados = {}; // Mapeo bloque -> razón

    // Pre-parsear los bloques permitidos para comparar rangos de tiempo
    const bloquesEvaluar = BLOQUES_PERMITIDOS.map(bloque => ({
      upper: bloque.toUpperCase(),
      parsed: parsearHorario(`${dia} ${bloque}`)
    }));

    for (const curso of cursos) {
      if (!curso.horario) continue;

      const horarioParsed = parsearHorario(curso.horario);
      if (!horarioParsed) continue;

      // Solo considerar cursos que se dictan en alguno de los días seleccionados
      const diasEnComun = horarioParsed.dias.filter(d => diasSeleccionados.includes(d));
      if (diasEnComun.length === 0) continue;

      for (const bObj of bloquesEvaluar) {
        if (!bObj.parsed) continue;

        // Verificamos si hay cruce real entre el bloque de la lista y el curso existente
        if (hayCruce(bObj.parsed, horarioParsed)) {
          
          const coincidenciaDocente = docente_id && curso.docente_id && Number(curso.docente_id) === Number(docente_id);
          
          if (coincidenciaDocente) {
            ocupados[bObj.upper] = 'Docente Ocupado';
          } else {
            // Regla 1:1 - Solo un curso por bloque en toda la academia
            ocupados[bObj.upper] = 'Horario Ocupado';
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        ocupados,
        totalAulasDisponibles: 1
      }
    });
  } catch (error) {
    console.error('Error al obtener disponibilidad de horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidad de horario',
      error: error.message
    });
  }
};

